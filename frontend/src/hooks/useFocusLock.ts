import { useEffect, useRef, useCallback, useState } from 'react';

export type FocusViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'right_click'
  | 'devtools_open';

export interface FocusViolation {
  id: string;
  type: FocusViolationType;
  label: string;
  timestamp: string;
  riskContribution: number;
}

interface FocusLockState {
  violations: FocusViolation[];
  violationCount: number;
  isFullscreen: boolean;
  warningVisible: boolean;
  latestViolation: FocusViolation | null;
  requestFullscreen: () => void;
  dismissWarning: () => void;
}

const VIOLATION_LABELS: Record<FocusViolationType, string> = {
  tab_switch: 'Tab Switch Detected',
  window_blur: 'Window Lost Focus',
  fullscreen_exit: 'Fullscreen Mode Exited',
  right_click: 'Right-Click Attempt Blocked',
  devtools_open: 'Developer Tools Opened',
};

const VIOLATION_RISK: Record<FocusViolationType, number> = {
  tab_switch: 15,
  window_blur: 10,
  fullscreen_exit: 12,
  right_click: 5,
  devtools_open: 20,
};

let violationCounter = 0;

function makeViolation(type: FocusViolationType): FocusViolation {
  violationCounter += 1;
  const now = new Date();
  const ts = now.toLocaleTimeString('en-US', { hour12: false });
  return {
    id: `fv-${Date.now()}-${violationCounter}`,
    type,
    label: VIOLATION_LABELS[type],
    timestamp: ts,
    riskContribution: VIOLATION_RISK[type],
  };
}

export function useFocusLock(enabled: boolean = true): FocusLockState {
  const [violations, setViolations] = useState<FocusViolation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [latestViolation, setLatestViolation] = useState<FocusViolation | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logViolation = useCallback((type: FocusViolationType) => {
    if (!enabled) return;
    const v = makeViolation(type);
    setViolations(prev => [...prev, v]);
    setLatestViolation(v);
    setWarningVisible(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => setWarningVisible(false), 5000);
  }, [enabled]);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  }, []);

  const dismissWarning = useCallback(() => {
    setWarningVisible(false);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Visibility change (tab switch)
    const handleVisibility = () => {
      if (document.hidden) {
        logViolation('tab_switch');
      }
    };

    // Window blur
    const handleBlur = () => {
      if (!document.hidden) {
        logViolation('window_blur');
      }
    };

    // Fullscreen change
    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull && violations.length > 0) {
        // Only log if exam has started (violations exist means it was in fullscreen before)
        logViolation('fullscreen_exit');
      }
    };

    // Block right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('right_click');
    };

    // Detect devtools via resize heuristic
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcut keys
      if (
        (e.ctrlKey && ['c', 'v', 'a', 'u', 's'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        logViolation('devtools_open');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [enabled, logViolation, violations.length]);

  return {
    violations,
    violationCount: violations.length,
    isFullscreen,
    warningVisible,
    latestViolation,
    requestFullscreen,
    dismissWarning,
  };
}
