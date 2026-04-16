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
  phone_detected: 5,
  tab_switch: 4,
  fullscreen_exit: 4,
  devtools_open: 5,
  right_click: 2,
  copy_paste: 4,
};

const AI_SNAPSHOT_TYPES = new Set(['gaze_deviation', 'face_absent', 'multiple_faces']);
const ENHANCED_SNAPSHOT_TYPES = new Set([
  'phone_detected',
  'multiple_faces',
  'face_absent',
  'gaze_deviation',
  'tab_switch',
  'fullscreen_exit',
  'devtools_open',
  'right_click',
  'copy_paste',
]);

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
      const newEvents = aiEvents.slice(prevAiCount.current, count);
      newEvents.forEach((ev) => {
        if (!AI_SNAPSHOT_TYPES.has(ev.type)) return;
        const ts = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false });
        capture(ev.label, 'ai_detection', RISK_WEIGHT[ev.type] ?? 2, ev.id, ts);
      });
      prevAiCount.current = count;
    }
  }, [aiEvents, capture]);

  // Watch focus violations
  useEffect(() => {
    const count = focusViolations.length;
    if (count > prevFocusCount.current && count > 0) {
      const newViolations = focusViolations.slice(prevFocusCount.current, count);
      newViolations.forEach((v) => {
        capture(v.label, 'focus_violation', v.riskContribution, v.id, v.timestamp);
      });
      prevFocusCount.current = count;
    }
  }, [focusViolations, capture]);

  // Watch enhanced monitoring events (including phone detection)
  useEffect(() => {
    const count = enhancedMonitoringEvents.length;
    if (count > prevEnhancedCount.current && count > 0) {
      const newEvents = enhancedMonitoringEvents.slice(prevEnhancedCount.current, count);
      newEvents.forEach((ev) => {
        if (!ENHANCED_SNAPSHOT_TYPES.has(ev.type)) return;
        const ts = ev.timestamp instanceof Date
          ? ev.timestamp.toLocaleTimeString('en-US', { hour12: false })
          : new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false });
        capture(
          ev.label || ev.type,
          ev.type === 'tab_switch' || ev.type === 'fullscreen_exit' || ev.type === 'devtools_open' || ev.type === 'right_click' || ev.type === 'copy_paste'
            ? 'focus_violation'
            : 'ai_detection',
          RISK_WEIGHT[ev.type] ?? 4,
          ev.id || `${ev.type}_${Date.now()}`,
          ts
        );
      });
      prevEnhancedCount.current = count;
    }
  }, [enhancedMonitoringEvents, capture]);

  return { snapshots, snapshotCount: snapshots.length };
}
