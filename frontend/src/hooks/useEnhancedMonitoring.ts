import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced monitoring hook for comprehensive exam proctoring
 * Uses YOLO ML model for accurate phone detection via backend
 * 
 * Flow: Webcam → Frame capture → Backend YOLO Model → Detect objects → If "phone" → flag
 */

export function useEnhancedMonitoring(videoRef, enabled = true) {
  const [detectionState, setDetectionState] = useState({
    isMonitoring: false,
    phoneDetected: false,
    phoneConfidence: 0,
    multipleFaces: false,
    faceCount: 0,
    gazeDirection: 'center',
    faceCovered: false,
    lighting: 'normal',
    headMovement: { x: 0, y: 0, z: 0 },
    alerts: [],
  });

  const [events, setEvents] = useState([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastEventTimeRef = useRef({});

  /**
   * Capture frame from video, downscale for faster processing, and convert to base64
   * Optimized for 500ms detection target
   */
  const captureFrame = useCallback((video: HTMLVideoElement): string | null => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    try {
      // OPTIMIZATION: Downscale to 320x240 (4x fewer pixels = ~4x faster YOLO)
      const DOWNSCALE_WIDTH = 320;
      const DOWNSCALE_HEIGHT = 240;
      
      canvas.width = DOWNSCALE_WIDTH;
      canvas.height = DOWNSCALE_HEIGHT;
      ctx.drawImage(video, 0, 0, DOWNSCALE_WIDTH, DOWNSCALE_HEIGHT);
      
      // OPTIMIZATION: Reduced quality 35% (from 50%) for faster encoding
      // Original: 0.5 (50%) = ~12-15 KB | Optimized: 0.35 (35%) = ~5-8 KB (50% faster)
      const base64 = canvas.toDataURL('image/jpeg', 0.35).split(',')[1];
      if (!base64) {
        return null;
      }
      return base64;
    } catch (error) {
      if (process.env.REACT_APP_VERBOSE_DEBUG === 'true') {
        console.error('Error capturing frame:', error);
      }
      return null;
    }
  }, []);

  /**
   * Send frame to backend YOLO for phone detection
   */
  const detectPhoneWithYOLO = useCallback(
    async (frameBase64: string): Promise<{ detected: boolean; confidence: number; count: number; boxes: Array }> => {
      try {
        // Get session token from localStorage
        const token = localStorage.getItem('token');
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Only add auth header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const requestBody = {
          image: frameBase64,
          sessionId: sessionStorage.getItem('sessionId'),
        };
        
        const response = await fetch('/api/detect/phone', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          if (process.env.REACT_APP_VERBOSE_DEBUG === 'true') {
            console.error(`HTTP ${response.status}: ${response.statusText}`);
          }
          throw new Error(`Detection failed: ${response.statusText}`);
        }

        const result = await response.json();
        const { data, success } = result;
        
        if (!success || !data) {
          return { detected: false, confidence: 0, count: 0, boxes: [] };
        }

        return data;
      } catch (error) {
        if (process.env.REACT_APP_VERBOSE_DEBUG === 'true') {
          console.error('Detection error:', error instanceof Error ? error.message : String(error));
        }
        return { detected: false, confidence: 0, count: 0, boxes: [] };
      }
    },
    []
  );

  // Debounce event recording
  const shouldRecordEvent = useCallback((eventType: string) => {
    const now = Date.now();
    const lastTime = lastEventTimeRef.current[eventType] || 0;
    const minInterval = {
      phone_detected: 5000,
      face_absent: 3000,
      multiple_faces: 5000,
      unusual_movement: 3000,
    }[eventType] || 3000;

    if (now - lastTime < minInterval) {
      return false;
    }

    lastEventTimeRef.current[eventType] = now;
    return true;
  }, []);

  /**
   * Main detection loop - YOLO-based phone detection
   * Uses setTimeout instead of setInterval to avoid blocking main thread during typing
   * Flow: Capture frame → Send to backend YOLO → Parse results → Record events
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }
    
    let isActive = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let cycleCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    const detectLoop = async () => {
      if (!isActive) return;
      
      cycleCount++;
      const videoElement = videoRef?.current;
      
      // Check video availability
      if (!videoElement) {
        console.warn(`[Cycle ${cycleCount}] ⚠️ Video element not available`);
        if (isActive) {
          timeoutId = setTimeout(detectLoop, 2000);
        }
        return;
      }

      // Check video stream status FIRST before any other operation
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      
      // If video stream is not ready, wait and retry
      if (!videoWidth || !videoHeight) {
        if (isActive) {
          timeoutId = setTimeout(detectLoop, 1000); // Shorter retry for init phase
        }
        return;
      }

      try {
        // Capture frame from video
        const frameBase64 = captureFrame(videoElement);
        if (!frameBase64) {
          errorCount++;
        } else {
          const phoneResult = await detectPhoneWithYOLO(frameBase64);
          successCount++;

          if (phoneResult.detected) {
            console.log(`%c🚨 PHONE DETECTED - ${phoneResult.confidence.toFixed(1)}% confidence (${phoneResult.count} object${phoneResult.count > 1 ? 's' : ''})`, 'color: #ff0000; font-weight: bold');
            
            if (shouldRecordEvent('phone_detected')) {
              const event = {
                id: `phone_${Date.now()}`,
                timestamp: new Date(),
                type: 'phone_detected',
                label: `Phone detected (${phoneResult.count} object${phoneResult.count > 1 ? 's' : ''})`,
                confidence: phoneResult.confidence,
                weight: 30,
                severity: 'critical',
                metadata: {
                  detectionMethod: 'yolo',
                  objectCount: phoneResult.count,
                  boxes: phoneResult.boxes,
                },
              };
              setEvents((prev) => [...prev, event]);
            }
          }

          // Update detection state
          setDetectionState((prev) => ({
            ...prev,
            phoneDetected: phoneResult.detected,
            phoneConfidence: phoneResult.confidence,
          }));
        }
      } catch (error) {
        console.error(`%c❌ Detection error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'color: #ff0000; font-weight: bold');
        errorCount++;
      } finally {
        // Schedule next detection - 500ms for faster cycle
        // 500ms total detection time allows near real-time monitoring
        if (isActive) {
          timeoutId = setTimeout(detectLoop, 500);
        }
      }
    };

    // Start the detection loop immediately (no delay for first cycle)
    // Monitoring started silently
    detectLoop();
    
    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, videoRef, captureFrame, detectPhoneWithYOLO, shouldRecordEvent]);

  return {
    ...detectionState,
    events,
    setEvents,
    // Debug info for troubleshooting
    _debug: {
      videoRefConnected: !!videoRef?.current,
      videoStreamReady: !!(videoRef?.current?.videoWidth && videoRef?.current?.videoHeight),
      videoWidth: videoRef?.current?.videoWidth || 0,
      videoHeight: videoRef?.current?.videoHeight || 0,
      eventCount: events.length,
    },
  };
}
