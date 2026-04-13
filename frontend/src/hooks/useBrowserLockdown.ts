import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Browser Lockdown Hook
 * Aggressive security measures to prevent cheating
 */

export function useBrowserLockdown(enabled = true) {
  const [lockdownState, setLockdownState] = useState({
    isLocked: false,
    violations: [],
    blockedAttempts: 0,
    shortcutsBlocked: 0,
  });

  const violationCountRef = useRef({
    devtools: 0,
    copyPaste: 0,
    altTab: 0,
    print: 0,
    inspect: 0,
  });

  const blockShortcut = useCallback((e) => {
    if (!enabled) return;

    const blocked = [];

    // DevTools Shortcuts
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
      blocked.push('devtools_f12');
      violationCountRef.current.devtools++;
    }

    // Inspect Element
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      blocked.push('inspect_element');
      violationCountRef.current.inspect++;
    }

    // Ctrl+Shift+J (DevTools Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      blocked.push('devtools_console');
      violationCountRef.current.devtools++;
    }

    // Print Shortcut
    if (e.ctrlKey && e.key === 'P') {
      e.preventDefault();
      blocked.push('print');
      violationCountRef.current.print++;
    }

    // Copy
    if (e.ctrlKey && e.key === 'C') {
      e.preventDefault();
      blocked.push('copy');
      violationCountRef.current.copyPaste++;
    }

    // Paste
    if (e.ctrlKey && e.key === 'V') {
      e.preventDefault();
      blocked.push('paste');
      violationCountRef.current.copyPaste++;
    }

    // Cut
    if (e.ctrlKey && e.key === 'X') {
      e.preventDefault();
      blocked.push('cut');
      violationCountRef.current.copyPaste++;
    }

    // Protect the source code
    if (e.ctrlKey && e.key === 'U') {
      e.preventDefault();
      blocked.push('view_source');
    }

    if (blocked.length > 0) {
      setLockdownState(prev => ({
        ...prev,
        violations: [...prev.violations, ...blocked],
        blockedAttempts: prev.blockedAttempts + 1,
      }));
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Block keyboard shortcuts
    document.addEventListener('keydown', blockShortcut);

    // Block right-click entirely (advanced)
    const blockContextMenu = (e) => {
      e.preventDefault();
      setLockdownState(prev => ({
        ...prev,
        violations: [...prev.violations, 'right_click'],
        blockedAttempts: prev.blockedAttempts + 1,
      }));
      return false;
    };
    document.addEventListener('contextmenu', blockContextMenu);

    // Block drag selection (extreme)
    const blockSelection = (e) => {
      // Allow some text selection in input fields
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    document.addEventListener('selectstart', blockSelection);

    // Detect DevTools opening by window resize
    const screenWidth = window.outerWidth - window.innerWidth;
    const screenHeight = window.outerHeight - window.innerHeight;
    
    let devtoolsOpen = screenWidth > 160 || screenHeight > 160;
    
    const checkDevTools = () => {
      const newScreenWidth = window.outerWidth - window.innerWidth;
      const newScreenHeight = window.outerHeight - window.innerHeight;
      
      if ((newScreenWidth > 160 || newScreenHeight > 160) && !devtoolsOpen) {
        devtoolsOpen = true;
        setLockdownState(prev => ({
          ...prev,
          violations: [...prev.violations, 'devtools_detected'],
          blockedAttempts: prev.blockedAttempts + 1,
        }));
      }
    };

    const devtoolsCheckInterval = setInterval(checkDevTools, 500);

    // Lock fullscreen
    const lockFullscreen = () => {
      if (!document.fullscreenElement) {
        try {
          document.documentElement.requestFullscreen();
        } catch (e) {
          console.warn('Fullscreen request failed');
        }
      }
    };

    window.addEventListener('blur', lockFullscreen);

    return () => {
      document.removeEventListener('keydown', blockShortcut);
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('selectstart', blockSelection);
      window.removeEventListener('blur', lockFullscreen);
      clearInterval(devtoolsCheckInterval);
    };
  }, [enabled, blockShortcut]);

  return lockdownState;
}
