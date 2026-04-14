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
    }

    return () => {
      // Cleanup: remove canvas on unmount
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, []);

  /**
   * Capture frame for face matching
   */
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const readyState = video.readyState;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const hasData = readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const hasSrcObject = !!video.srcObject;

    // Check if video has source
    if (!hasSrcObject) {
      return null;
    }

    // Check if video is ready and has dimensions
    if (!hasData || !videoWidth || !videoHeight) {
      return null;
    }

    try {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        return null;
      }

      canvasRef.current.width = 256;
      canvasRef.current.height = 192;

      try {
        ctx.drawImage(video, 0, 0, 256, 192);
      } catch (drawError) {
        return null;
      }

      let frameData;
      try {
        frameData = canvasRef.current.toDataURL('image/jpeg', 0.80);
      } catch (convertError) {
        return null;
      }

      return frameData;
    } catch (error) {
      if (process.env.REACT_APP_VERBOSE_DEBUG === 'true') {
        console.error('Error during frame capture:', error);
      }
      return null;
    }
  }, [videoRef]);

  /**
   * Perform face matching check
   */
  const performFaceMatch = useCallback(async () => {
    if (!enabled || !enrollmentPhotoUrl || !videoRef.current) {
      return;
    }

    const checkStartTime = Date.now();

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
            } else {
              newState.consecutiveMismatches += 1;
              newState.matchStatus = 'mismatch';
              newState.matchScore = Math.round(result.matchConfidence);
              console.error(
                '%c⚠️ FACE MISMATCH - AUTHENTICATION FAILED',
                'background: #ff4444; color: white; font-weight: bold; font-size: 14px; padding: 8px; border-radius: 3px;'
              );
              console.error('%cConfidence: ' + Math.round(result.matchConfidence) + '%', 'background: #ff6666; color: white; font-weight: bold; padding: 5px;');

              // Suspicious after 2+ consecutive mismatches
              if (newState.consecutiveMismatches >= 2) {
                newState.faceSwapSuspected = true;
                console.error('🚨 FACE SWAP SUSPECTED - Possible proxy test-taker!');
              }
            }
          }
        }

        newState.lastMatchTime = Date.now();
        return newState;
      });

    } catch (error: any) {
      if (process.env.REACT_APP_VERBOSE_DEBUG === 'true') {
        console.error('Face matching error:', {
          message: error.message,
          status: error.response?.status,
        });
      }
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
      return;
    }

    setState(prev => ({ ...prev, isActive: true }));

    // Perform first check immediately
    performFaceMatch();

    // Then set up interval
    intervalRef.current = setInterval(() => {
      performFaceMatch();
    }, checkIntervalMs);
  }, [enabled, enrollmentPhotoUrl, performFaceMatch, checkIntervalMs]);

  /**
   * Stop matching
   */
  const stopMatching = useCallback(() => {
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
