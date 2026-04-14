import { useState, useEffect, useRef, useCallback } from 'react';
import { studentAPI } from '../services/api';

/**
 * Continuous Face Matching Hook
 * Periodically compares live camera feed against enrollment photo during exam
 * Detects face swaps, proxy test-takers, and substitutions
 * 
 * VERSION: 2026-04-13 23:45:00 (with step-by-step frame capture logging)
 */

interface ContinuousFaceMatchState {
  isActive: boolean;
  lastMatchTime: number | null;
  matchScore: number | null;
  matchStatus: 'idle' | 'checking' | 'matched' | 'mismatch' | 'error';
  faceAbsentCount: number;
  multipleFacesCount: number;
  faceSwapSuspected: boolean;
  consecutiveMismatches: number;
  lastMatchPhoto: string | null;
}

interface FaceMatchResult {
  matchConfidence: number;
  faceDetected: boolean;
  faceCount: number;
  isSamePerson: boolean;
  timestamp: number;
}

export function useContinuousFaceMatching(
  videoRef: React.RefObject<HTMLVideoElement>,
  enrollmentPhotoUrl: string | null | undefined,
  enabled: boolean = true,
  checkIntervalMs: number = 30000 // 30 seconds
) {
  const [state, setState] = useState<ContinuousFaceMatchState>({
    isActive: false,
    lastMatchTime: null,
    matchScore: null,
    matchStatus: 'idle',
    faceAbsentCount: 0,
    multipleFacesCount: 0,
    faceSwapSuspected: false,
    consecutiveMismatches: 0,
    lastMatchPhoto: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const matchHistoryRef = useRef<FaceMatchResult[]>([]);

  /**
   * Initialize canvas on first use
   */
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none'; // Hide from view
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
      console.log('[Face Match] Canvas element created and attached to DOM');
    }

    return () => {
      // Cleanup: remove canvas on unmount
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
        console.log('[Face Match] Canvas element removed from DOM');
      }
    };
  }, []);

  /**
   * Capture frame for face matching
   */
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.debug('[Face Match Check] ❌ Missing refs:', {
        hasVideoRef: !!videoRef.current,
        hasCanvasRef: !!canvasRef.current,
      });
      return null;
    }

    const video = videoRef.current;
    const readyState = video.readyState;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const hasData = readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const hasSrcObject = !!video.srcObject;

    console.log('[Face Match Check] Video state check:', {
      readyState,
      'HAVE_NOTHING': 0,
      'HAVE_METADATA': 1,
      'HAVE_CURRENT_DATA': 2,
      'expected': 2,
      videoWidth,
      videoHeight,
      hasData,
      hasSrcObject,
      paused: video.paused,
      muted: video.muted,
      networkState: video.networkState,
    });

    // Check if video has source
    if (!hasSrcObject) {
      console.warn('[Face Match Check] ⏳ No srcObject assigned to video yet - stream not started');
      return null;
    }

    // Check if video is ready and has dimensions
    if (!hasData) {
      console.warn('[Face Match Check] ⏳ Video NOT ready - readyState:', readyState, '(need 2, have', readyState + ')');
      return null;
    }

    if (!videoWidth || !videoHeight) {
      console.warn('[Face Match Check] ⏳ Video has NO dimensions:', {
        videoWidth,
        videoHeight,
      });
      return null;
    }

    try {
      console.log('[Face Match Check] Step 1: Getting canvas context...');
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        console.error('[Face Match Check] ❌ Step 1 FAILED: Cannot get canvas context');
        return null;
      }
      console.log('[Face Match Check] ✅ Step 1: Canvas context obtained');

      console.log('[Face Match Check] Step 2: Setting canvas dimensions (256x192)...');
      canvasRef.current.width = 256;
      canvasRef.current.height = 192;
      console.log('[Face Match Check] ✅ Step 2: Canvas dimensions set');

      console.log('[Face Match Check] Step 3: Drawing video frame to canvas...');
      try {
        ctx.drawImage(video, 0, 0, 256, 192);
        console.log('[Face Match Check] ✅ Step 3: Frame drawn to canvas');
      } catch (drawError) {
        console.error('[Face Match Check] ❌ Step 3 FAILED: drawImage error:', drawError);
        return null;
      }

      console.log('[Face Match Check] Step 4: Converting canvas to JPEG data URL...');
      let frameData;
      try {
        frameData = canvasRef.current.toDataURL('image/jpeg', 0.80);
        console.log('[Face Match Check] ✅ Step 4: Canvas converted to data URL');
      } catch (convertError) {
        console.error('[Face Match Check] ❌ Step 4 FAILED: toDataURL error:', convertError);
        return null;
      }

      console.log('[Face Match Check] ✅ Frame captured successfully:', {
        frameSize: frameData.length,
        videoState: video.readyState,
        width: videoWidth,
        height: videoHeight,
      });
      return frameData;
    } catch (error) {
      console.error('[Face Match Check] ❌ Unexpected error during frame capture:', error);
      return null;
    }
  }, [videoRef]);

  /**
   * Perform face matching check
   */
  const performFaceMatch = useCallback(async () => {
    console.log('[Face Match Check] Pre-check conditions:', {
      enabled,
      hasEnrollmentPhoto: !!enrollmentPhotoUrl,
      hasVideoRef: !!videoRef.current,
      videoRefReady: videoRef.current ? videoRef.current.readyState : 'null',
      videoRefHasSrcObject: videoRef.current ? !!videoRef.current.srcObject : 'null',
    });

    if (!enabled || !enrollmentPhotoUrl || !videoRef.current) {
      console.warn('[Face Match Check] ⛔ Conditions not met, skipping check:', {
        enabled,
        enrollmentPhotoUrl: enrollmentPhotoUrl ? '(URL present)' : 'MISSING',
        videoRef: videoRef.current ? '(ref present)' : 'MISSING',
      });
      return;
    }

    const checkStartTime = Date.now();
    console.log(`[Face Match Check] Starting face match verification...`);

    try {
      setState(prev => ({ ...prev, matchStatus: 'checking' }));

      // Try to capture frame, with multiple retries if first attempt fails
      let frame = captureFrame();
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!frame && retryCount < maxRetries) {
        retryCount++;
        const waitTime = 100 + (retryCount * 50); // 150ms, 200ms, 250ms
        console.warn(`[Face Match Check] Attempt ${retryCount} failed, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        frame = captureFrame();
      }

      if (!frame) {
        const checkDuration = Date.now() - checkStartTime;
        console.warn(`[Face Match Check] ⏳ No frame captured after ${maxRetries} retries (${checkDuration}ms) - video stream may not be ready or has no dimensions`);
        return;
      }

      console.log('[Face Match Check] ✅ Frame captured successfully');

      // Call backend to compare faces
      console.log('[Face Match Check] 📤 Sending frame to backend for face comparison...');
      console.log('[Face Match Check] API endpoint: /students/match-face-exam');
      
      const response = await studentAPI.matchFaceForExam({
        livePhoto: frame,
        enrollmentPhotoUrl: enrollmentPhotoUrl,
      });

      console.log('[Face Match Check] 📥 Backend API response received:', response.status);

      const result: FaceMatchResult = {
        matchConfidence: response.data?.matchConfidence || 0,
        faceDetected: response.data?.faceDetected !== false,
        faceCount: response.data?.faceCount || 0,
        isSamePerson: response.data?.matchConfidence >= 70,
        timestamp: Date.now(),
      };

      console.log('[Face Match Check] 📥 Backend response received:', {
        confidence: result.matchConfidence,
        faceDetected: result.faceDetected,
        faceCount: result.faceCount,
        isSamePerson: result.isSamePerson,
      });

      matchHistoryRef.current.push(result);
      // Keep only last 10 matches
      if (matchHistoryRef.current.length > 10) {
        matchHistoryRef.current.shift();
      }

      setState(prev => {
        let newState = { ...prev };
        let alert = '';

        // 1. Check face detection
        if (!result.faceDetected) {
          newState.faceAbsentCount += 1;
          newState.matchStatus = 'error';
          alert = `❌ No face detected (${newState.faceAbsentCount} times)`;
          console.warn(alert);
        } else {
          newState.faceAbsentCount = 0;

          // 2. Check for multiple faces
          if (result.faceCount > 1) {
            newState.multipleFacesCount += 1;
            newState.matchStatus = 'mismatch';
            alert = `⚠️ Multiple faces detected (${result.faceCount} people)`;
            console.warn(alert);
          } else {
            newState.multipleFacesCount = 0;

            // 3. Check face match
            if (result.isSamePerson) {
              newState.matchStatus = 'matched';
              newState.matchScore = Math.round(result.matchConfidence);
              newState.consecutiveMismatches = 0;
              newState.lastMatchPhoto = frame;
              console.log(`✅ Face match performed: {confidence: ${Math.round(result.matchConfidence)}%, isSamePerson: true}`);
            } else {
              newState.consecutiveMismatches += 1;
              newState.matchStatus = 'mismatch';
              newState.matchScore = Math.round(result.matchConfidence);
              alert = `❌ Face match performed: {confidence: ${Math.round(result.matchConfidence)}%, isSamePerson: false}`;
              // Highlight console error with styling
              console.error(
                '%c⚠️ FACE MISMATCH - AUTHENTICATION FAILED',
                'background: #ff4444; color: white; font-weight: bold; font-size: 14px; padding: 8px; border-radius: 3px;'
              );
              console.error(
                '%cConfidence: ' + Math.round(result.matchConfidence) + '%',
                'background: #ff6666; color: white; font-weight: bold; padding: 5px;'
              );

              // Suspicious after 2+ consecutive mismatches
              if (newState.consecutiveMismatches >= 2) {
                newState.faceSwapSuspected = true;
                console.error('🚨 FACE SWAP SUSPECTED - Possible proxy test-taker!');
              }
            }
          }
        }

        const checkDuration = Date.now() - checkStartTime;
        console.log(`[Face Match Check] ✓ Completed in ${checkDuration}ms`);

        newState.lastMatchTime = Date.now();
        return newState;
      });

    } catch (error: any) {
      const checkDuration = Date.now() - checkStartTime;
      console.error(`❌ Face matching error (${checkDuration}ms):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setState(prev => ({
        ...prev,
        matchStatus: 'error',
      }));
    }
  }, [enabled, enrollmentPhotoUrl, captureFrame, videoRef]);

  /**
   * Start continuous checking
   */
  const startMatching = useCallback(() => {
    if (!enabled || !enrollmentPhotoUrl) {
      console.warn('⚠️ Continuous face matching NOT enabled:', {
        enabled,
        hasEnrollmentPhoto: !!enrollmentPhotoUrl,
      });
      return;
    }

    console.log('🔍 Starting continuous face matching (every 30s)', {
      enabled,
      hasEnrollmentPhoto: !!enrollmentPhotoUrl,
      enrollmentPhotoUrl: enrollmentPhotoUrl?.substring(0, 50) + '...',
      interval: checkIntervalMs + 'ms',
    });
    setState(prev => ({ ...prev, isActive: true }));

    // Perform first check immediately
    console.log('[Face Match] Performing initial check...');
    performFaceMatch();

    // Then set up interval
    intervalRef.current = setInterval(() => {
      console.log('[Face Match] Executing scheduled 30s interval check...');
      performFaceMatch();
    }, checkIntervalMs);
  }, [enabled, enrollmentPhotoUrl, performFaceMatch, checkIntervalMs]);

  /**
   * Stop matching
   */
  const stopMatching = useCallback(() => {
    console.log('🛑 Stopping continuous face matching');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  /**
   * Reset state (for new exam)
   */
  const reset = useCallback(() => {
    stopMatching();
    matchHistoryRef.current = [];
    setState({
      isActive: false,
      lastMatchTime: null,
      matchScore: null,
      matchStatus: 'idle',
      faceAbsentCount: 0,
      multipleFacesCount: 0,
      faceSwapSuspected: false,
      consecutiveMismatches: 0,
      lastMatchPhoto: null,
    });
  }, [stopMatching]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopMatching();
    };
  }, [stopMatching]);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (enabled && enrollmentPhotoUrl) {
      startMatching();
    } else {
      stopMatching();
    }
  }, [enabled, enrollmentPhotoUrl, startMatching, stopMatching]);

  return {
    ...state,
    startMatching,
    stopMatching,
    reset,
    performFaceMatch,
    canvasRef,
    matchHistory: matchHistoryRef.current,
    // Risk assessment helpers
    isFaceAbsent: state.faceAbsentCount > 0,
    hasMultipleFaces: state.multipleFacesCount > 0,
    isSuspicious: state.faceSwapSuspected || state.consecutiveMismatches >= 2,
    riskScore: Math.min(100,
      (state.faceAbsentCount * 10) +
      (state.multipleFacesCount * 15) +
      (state.consecutiveMismatches * 20) +
      (state.faceSwapSuspected ? 50 : 0)
    ),
  };
}
