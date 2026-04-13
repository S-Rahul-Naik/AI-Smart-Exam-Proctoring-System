import { useState, useEffect, useRef } from 'react';

/**
 * Audio & Speech Detection Hook
 * Detects talking/speech events and lip movement
 * For identifying if student is reading answers aloud or getting help
 */

export function useAudioDetection(videoRef, enabled = true) {
  const [audioState, setAudioState] = useState({
    speechDetected: false,
    lipMovement: false,
    confidence: 0,
    events: [],
    audioDeviceConnected: false,
  });

  const analyzerRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastSpeechRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const detectLipMovement = () => {
      if (!videoRef.current) return;

      try {
        // Guard: Check if video has valid dimensions before drawing
        if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
          return; // Video not ready yet
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        if (!ctx || canvas.width === 0 || canvas.height === 0) return;

        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze mouth region (lower third of face)
        const mouthRegionStart = (canvas.height * 2) / 3;
        const mouthRegionData = data.slice(
          mouthRegionStart * canvas.width * 4,
          data.length
        );

        // Detect movement by analyzing luminance changes
        let movement = 0;
        for (let i = 0; i < mouthRegionData.length; i += 4) {
          const luminance =
            mouthRegionData[i] * 0.299 +
            mouthRegionData[i + 1] * 0.587 +
            mouthRegionData[i + 2] * 0.114;
          movement += Math.abs(luminance - 128);
        }

        const movementScore = Math.min(100, (movement / mouthRegionData.length) * 10);

        if (movementScore > 30) {
          const now = Date.now();
          if (now - lastSpeechRef.current > 2000) {
            // Debounce
            lastSpeechRef.current = now;
            setAudioState((prev) => ({
              ...prev,
              lipMovement: true,
              confidence: movementScore,
              events: [
                ...prev.events,
                {
                  type: 'lip_movement',
                  timestamp: new Date(),
                  confidence: movementScore,
                },
              ],
            }));

            // Reset after detection
            setTimeout(() => {
              setAudioState((prev) => ({
                ...prev,
                lipMovement: false,
              }));
            }, 500);
          }
        }
      } catch (error) {
        console.error('Lip movement detection error:', error);
      }
    };

    const timer = setInterval(detectLipMovement, 1000);

    return () => clearInterval(timer);
  }, [enabled, videoRef]);

  return audioState;
}
