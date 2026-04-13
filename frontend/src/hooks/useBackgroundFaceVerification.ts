import { useEffect, useRef, useState } from 'react';
import { sessionAPI } from '../services/api';

interface BackgroundVerificationState {
  isVerifying: boolean;
  confidence: number;
  attempts: number;
  verified: boolean;
  autoSubmitted: boolean;
  autoSubmitReason: string | null;
  lastError: string | null;
}

/**
 * Background face verification hook
 * Runs silent face verification in background without blocking exam UI
 * Auto-submits exam if verification fails 3 times
 */
export function useBackgroundFaceVerification(
  videoRef: React.RefObject<HTMLVideoElement>,
  enrollmentPhotoUrl: string | null,
  enabled: boolean = true,
  sessionId: string | null = null,
  onAutoSubmit?: (reason: string) => void
) {
  const [state, setState] = useState<BackgroundVerificationState>({
    isVerifying: false,
    confidence: 0,
    attempts: 0,
    verified: false,
    autoSubmitted: false,
    autoSubmitReason: null,
    lastError: null,
  });

  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // Capture frame from video and convert to base64
  const captureFrame = (video: HTMLVideoElement): string | null => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    try {
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    } catch (error) {
      console.error('❌ Frame capture failed:', error);
      return null;
    }
  };

  // Perform background face verification
  const performBackgroundVerification = async () => {
    if (isRunningRef.current || !enabled || !videoRef?.current || !sessionId || !enrollmentPhotoUrl) {
      return;
    }

    if (!videoRef.current.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return; // Video not ready
    }

    isRunningRef.current = true;
    setState(prev => ({ ...prev, isVerifying: true }));

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ [BG Verification] No auth token found in localStorage - skipping verification');
        setState(prev => ({
          ...prev,
          isVerifying: false,
          lastError: 'No auth token available',
        }));
        return;
      }

      const frameBase64 = captureFrame(videoRef.current);
      if (!frameBase64) {
        throw new Error('Failed to capture frame');
      }

      // Mock confidence for now - in production, this would come from face matching service
      // Simulating varying confidence scores
      const mockConfidence = 65 + Math.random() * 30; // 65-95% range

      console.log(`🔄 [BG Verification] Sending frame to backend. Confidence: ${mockConfidence.toFixed(0)}% | Token: ${token.substring(0, 20)}...`);

      // Call backend verification endpoint using absolute URL
      const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}/verify-face-bg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          livePhotoBase64: frameBase64,
          confidence: mockConfidence,
        }),
      });

      console.log(`📊 [BG Verification] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [BG Verification] HTTP ${response.status}: ${errorText}`);
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.autoSubmitted) {
        console.error(`🚨 AUTO-SUBMIT TRIGGERED: ${result.reason}`);
        setState(prev => ({
          ...prev,
          autoSubmitted: true,
          autoSubmitReason: result.reason,
          verified: false,
          isVerifying: false,
        }));
        
        if (onAutoSubmit) {
          onAutoSubmit(result.reason);
        }
      } else {
        setState(prev => ({
          ...prev,
          confidence: result.confidence,
          attempts: result.attempts,
          verified: result.verified,
          isVerifying: false,
          lastError: result.verified ? null : result.message,
        }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Verification error';
      
      // Don't spam logs for auth failures - they're expected when token is missing
      if (!errorMsg.includes('Unauthorized') && !errorMsg.includes('401')) {
        console.error('❌ Background verification error:', error);
      }
      
      setState(prev => ({
        ...prev,
        isVerifying: false,
        lastError: errorMsg,
      }));
    } finally {
      isRunningRef.current = false;
    }
  };

  // Set up verification interval
  useEffect(() => {
    if (!enabled || !sessionId || !enrollmentPhotoUrl) {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
      return;
    }

    // Start background verification every 30 seconds
    console.log('🎬 Starting background face verification loop (every 30s)');
    
    // First verification immediately
    performBackgroundVerification();
    
    // Then every 30 seconds
    verificationIntervalRef.current = setInterval(() => {
      performBackgroundVerification();
    }, 30000);

    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
    };
  }, [enabled, sessionId, enrollmentPhotoUrl]);

  // Stop verification on unmount
  useEffect(() => {
    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
    };
  }, []);

  return state;
}
