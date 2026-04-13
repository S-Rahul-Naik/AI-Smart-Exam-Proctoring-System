import { useState, useEffect, useRef, useCallback } from 'react';
import { mockStudents } from '../mocks/students';

export interface AdminAlertNotification {
  id: string;
  studentId: string;
  studentName: string;
  riskScore: number;
  prevScore: number;
  message: string;
  timestamp: string;
  read: boolean;
}

const HIGH_RISK_THRESHOLD = 70;

function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    // Two-tone urgent ping
    const tones = [
      { freq: 1046, start: 0, dur: 0.12 },
      { freq: 880, start: 0.14, dur: 0.1 },
      { freq: 1046, start: 0.26, dur: 0.16 },
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.01);
    });
  } catch {
    // Audio not supported
  }
}

export function useAdminAlerts(riskScores: Record<string, number>) {
  const [notifications, setNotifications] = useState<AdminAlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastAlert, setToastAlert] = useState<AdminAlertNotification | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isBadgeFlashing, setIsBadgeFlashing] = useState(false);

  const prevScoresRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const markOneRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    // Skip the first render to avoid false positives on mount
    if (!initializedRef.current) {
      prevScoresRef.current = { ...riskScores };
      initializedRef.current = true;
      return;
    }

    const newAlerts: AdminAlertNotification[] = [];

    Object.entries(riskScores).forEach(([id, score]) => {
      const prev = prevScoresRef.current[id] ?? score;
      // Only fire when crossing upward through the threshold
      if (score >= HIGH_RISK_THRESHOLD && prev < HIGH_RISK_THRESHOLD) {
        const student = mockStudents.find(s => s.id === id);
        if (!student) return;

        const alert: AdminAlertNotification = {
          id: `admin-alert-${id}-${Date.now()}`,
          studentId: id,
          studentName: student.name,
          riskScore: Math.round(score),
          prevScore: Math.round(prev),
          message: `${student.name} crossed HIGH risk — score reached ${Math.round(score)}/100`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          read: false,
        };
        newAlerts.push(alert);
      }
    });

    if (newAlerts.length > 0) {
      setNotifications(prev => [...newAlerts, ...prev].slice(0, 50));
      setUnreadCount(c => c + newAlerts.length);
      setToastAlert(newAlerts[0]);
      setToastVisible(true);
      playAlertSound();

      // Badge flash
      setIsBadgeFlashing(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setIsBadgeFlashing(false), 3000);

      // Auto-dismiss toast
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 7000);
    }

    prevScoresRef.current = { ...riskScores };
  }, [riskScores]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    toastAlert,
    toastVisible,
    isBadgeFlashing,
    markAllRead,
    markOneRead,
    dismissToast,
  };
}
