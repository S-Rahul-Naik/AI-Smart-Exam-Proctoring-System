import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProctorEvent } from './useMediaPipeProctor';
import type { FocusViolation } from './useFocusLock';

export interface ViolationSnapshot {
  id: string;
  dataUrl: string;
  timestamp: string;
  reason: string;
  type: 'ai_detection' | 'focus_violation';
  riskContribution: number;
}

const SNAPSHOT_SESSION_KEY = 'proctor_snapshots_v1';
const MAX_SNAPSHOTS = 20;
const RISK_WEIGHT: Record<string, number> = {
  multiple_faces: 5,
  face_absent: 3,
  gaze_deviation: 2,
};

function captureVideoFrame(video: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  }
}

function storeSnapshotSession(snap: ViolationSnapshot) {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_SESSION_KEY);
    const existing: ViolationSnapshot[] = raw ? JSON.parse(raw) : [];
    const updated = [...existing, snap].slice(-MAX_SNAPSHOTS);
    sessionStorage.setItem(SNAPSHOT_SESSION_KEY, JSON.stringify(updated));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function readStoredSnapshots(): ViolationSnapshot[] {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aiEvents: ProctorEvent[];
  focusViolations: FocusViolation[];
  enhancedMonitoringEvents?: Array<{ type: string; label: string; timestamp: Date; id?: string }>;
}

export function useSnapshotCapture({ videoRef, aiEvents, focusViolations, enhancedMonitoringEvents = [] }: Props) {
  const [snapshots, setSnapshots] = useState<ViolationSnapshot[]>([]);
  const prevAiCount = useRef(0);
  const prevFocusCount = useRef(0);
  const prevEnhancedCount = useRef(0);

  const capture = useCallback(
    (reason: string, type: ViolationSnapshot['type'], risk: number, id: string, ts: string): void => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const dataUrl = captureVideoFrame(video);
      if (!dataUrl) return;

      const snap: ViolationSnapshot = { id, dataUrl, timestamp: ts, reason, type, riskContribution: risk };
      setSnapshots(prev => [...prev, snap].slice(-MAX_SNAPSHOTS));
      storeSnapshotSession(snap);
    },
    [videoRef]
  );

  // Watch AI events
  useEffect(() => {
    const count = aiEvents.length;
    if (count > prevAiCount.current && count > 0) {
      const ev = aiEvents[count - 1];
      const ts = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false });
      capture(ev.label, 'ai_detection', RISK_WEIGHT[ev.type] ?? 2, ev.id, ts);
      prevAiCount.current = count;
    }
  }, [aiEvents, capture]);

  // Watch focus violations
  useEffect(() => {
    const count = focusViolations.length;
    if (count > prevFocusCount.current && count > 0) {
      const v = focusViolations[count - 1];
      capture(v.label, 'focus_violation', v.riskContribution, v.id, v.timestamp);
      prevFocusCount.current = count;
    }
  }, [focusViolations, capture]);

  // Watch enhanced monitoring events (including phone detection)
  useEffect(() => {
    const count = enhancedMonitoringEvents.length;
    if (count > prevEnhancedCount.current && count > 0) {
      const ev = enhancedMonitoringEvents[count - 1];
      if (ev.type === 'phone_detected') {
        const ts = ev.timestamp instanceof Date 
          ? ev.timestamp.toLocaleTimeString('en-US', { hour12: false })
          : new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false });
        // Phone detection is critical - capture snapshot
        capture(ev.label || 'Phone Detected', 'ai_detection', 4, ev.id || `phone_${Date.now()}`, ts);
      }
      prevEnhancedCount.current = count;
    }
  }, [enhancedMonitoringEvents, capture]);

  return { snapshots, snapshotCount: snapshots.length };
}
