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
      console.log('📐 Canvas created for frame capture');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !video.videoWidth || !video.videoHeight) {
      console.warn('❌ Cannot capture frame: missing context or video dimensions');
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
        console.warn('❌ Failed to convert canvas to base64');
        return null;
      }
      return base64;
    } catch (error) {
      console.error('❌ Error capturing frame:', error);
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

        console.log(`[YOLO Req] Sending request to /api/detect/phone...`);
        
        const response = await fetch('/api/detect/phone', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        console.log(`[YOLO Res] Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          console.error(`[YOLO Err] HTTP ${response.status}: ${response.statusText}`);
          throw new Error(`Detection failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[YOLO Parse] Response:`, result);
        
        const { data, success } = result;
        
        if (!success) {
          console.warn(`[YOLO Err] Detection service returned success=false`);
          return { detected: false, confidence: 0, count: 0, boxes: [] };
        }

        if (!data) {
          console.warn(`[YOLO Err] No data in response`);
          return { detected: false, confidence: 0, count: 0, boxes: [] };
        }

        return data;
      } catch (error) {
        console.error('[YOLO Err] Detection error:', error instanceof Error ? error.message : String(error));
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
      console.warn('⚠️ YOLO Detection disabled (enabled=false)');
      return;
    }

    // DIAGNOSTIC: Forces console.log to appear immediately
    console.clear();
    console.log('%c═══════════════════════════════════════════', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.log('%c✅ YOLO DETECTION LOOP STARTED', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.log('%c═══════════════════════════════════════════', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.log('Configuration: {');
    console.log('  enabled:', enabled);
    console.log('  videoRef.current:', videoRef?.current ? 'Connected' : 'NOT CONNECTED');
    console.log('  videoRef.current type:', videoRef?.current?.constructor?.name);
    console.log('}');
    
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
        console.log(`[Cycle ${cycleCount}] ⏳ Video stream initializing... (${videoWidth}x${videoHeight})`);
        if (isActive) {
          timeoutId = setTimeout(detectLoop, 1000); // Shorter retry for init phase
        }
        return;
      }

      // Video stream is ready - proceed with detection
      console.log(`%c[Cycle ${cycleCount}] 📱 Starting YOLO detection (Video: ${videoWidth}x${videoHeight})`, 'color: #00aaff');

      try {
        // Capture frame from video
        const frameBase64 = captureFrame(videoElement);
        if (!frameBase64) {
          console.error(`[Cycle ${cycleCount}] ❌ Frame capture returned null/empty`);
          errorCount++;
        } else {
          const frameSizeKB = (frameBase64.length / 1024).toFixed(2);
          console.log(`[Cycle ${cycleCount}] 📸 Frame captured successfully: ${frameSizeKB} KB`);
          
          // Send to YOLO backend for detection
          console.log(`[Cycle ${cycleCount}] 🔍 Sending to backend at /api/detect/phone...`);
          const phoneResult = await detectPhoneWithYOLO(frameBase64);

          console.log(`%c[Cycle ${cycleCount}] ✅ Backend response received`, 'color: #00ff00', {
            detected: phoneResult.detected,
            confidence: phoneResult.confidence,
            count: phoneResult.count,
          });

          successCount++;

          if (phoneResult.detected) {
            console.log(`%c[Cycle ${cycleCount}] 🚨 PHONE DETECTED!`, 'color: #ff0000; font-weight: bold', {
              confidence: `${phoneResult.confidence.toFixed(1)}%`,
              objectCount: phoneResult.count,
              boxes: phoneResult.boxes,
            });
            
            if (shouldRecordEvent('phone_detected')) {
              console.log(`[Cycle ${cycleCount}] 📤 Recording phone detection event to state...`);
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
              console.log(`%c[Cycle ${cycleCount}] ✓ Event recorded and queued for backend`, 'color: #ff9900');
            } else {
              console.log(`[Cycle ${cycleCount}] ⏸️ Event debounced (within 5s cooldown)`);
            }
          } else if (phoneResult.confidence > 0) {
            console.log(`[Cycle ${cycleCount}] 📍 YOLO confidence: ${phoneResult.confidence.toFixed(1)}% (below threshold)`);
          } else {
            console.log(`[Cycle ${cycleCount}] ✓ No phone detected`);
          }

          // Update detection state
          setDetectionState((prev) => ({
            ...prev,
            phoneDetected: phoneResult.detected,
            phoneConfidence: phoneResult.confidence,
          }));
        }
      } catch (error) {
        console.error(`%c[Cycle ${cycleCount}] ❌ DETECTION LOOP ERROR`, 'color: #ff0000; font-weight: bold');
        console.error('Error:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
          console.error('Stack:', error.stack);
        }
        errorCount++;
      } finally {
        // Log cycle statistics every 10 cycles
        if (cycleCount % 10 === 0) {
          console.log(`%c[Stats] Cycles: ${cycleCount} | Success: ${successCount} | Errors: ${errorCount}`, 'color: #888; font-style: italic');
        }

        // Schedule next detection - 500ms for faster cycle
        // 500ms total detection time allows near real-time monitoring
        if (isActive) {
          timeoutId = setTimeout(detectLoop, 500);
        }
      }
    };

    // Start the detection loop immediately (no delay for first cycle)
    console.log('🚀 Initiating first detection cycle (runs every 500ms - optimized)...\n');
    detectLoop();
    
    return () => {
      isActive = false;
      console.log(`%c⛔ YOLO DETECTION LOOP STOPPED (Total cycles: ${cycleCount}, Success: ${successCount}, Errors: ${errorCount})`, 'color: #ff9900');
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
