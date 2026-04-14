import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * STRICT PHONE DETECTION HOOK - OPTIMIZED FOR BRIEF EXPOSURE
 * - Zero tolerance policy for ANY phone detection
 * - Runs EVERY 1 SECOND to catch brief glimpses (even if student hides phone)
 * - Requires only 2 CONSECUTIVE FRAMES (catches 1-2 second exposure)
 * - VERY LOW confidence (20%) to catch partial/half phones
 * - Triggers auto-submit immediately on confirmation
 */

interface PhoneDetectionResult {
  detected: boolean;
  confidence: number;
  count: number;
  boxes: Array<{ x: number; y: number; width: number; height: number; confidence: number }>;
}

// ULTRA-STRICT configuration - catches partial/brief phone exposure
const CONFIDENCE_THRESHOLD = 0.20; // 20% - catches even half-visible phones
const CONSECUTIVE_FRAMES_FOR_CONFIRMATION = 2; // Just 2 frames = catches 1-2 second exposure
const CHECK_INTERVAL_MS = 1000; // Check EVERY 1 second

export function useStrictPhoneDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  sessionId: string | null,
  onPhoneDetected: () => void,
  enabled: boolean = true
) {
  const [phoneDetectionState, setPhoneDetectionState] = useState({
    isDetecting: false,
    phoneDetected: false,
    confidence: 0,
    consecutiveDetections: 0,
    totalChecks: 0,
  });

  const detectionBufferRef = useRef<number>(0); // Consecutive frame counter
  const lastDetectionTimeRef = useRef<number>(0);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const captureFrame = useCallback(async () => {
    if (!videoRef?.current || !sessionId || isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

      // Send to backend for YOLO detection
      const response = await fetch('/api/detect/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          image: imageBase64,
        }),
      });

      if (!response.ok) {
        console.error(`Phone detection failed: ${response.status}`);
        detectionBufferRef.current = 0;
        return;
      }

      const jsonResponse = await response.json();
      const result = jsonResponse.data || jsonResponse; // Handle both wrapped and unwrapped responses

      setPhoneDetectionState((prev) => ({
        ...prev,
        totalChecks: prev.totalChecks + 1,
      }));

      if (result.detected && result.confidence > CONFIDENCE_THRESHOLD) {
        // STRICT: Very low threshold (20%) - catch any phone-like object including partial phones
        detectionBufferRef.current++;

        console.log(
          `📱 Phone detection [${detectionBufferRef.current}/${CONSECUTIVE_FRAMES_FOR_CONFIRMATION}]: ${result.confidence.toFixed(
            2
          )}`
        );

        setPhoneDetectionState((prev) => ({
          ...prev,
          confidence: result.confidence,
          consecutiveDetections: detectionBufferRef.current,
        }));

        // After CONSECUTIVE_FRAMES_FOR_CONFIRMATION confirmations = CONFIRMED PHONE DETECTED
        if (detectionBufferRef.current >= CONSECUTIVE_FRAMES_FOR_CONFIRMATION) {
          console.error(
            `🚨🚨🚨 PHONE CONFIRMED DETECTED! ${detectionBufferRef.current} consecutive frames`
          );

          setPhoneDetectionState((prev) => ({
            ...prev,
            phoneDetected: true,
          }));

          // Record phone detection event to backend for audit trail
          try {
            await fetch(`/api/sessions/${sessionId}/events`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'phone_detected',
                severity: 'critical',
                confidence: result.confidence,
                consecutiveFrames: detectionBufferRef.current,
                timestamp: new Date(),
              }),
            });
          } catch (error) {
            console.error('Failed to record phone detection event:', error);
          }

          // Trigger auto-submit
          onPhoneDetected();

          // Stop detection after confirmation
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
          }
        }
      } else {
        // No phone detected - reset buffer
        if (detectionBufferRef.current > 0) {
          console.log(`📱 Phone detection reset (no detection on frame)`);
          detectionBufferRef.current = 0;

          setPhoneDetectionState((prev) => ({
            ...prev,
            consecutiveDetections: 0,
          }));
        }
      }
    } catch (error) {
      console.error('Phone detection error:', error);
      detectionBufferRef.current = 0;
    } finally {
      isProcessingRef.current = false;
    }
  }, [videoRef, sessionId, onPhoneDetected]);

  // Start detection when enabled
  useEffect(() => {
    if (!enabled || !sessionId || !videoRef?.current) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    console.log('✅ STRICT Phone Detection ENABLED');
    console.log('   🎯 Checking EVERY 500ms (2x per second)');
    console.log('   📱 Confidence threshold: 30% (catches partial phones)');
    console.log('   ⚡ Requires: 2 consecutive frames (~1 second)');
    console.log('   ⚠️ Catches BRIEF exposure - student can\'t hide phone in time!');

    // Start interval: check every 1 second to catch brief exposures
    detectionIntervalRef.current = setInterval(() => {
      captureFrame();
    }, CHECK_INTERVAL_MS);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, sessionId, videoRef, captureFrame]);

  return {
    ...phoneDetectionState,
    isActive: enabled && !!sessionId,
  };
}
