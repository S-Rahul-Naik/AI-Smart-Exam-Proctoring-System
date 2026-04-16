import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { studentAPI } from '../../services/api';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

type Step = 'credentials' | 'face-verify' | 'uploading' | 'success';

const IDENTITY_LOGIN_KEY = 'proctor_identity_login';

function captureFrame(video: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState<'scanning' | 'matched' | 'failed'>('scanning');
  const [faceDetected, setFaceDetected] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    const requestedRole = searchParams.get('role');
    if (requestedRole === 'admin' || requestedRole === 'student') {
      setRole(requestedRole);
    }
  }, [searchParams]);

  // Calculate image brightness
  const calculateBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sum += (r + g + b) / 3;
    }
    return sum / (data.length / 4);
  };

  // Detect blur using Laplacian variance
  const detectBlur = (imageData: ImageData): number => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let laplacian = 0;
    let count = 0;

    for (let i = 1; i < height - 1; i++) {
      for (let j = 1; j < width - 1; j++) {
        const idx = (i * width + j) * 4;
        const center = data[idx];
        const neighbors = [
          data[((i - 1) * width + j) * 4],
          data[((i + 1) * width + j) * 4],
          data[(i * width + (j - 1)) * 4],
          data[(i * width + (j + 1)) * 4],
        ];
        const sum = neighbors.reduce((a, b) => a + b, 0);
        laplacian += Math.abs(center * 4 - sum);
        count++;
      }
    }
    return laplacian / count;
  };

  // Initialize MediaPipe Face Landmarker
  const initializeFaceLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        '/mediapipe/wasm' // Use local bundled WASM instead of CDN
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { 
          modelAssetPath: '/mediapipe/models/face_landmarker.task'
        },
        runningMode: 'VIDEO', // CRITICAL: Must be VIDEO mode for continuous stream
        numFaces: 1,
      });
      faceLandmarkerRef.current = landmarker;
    } catch (error) {
      console.error('Failed to initialize MediaPipe face landmarker:', error);
      setCamError('Face detection unavailable. Please refresh and try again.');
      throw error; // Stop if MediaPipe fails
    }
  };

  // Fallback face detection using frame variance + strict edge detection
  const detectFaceByVariance = (imageData: ImageData): boolean => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Check average brightness (reject if too dark or too bright)
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = sum / (data.length / 4);
    if (avgBrightness < 20 || avgBrightness > 240) return false;
    
    // Calculate variance
    let sumSquares = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sumSquares += brightness * brightness;
    }
    const pixels = data.length / 4;
    const variance = (sumSquares / pixels) - (avgBrightness * avgBrightness);
    
    // Must have reasonable variance (indicates structured content, not solid color)
    if (variance < 1500) return false;
    
    // Detect edges indicating facial features
    let strongEdgeCount = 0;
    
    for (let y = 10; y < height - 10; y++) {
      for (let x = 10; x < width - 10; x++) {
        const idx = (y * width + x) * 4;
        
        // Check 4 neighbors for STRONG edges
        const left = (data[(y * width + (x - 1)) * 4] + data[(y * width + (x - 1)) * 4 + 1] + data[(y * width + (x - 1)) * 4 + 2]) / 3;
        const right = (data[(y * width + (x + 1)) * 4] + data[(y * width + (x + 1)) * 4 + 1] + data[(y * width + (x + 1)) * 4 + 2]) / 3;
        const top = (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3;
        const bottom = (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3;
        
        const edgeStrength = Math.abs(left - right) + Math.abs(top - bottom);
        if (edgeStrength > 40) {
          strongEdgeCount++;
        }
      }
    }
    
    // Need reasonable edge density (5-10% of pixels have strong edges - faces have facial features)
    const edgeDensity = strongEdgeCount / ((width - 20) * (height - 20));
    const hasEnoughEdges = edgeDensity > 0.08;
    return hasEnoughEdges;
  };

  // Check if face is present using MediaPipe ONLY (no fallback)
  const isFacePresent = async (videoElement: HTMLVideoElement): Promise<boolean> => {
    // Require video to be ready
    if (!videoElement || videoElement.videoWidth === 0) return false;
    
    // Only use MediaPipe
    if (!faceLandmarkerRef.current) {
      return false; // Wait for MediaPipe to load
    }
    
    try {
      // Use performance.now() for correct timestamp
      const results = faceLandmarkerRef.current.detectForVideo(videoElement, performance.now());
      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('MediaPipe detection error:', error);
      return false;
    }
  };

  const validateFrame = (imageData: ImageData) => {
    const br = calculateBrightness(imageData);

    // Require adequate brightness (but not too strict)
    if (br < 30) {
      return false;
    }

    // Require decent image clarity (lenient threshold for steady hands)
    const blur = detectBlur(imageData);
    if (blur < 5) {
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      await login(email, password, role);
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setStep('face-verify');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start webcam when entering face-verify step
  useEffect(() => {
    if (step !== 'face-verify') return;

    async function startCam() {
      try {
        // Initialize Face Landmarker - wait for it to load
        await initializeFaceLandmarker();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Give video time to load first frame
        await new Promise(resolve => {
          const checkReady = setInterval(() => {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              clearInterval(checkReady);
              resolve(null);
            }
          }, 100);
          // Safety timeout after 3 seconds
          setTimeout(() => { clearInterval(checkReady); resolve(null); }, 3000);
        });

        let progress = 0;
        let consecutiveGoodFrames = 0;
        let elapsedTime = 0;
        const maxWaitTime = 30000; // 30 seconds max wait

        intervalRef.current = setInterval(async () => {
          elapsedTime += 60;

          // Check frame quality (main gate, not face detection)
          if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = 320;
              canvasRef.current.height = 240;
              ctx.drawImage(videoRef.current, 0, 0, 320, 240);
              const imageData = ctx.getImageData(0, 0, 320, 240);

              // ALWAYS check face detection and update warning dynamically
              const facePresent = await isFacePresent(videoRef.current);
              const br = calculateBrightness(imageData);
              setBrightness(br);
              
              if (!facePresent) {
                // Face not detected - show warning regardless of progress
                setQualityWarning('⚠️ Look at camera');
                setFaceDetected(false);
              } else {
                // Face IS detected - check quality conditions
                setFaceDetected(true);
                
                // Check quality issues even though face is present
                if (br < 30) {
                  setQualityWarning('⚠️ Too dark - need better lighting');
                } else if (br > 240) {
                  setQualityWarning('⚠️ Too bright - reduce light');
                } else {
                  const blur = detectBlur(imageData);
                  if (blur < 5) {
                    setQualityWarning('⚠️ Image too blurry - hold camera steady');
                  } else {
                    // All conditions good
                    setQualityWarning(null);
                  }
                }
              }

              // Progress calculation - ONLY increment when face is detected AND quality is good
              if (facePresent && validateFrame(imageData)) {
                consecutiveGoodFrames++;
                // Require 10 consecutive good frames before incrementing progress
                if (consecutiveGoodFrames > 10) {
                  progress += 3;
                }
              } else {
                consecutiveGoodFrames = 0;
                // Do NOT increment progress without face - require proper detection
              }
            }
          }

          setVerifyProgress(Math.min(progress, 100));

          // Capture when progress is 100 - MUST have face present
          if (progress >= 100) {
            clearInterval(intervalRef.current!);
            setQualityWarning(null);

            // Capture and freeze frame
            if (videoRef.current) {
              const dataUrl = captureFrame(videoRef.current);
              if (dataUrl) {
                setCapturedFrameUrl(dataUrl);
                setStep('uploading');

                // Upload to Cloudinary
                setUploadingToCloudinary(true);
                try {
                  const response = await studentAPI.verifyFace(dataUrl, 'login');
                  const cloudinaryUrl = response.data.faceImageUrl;
                  setFaceImageUrl(cloudinaryUrl);
                  // Store login photo in localStorage AND MongoDB for persistent access
                  localStorage.setItem(IDENTITY_LOGIN_KEY, cloudinaryUrl);
                  console.log('📸 Login photo URL:', cloudinaryUrl);
                  
                  // Save to MongoDB for enrollment verification
                  try {
                    await studentAPI.saveEnrollmentPhotoLogin(cloudinaryUrl);
                    console.log('✓ Login photo saved to database:', cloudinaryUrl.substring(0, 50) + '...');
                  } catch (dbErr) {
                    console.error('⚠️ Failed to save login photo to database:');
                    console.error('  Error:', dbErr.response?.data?.error || dbErr.message);
                    console.error('  Status:', dbErr.response?.status);
                    console.error('  URL attempted:', cloudinaryUrl);
                  }
                  
                  setVerifyStatus('matched');
                  setUploadingToCloudinary(false);
                  setTimeout(() => setStep('success'), 800);
                  setTimeout(() => {
                    streamRef.current?.getTracks().forEach(t => t.stop());
                    navigate('/exam/precheck');
                  }, 2200);
                } catch (error) {
                  console.error('Face verification upload failed:', error);
                  setUploadingToCloudinary(false);
                  setQualityWarning('Upload failed. Try again.');
                  setStep('face-verify');
                  progress = 0;
                }
              }
            }
          }

          // Timeout safety: if 30 seconds elapsed without capture, show error
          if (elapsedTime > maxWaitTime) {
            clearInterval(intervalRef.current!);
            setCamError('Detection timed out. Please try again.');
            setStep('credentials');
          }
        }, 60);
      } catch (err: any) {
        const msg = err?.name === 'NotAllowedError'
          ? 'Camera access denied — please allow camera permissions'
          : 'No camera found on this device';
        setCamError(msg);
      }
    }

    startCam();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [step, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center relative overflow-hidden font-['Inter',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=abstract%20dark%20technology%20geometric%20pattern%20with%20subtle%20glowing%20teal%20lines%20and%20nodes%20minimalist%20very%20dark%20background%20futuristic%20academic&width=1440&height=900&seq=login001&orientation=landscape"
          alt=""
          className="w-full h-full object-cover object-top opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c10] via-[#0a0c10]/95 to-[#0a0c10]" />
      </div>

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 h-screen px-16 py-12 relative z-10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-left cursor-pointer"
        >
          <img src="https://public.readdy.ai/ai/img_res/bf8ee180-749c-43bb-8a55-d2dd1e2b7747.png" alt="ProctorAI" className="w-10 h-10 object-contain" />
          <div>
            <div className="text-white font-bold text-xl">ProctorAI</div>
            <div className="text-[#4b5563] text-xs">AI Smart Exam Proctoring</div>
          </div>
        </button>
        <div>
          <h2 className="text-5xl font-black text-white mb-6 leading-tight">
            Secure. Intelligent.<br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Real-Time.</span>
          </h2>
          <p className="text-[#6b7280] text-base leading-relaxed max-w-md mb-10">
            Multi-modal behavioral analysis with temporal risk scoring. Every session is monitored, every anomaly is explained.
          </p>
          <div className="space-y-4">
            {[
              { icon: 'ri-shield-check-line', text: 'Face identity verification at login' },
              { icon: 'ri-radar-line', text: 'Continuous AI monitoring during exam' },
              { icon: 'ri-bar-chart-box-line', text: 'Temporal risk scoring with explainable alerts' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-[#9ca3af]">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/10 flex-shrink-0">
                  <i className={`${item.icon} text-teal-400`} />
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <div className="text-[#2d3139] text-xs">© 2026 ProctorAI · IEEE Research Platform</div>
      </div>

      {/* Right panel */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Credentials step */}
          {step === 'credentials' && (
            <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                <p className="text-[#6b7280] text-sm">Sign in to your ProctorAI account</p>
              </div>

              {/* Role toggle */}
              <div className="flex bg-[#0a0c10] rounded-xl p-1 mb-6">
                {(['student', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${role === r ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-[#9ca3af]'}`}
                  >
                    {r === 'student' ? 'Student' : 'Administrator'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Email Address</label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5563] text-sm" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'student' ? 'student@uni.edu' : 'admin@uni.edu'}
                      className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg pl-10 pr-4 py-3 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Password</label>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5563] text-sm" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0a0c10] border border-[#2d3139] rounded-lg pl-10 pr-4 py-3 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-[#4b5563] disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <><i className="ri-loader-4-line animate-spin" /> Authenticating...</>
                  ) : role === 'student' ? (
                    <><i className="ri-camera-line" /> Sign In &amp; Capture Reference Photo</>
                  ) : (
                    <><i className="ri-shield-keyhole-line" /> Access Admin Console</>
                  )}
                </button>
              </form>

              {loginError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-2 text-xs text-red-400">
                    <i className="ri-error-warning-line mt-0.5 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

              {role === 'student' && (
                <div className="mt-5 p-3 bg-teal-500/5 border border-teal-500/15 rounded-xl">
                  <div className="flex items-start gap-2 text-xs text-teal-400/80">
                    <i className="ri-information-line mt-0.5 flex-shrink-0" />
                    <span>Your webcam will capture a reference photo at login. This is used to verify your identity throughout the exam.</span>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center text-[#6b7280] text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {/* Face Verification step — REAL WEBCAM */}
          {step === 'face-verify' && (
            <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-1">Capturing Reference Photo</h2>
              <p className="text-[#6b7280] text-sm mb-6">Look directly at the camera and remain still • Good lighting required</p>

              {/* Hidden canvas for quality checking */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div className="relative mx-auto w-52 h-52 mb-6">
                {/* Scanning ring */}
                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${faceDetected ? 'border-teal-500' : 'border-[#2d3139]'}`} />
                {/* Real video or frozen frame */}
                <div className="absolute inset-2 rounded-full bg-[#0a0c10] overflow-hidden">
                  {!capturedFrameUrl ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover object-top scale-x-[-1]"
                    />
                  ) : (
                    <img src={capturedFrameUrl} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
                  )}
                  {camError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0c10] p-3">
                      <i className="ri-camera-off-line text-red-400 text-2xl mb-1" />
                      <span className="text-red-400 text-xs text-center">{camError}</span>
                    </div>
                  )}
                </div>
                {/* Corner brackets */}
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${c} ${faceDetected ? 'border-teal-400' : 'border-[#4b5563]'} transition-colors`} />
                ))}
                {faceDetected && verifyStatus === 'scanning' && !capturedFrameUrl && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-bounce" />
                  </div>
                )}
                {uploadingToCloudinary && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                    <div className="flex flex-col items-center">
                      <i className="ri-loader-4-line animate-spin text-teal-400 text-2xl mb-2" />
                      <span className="text-teal-400 text-xs">Saving to cloud...</span>
                    </div>
                  </div>
                )}
                {verifyStatus === 'matched' && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-teal-500/20">
                    <i className="ri-checkbox-circle-fill text-teal-400 text-4xl" />
                  </div>
                )}
              </div>

              {/* Quality Warning */}
              {qualityWarning && !capturedFrameUrl && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <i className="ri-alert-line" />
                    <span>{qualityWarning}</span>
                  </div>
                </div>
              )}

              {/* Brightness Indicator */}
              {faceDetected && !capturedFrameUrl && (
                <div className="mb-4 p-3 bg-[#0a0c10] border border-[#2d3139] rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[#6b7280]">Lighting</span>
                    <span className={`font-semibold ${brightness < 5 || brightness > 250 ? 'text-red-400' : 'text-teal-400'}`}>
                      {brightness.toFixed(0)}/255
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1e2330] rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${brightness < 5 || brightness > 250 ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${(brightness / 255) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Reference photo preview */}
              {verifyStatus === 'matched' && faceImageUrl && (
                <div className="flex items-center justify-center gap-3 mb-5 p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                  <img src={faceImageUrl} alt="Reference" className="w-16 h-12 object-cover rounded-lg border border-teal-500/30" />
                  <div className="text-left">
                    <div className="text-teal-400 text-xs font-semibold">✓ Photo saved to Cloudinary</div>
                    <div className="text-[#4b5563] text-xs">Ready for exam verification</div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Face Detected', done: faceDetected },
                  { label: 'Good Lighting', done: brightness > 5 && brightness < 250 && faceDetected },
                  { label: 'Image Quality', done: verifyProgress > 40 },
                  { label: 'Photo Captured', done: capturedFrameUrl !== null },
                  { label: 'Saved to Cloudinary', done: verifyStatus === 'matched' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${item.done ? 'bg-teal-500' : 'bg-[#2d3139]'}`}>
                      {item.done ? <i className="ri-check-line text-white text-xs" /> : <div className="w-2 h-2 rounded-full bg-[#4b5563]" />}
                    </div>
                    <span className={item.done ? 'text-white' : 'text-[#4b5563]'}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="h-1.5 bg-[#1e2330] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-100"
                  style={{ width: `${verifyProgress}%` }}
                />
              </div>
              <p className="text-teal-400 text-xs mt-2 font-medium">
                {verifyProgress}% — {verifyStatus === 'matched' ? 'Identity Profile Created' : 'Capturing...'}
              </p>
            </div>
          )}

          {/* Uploading step - shows frozen frame while uploading to Cloudinary */}
          {step === 'uploading' && (
            <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-1">Saving Your Photo</h2>
              <p className="text-[#6b7280] text-sm mb-6">Uploading to secure cloud storage...</p>

              <div className="relative mx-auto w-52 h-52 mb-6">
                {/* Frozen captured frame */}
                {capturedFrameUrl && (
                  <div className="absolute inset-0 rounded-full bg-[#0a0c10] overflow-hidden">
                    <img src={capturedFrameUrl} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                )}

                {/* Uploading overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[#2d3139] border-t-teal-500 animate-spin mb-3" />
                    <span className="text-teal-400 text-xs font-semibold">Uploading...</span>
                  </div>
                </div>

                {/* Corner brackets */}
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${c} border-teal-400 transition-colors`} />
                ))}
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Photo Captured', done: true },
                  { label: 'Uploading to Cloudinary', done: uploadingToCloudinary },
                  { label: 'Generating Secure URL', done: false },
                  { label: 'Storing in Database', done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${item.done ? 'bg-teal-500' : item.label.includes('Uploading') ? 'bg-blue-500' : 'bg-[#2d3139]'}`}>
                      {item.done ? (
                        <i className="ri-check-line text-white text-xs" />
                      ) : item.label.includes('Uploading') ? (
                        <i className="ri-loader-4-line animate-spin text-white text-xs" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#4b5563]" />
                      )}
                    </div>
                    <span className={item.done || item.label.includes('Uploading') ? 'text-white' : 'text-[#4b5563]'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success step */}
          {step === 'success' && (
            <div className="bg-[#111318] border border-teal-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-teal-500/20 mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-teal-400 text-4xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Identity Captured</h2>
              <p className="text-[#6b7280] text-sm">Reference photo stored. Redirecting to system check...</p>
            </div>
          )}

          <div className="mt-5 text-center">
            <button onClick={() => navigate('/')} className="text-[#4b5563] hover:text-[#9ca3af] text-sm transition-colors cursor-pointer">
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
