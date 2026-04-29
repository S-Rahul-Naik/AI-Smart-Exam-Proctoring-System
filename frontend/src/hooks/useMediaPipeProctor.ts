import { useState, useEffect, useRef, useCallback } from 'react';

export type GazeDirection = 'center' | 'left' | 'right' | 'down';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ProctorEvent {
  id: string;
  timestamp: number;
  type: 'gaze_deviation' | 'face_absent' | 'multiple_faces';
  label: string;
  weight: number;
  gazeDir?: GazeDirection;
}

export interface DetectionFrame {
  faceCount: number;
  gazeDirection: GazeDirection;
}

export interface ProctorState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  faceCount: number;
  gazeDirection: GazeDirection;
  riskScore: number;
  riskLevel: RiskLevel;
  sessionEvents: ProctorEvent[];
  recentEvents: ProctorEvent[];
  fps: number;
}

const TEMPORAL_WINDOW_MS = 30_000;
const RISK_WEIGHTS = { face_absent: 3, gaze_deviation: 2, multiple_faces: 5 };
const GAZE_DEVIATED: GazeDirection[] = ['left', 'right', 'down'];
const FACE_ABSENT_LABEL = 'Face not visible in frame';
const MULTIPLE_FACES_LABEL = 'Multiple faces detected';

function computeRiskFromEvents(events: ProctorEvent[]): number {
  const now = Date.now();
  const recent = events.filter(e => now - e.timestamp < TEMPORAL_WINDOW_MS);
  const raw = recent.reduce((acc, e) => acc + e.weight, 0);
  return Math.min(100, Math.round(raw * 1.4));
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function estimateGaze(landmarks: { x: number; y: number; z: number }[]): GazeDirection {
  if (!landmarks || landmarks.length < 478) return 'center';

  const noseTip = landmarks[1];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const chin = landmarks[152];
  const forehead = landmarks[10];

  const faceWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
  const faceCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;

  const normX = (noseTip.x - faceCenterX) / (faceWidth + 0.001);
  const normY = (noseTip.y - faceCenterY) / (Math.abs(chin.y - forehead.y) + 0.001);

  if (normY > 0.18) return 'down';
  if (normX < -0.12) return 'left';
  if (normX > 0.12) return 'right';
  return 'center';
}

export function useMediaPipeProctor(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<ProctorState>({
    isReady: false,
    isLoading: true,
    error: null,
    faceCount: 0,
    gazeDirection: 'center',
    riskScore: 0,
    riskLevel: 'low',
    sessionEvents: [],
    recentEvents: [],
    fps: 0,
  });

  const faceLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const lastProcessRef = useRef<number>(0);
  const eventsRef = useRef<ProctorEvent[]>([]);
  const fpsCountRef = useRef<{ count: number; time: number }>({ count: 0, time: Date.now() });
  const lastGazeDevRef = useRef<number>(0);
  const lastFaceAbsRef = useRef<number>(0);
  const lastMultiRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const addEvent = useCallback((type: ProctorEvent['type'], label: string, extra?: Partial<ProctorEvent>) => {
    const now = Date.now();
    const debounceMs = type === 'face_absent' ? 3000 : type === 'gaze_deviation' ? 4000 : 5000;
    const lastRef = type === 'face_absent' ? lastFaceAbsRef : type === 'gaze_deviation' ? lastGazeDevRef : lastMultiRef;
    if (now - lastRef.current < debounceMs) return;
    lastRef.current = now;

    const ev: ProctorEvent = {
      id: `${type}-${now}`,
      timestamp: now,
      type,
      label,
      weight: RISK_WEIGHTS[type],
      ...extra,
    };
    eventsRef.current = [...eventsRef.current, ev];
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    const now = performance.now();
    if (now - lastProcessRef.current < 500) return;
    lastProcessRef.current = now;

    let result: any;
    try {
      result = landmarker.detectForVideo(video, now);
    } catch {
      return;
    }

    const faces = result?.faceLandmarks ?? [];
    const faceCount = faces.length;

    let gazeDirection: GazeDirection = 'center';
    if (faceCount === 1) {
      gazeDirection = estimateGaze(faces[0]);
    }

    // Event detection
    if (faceCount === 0) {
      addEvent('face_absent', FACE_ABSENT_LABEL);
    } else if (faceCount > 1) {
      addEvent('multiple_faces', MULTIPLE_FACES_LABEL);
    }
    if (faceCount === 1 && GAZE_DEVIATED.includes(gazeDirection)) {
      const dirLabel = `Gaze detected: looking ${gazeDirection}`;
      addEvent('gaze_deviation', dirLabel, { gazeDir: gazeDirection });
    }

    const riskScore = computeRiskFromEvents(eventsRef.current);
    const now2 = Date.now();
    const recentEvents = eventsRef.current.filter(e => now2 - e.timestamp < TEMPORAL_WINDOW_MS);

    // FPS tracking
    fpsCountRef.current.count += 1;
    const elapsed = Date.now() - fpsCountRef.current.time;
    let fps = state.fps;
    if (elapsed > 2000) {
      fps = Math.round((fpsCountRef.current.count / elapsed) * 1000);
      fpsCountRef.current = { count: 0, time: Date.now() };
    }

    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        faceCount,
        gazeDirection,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        sessionEvents: eventsRef.current,
        recentEvents,
        fps,
      }));
    }
  }, [addEvent, videoRef, state.fps]);

  const loop = useCallback(() => {
    processFrame();
    animFrameRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;

          // In React StrictMode dev, mount/unmount can interrupt play() with AbortError.
          // Treat that as expected teardown noise rather than a hard initialization failure.
          try {
            await video.play();
          } catch (playErr: any) {
            if (!(cancelled || playErr?.name === 'AbortError')) {
              throw playErr;
            }
          }
        }

        // Suppress console warnings during MediaPipe/WASM initialization
        const originalWarn = console.warn;
        const originalError = console.error;
        console.warn = () => {}; // Suppress warnings
        console.error = () => {}; // Suppress errors
        
        try {
          const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
          );

          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 2,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          });
        } finally {
          // Restore original console methods
          console.warn = originalWarn;
          console.error = originalError;
        }

        if (isMountedRef.current) {
          setState(prev => ({ ...prev, isReady: true, isLoading: false, error: null }));
          animFrameRef.current = requestAnimationFrame(loop);
        }
      } catch (err: any) {
        const msg = err?.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions.'
          : `Failed to initialize AI engine: ${err?.message ?? 'Unknown error'}`;
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, isLoading: false, error: msg }));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
      if (faceLandmarkerRef.current) {
        try { faceLandmarkerRef.current.close(); } catch { /* noop */ }
        faceLandmarkerRef.current = null;
      }
    };
  }, [loop, videoRef]);

  return state;
}
