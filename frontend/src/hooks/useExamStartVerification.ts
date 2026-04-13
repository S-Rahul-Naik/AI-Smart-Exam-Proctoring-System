import { useState, useEffect, useRef, useCallback } from 'react';
import { studentAPI } from '../services/api';

/**
 * Exam Start Verification Hook
 * Mandatory face capture and matching before exam begins
 * Ensures continuity from enrollment to exam start
 */

interface ExamStartVerificationState {
  status: 'waiting' | 'capturing' | 'comparing' | 'verified' | 'failed' | 'max_attempts';
  attemptCount: number;
  maxAttempts: number;
  matchScore: number | null;
  capturedFrame: string | null;
  enrollmentFrame: string | null;
  error: string | null;
  lastVerificationTime: number | null;
}

export function useExamStartVerification(videoRef: React.RefObject<HTMLVideoElement>, enrollmentPhotoUrl?: string) {
  const [state, setState] = useState<ExamStartVerificationState>({
    status: 'waiting',
    attemptCount: 0,
    maxAttempts: 3,
    matchScore: null,
    capturedFrame: null,
    enrollmentFrame: null,
    error: null,
    lastVerificationTime: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const verificationTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Capture a frame from the video feed
   */
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas reference not available');
      return null;
    }

    try {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return null;

      canvasRef.current.width = 320;
      canvasRef.current.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      
      return canvasRef.current.toDataURL('image/jpeg', 0.85);
    } catch (error) {
      console.error('❌ Failed to capture frame:', error);
      return null;
    }
  }, [videoRef]);

  /**
   * Compare captured frame with enrollment photo using backend API
   */
  const compareWithEnrollment = useCallback(async (capturedUrl: string, enrollmentUrl?: string) => {
    if (!capturedUrl) {
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Failed to capture frame',
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, status: 'comparing' }));

      // Send to backend for face comparison using ArcFace or similar
      const response = await studentAPI.comparePhotoForExam({
        capturedPhoto: capturedUrl,
        enrollmentPhoto: enrollmentUrl,
      });

      const matchScore = response.data?.matchConfidence || 0;
      const threshold = 70; // 70% match confidence required

      console.log(`📸 Face Comparison Result: ${matchScore.toFixed(1)}% match`);

      if (matchScore >= threshold) {
        setState(prev => ({
          ...prev,
          status: 'verified',
          matchScore: Math.round(matchScore),
          capturedFrame: capturedUrl,
          lastVerificationTime: Date.now(),
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          status: 'failed',
          matchScore: Math.round(matchScore),
          error: `Face match insufficient (${Math.round(matchScore)}%). Required: 70%`,
          attemptCount: prev.attemptCount + 1,
          capturedFrame: capturedUrl,
        }));
        return false;
      }
    } catch (error) {
      console.error('❌ Face comparison failed:', error);
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: `Verification failed: ${error.message}`,
        attemptCount: prev.attemptCount + 1,
      }));
      return false;
    }
  }, []);

  /**
   * Start the verification process
   */
  const startVerification = useCallback(async () => {
    if (state.attemptCount >= state.maxAttempts) {
      setState(prev => ({ ...prev, status: 'max_attempts' }));
      return false;
    }

    if (!videoRef.current || videoRef.current.readyState !== 4) {
      console.error('❌ Video not ready');
      setState(prev => ({
        ...prev,
        error: 'Camera not ready. Please check permissions.',
      }));
      return false;
    }

    const frame = captureFrame();
    if (!frame) {
      setState(prev => ({
        ...prev,
        error: 'Failed to capture frame',
      }));
      return false;
    }

    return await compareWithEnrollment(frame, enrollmentPhotoUrl);
  }, [captureFrame, compareWithEnrollment, enrollmentPhotoUrl, state.attemptCount, state.maxAttempts, videoRef]);

  /**
   * Reset for retry
   */
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'waiting',
      matchScore: null,
      error: null,
    }));
  }, []);

  /**
   * Skip verification (for testing/admin)
   */
  const skipVerification = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'verified',
      matchScore: 100,
      lastVerificationTime: Date.now(),
    }));
    return true;
  }, []);

  return {
    ...state,
    captureFrame,
    startVerification,
    reset,
    skipVerification,
    canvasRef,
    isVerified: state.status === 'verified',
    canRetry: state.attemptCount < state.maxAttempts,
    retriesRemaining: state.maxAttempts - state.attemptCount,
  };
}
