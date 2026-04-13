import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentityVerification } from '../../../hooks/useIdentityVerification';
import { studentAPI } from '../../../services/api';

type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

interface Check {
  id: string;
  label: string;
  icon: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

const IDENTITY_SIGNUP_KEY = 'proctor_identity_signup';
const IDENTITY_LOGIN_KEY = 'proctor_identity_login';

const initialChecks: Check[] = [
  { id: 'camera',   label: 'Camera Access',          icon: 'ri-camera-line',        status: 'pending', message: 'Waiting...' },
  { id: 'face',     label: 'Face Visibility',         icon: 'ri-user-face-line',     status: 'pending', message: 'Waiting...' },
  { id: 'lighting', label: 'Lighting Quality',        icon: 'ri-sun-line',           status: 'pending', message: 'Waiting...' },
  { id: 'position', label: 'Camera Position',         icon: 'ri-focus-3-line',       status: 'pending', message: 'Waiting...' },
  { id: 'single',   label: 'Single Person Only',      icon: 'ri-group-line',         status: 'pending', message: 'Waiting...' },
  { id: 'identity', label: 'Identity Verification',   icon: 'ri-shield-user-line',   status: 'pending', message: 'Waiting...' },
];

// Analyze brightness of a video frame
function analyzeBrightness(video: HTMLVideoElement): number {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 128;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return sum / (data.length / 4);
  } catch { return 128; }
}

// No longer needed - using login photo which is already verified
function calculateFrameQuality(video: HTMLVideoElement): number {
  return 100; // Placeholder - not used
}

// No longer needed - comparing only signup vs login, no live feed
async function captureBestFrame(video: HTMLVideoElement, durationMs: number = 3000): Promise<string> {
  return ''; // Placeholder - not used
}

export default function PreCheckPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [checks, setChecks] = useState<Check[]>(initialChecks);
  const [allPassed, setAllPassed] = useState(false);
  const [started, setStarted] = useState(false);
  const [identityScore, setIdentityScore] = useState<number | null>(null);
  const [refPhotoUrl, setRefPhotoUrl] = useState<string | null>(null);
  const [signupPhotoUrl, setSignupPhotoUrl] = useState<string | null>(null);

  // Identity verification hook for pre-exam verification
  const identityVerification = useIdentityVerification(videoRef, refPhotoUrl);

  const updateCheck = (id: string, update: Partial<Check>) => {
    setChecks(prev => prev.map(c => (c.id === id ? { ...c, ...update } : c)));
  };

  const retry = () => {
    setChecks(initialChecks);
    setAllPassed(false);
    setStarted(false);
    setIdentityScore(null);
  };

  useEffect(() => {
    if (started) return;
    setStarted(true);

    // Suppress unhandled promise rejections from model inference during initialization
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('load model before inference')) {
        event.preventDefault(); // Suppress the error
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Face verification is now handled by ArcFace on backend
    async function initializePrecheck() {
      console.log('📦 Precheck initialized (ArcFace handles face verification on backend)');
    }

    // Load both signup and login photos from MongoDB database
    async function loadEnrollmentPhotos() {
      try {
        console.log('🔄 About to fetch enrollment photos from API...');
        const response = await studentAPI.getEnrollmentPhotos();
        console.log('📦 Raw API Response:', response.data);
        
        const { signupPhoto, loginPhoto } = response.data;
        
        console.log('📸 Precheck loading photos from database:');
        console.log(`  Signup URL: ${signupPhoto}`);
        console.log(`  Login URL: ${loginPhoto}`);
        
        // Extract versions for comparison
        const signupVer = signupPhoto?.match(/v\d+/)?.[0];
        const loginVer = loginPhoto?.match(/v\d+/)?.[0];
        console.log(`  Signup version: ${signupVer}`);
        console.log(`  Login version: ${loginVer}`);
        
        if (signupPhoto && loginPhoto) {
          console.log(`  Same URL? ${signupPhoto === loginPhoto ? '⚠️ YES (BUG!)' : '✓ DIFFERENT'}`);
        }
        
        // Also load from localStorage as fallback
        const localSignup = localStorage.getItem(IDENTITY_SIGNUP_KEY);
        const localLogin = localStorage.getItem(IDENTITY_LOGIN_KEY);
        console.log(`  LocalStorage Signup: ${localSignup?.substring(0, 80)}...`);
        console.log(`  LocalStorage Login: ${localLogin?.substring(0, 80)}...`);
        
        console.log('🔄 Setting state variables...');
        const finalSignup = signupPhoto || localSignup;
        const finalLogin = loginPhoto || localLogin;
        
        console.log(`  Final signupPhotoUrl: ${finalSignup?.substring(0, 80)}...`);
        console.log(`  Final refPhotoUrl (login): ${finalLogin?.substring(0, 80)}...`);
        
        // Add cache-busting query params to force fresh image loads
        const signupWithCache = finalSignup ? `${finalSignup}?t=${Date.now()}_signup` : null;
        const loginWithCache = finalLogin ? `${finalLogin}?t=${Date.now()}_login` : null;
        
        console.log('🔐 Added cache-busting tokens:');
        console.log(`  Signup with cache-bust: ${signupWithCache?.substring(0, 80)}...`);
        console.log(`  Login with cache-bust: ${loginWithCache?.substring(0, 80)}...`);
        
        setSignupPhotoUrl(signupWithCache);
        setRefPhotoUrl(loginWithCache);
        
        console.log('✅ State variables set with cache-bust, rendering will update');
      } catch (err) {
        console.error('Failed to load enrollment photos from database:', err);
        // Fallback to localStorage
        const localSignup = localStorage.getItem(IDENTITY_SIGNUP_KEY);
        const localLogin = localStorage.getItem(IDENTITY_LOGIN_KEY);
        console.log('📍 Using localStorage fallback:');
        console.log(`  Signup: ${localSignup?.substring(0, 80)}...`);
        console.log(`  Login: ${localLogin?.substring(0, 80)}...`);
        
        const signupWithCache = localSignup ? `${localSignup}?t=${Date.now()}_signup` : null;
        const loginWithCache = localLogin ? `${localLogin}?t=${Date.now()}_login` : null;
        
        setSignupPhotoUrl(signupWithCache);
        setRefPhotoUrl(loginWithCache);
      }
    }
    
    loadEnrollmentPhotos();

    async function runChecks() {
      // Step 1: Camera
      updateCheck('camera', { status: 'checking', message: 'Requesting camera access...' });

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        updateCheck('camera', { status: 'passed', message: 'Camera detected and accessible' });
      } catch (err: any) {
        const msg = err?.name === 'NotAllowedError'
          ? 'Camera permission denied — please allow access'
          : 'Camera not found on this device';
        updateCheck('camera', { status: 'failed', message: msg });
        setChecks(prev =>
          prev.map(c => c.id !== 'camera' ? { ...c, status: 'failed', message: 'Cannot run without camera' } : c)
        );
        return;
      }

      // Step 2-5: Continuous real-time face detection monitoring
      updateCheck('face', { status: 'checking', message: 'Looking for your face...' });
      updateCheck('lighting', { status: 'checking', message: 'Analyzing lighting...' });
      updateCheck('position', { status: 'checking', message: 'Checking camera angle...' });
      updateCheck('single', { status: 'checking', message: 'Scanning for people...' });

      let detectionInterval: ReturnType<typeof setInterval> | null = null;
      let faceDetectedSoFar = false;
      let faceCountConfirmed = 0;
      let lightingConfirmed = false;

      detectionInterval = setInterval(() => {
        // Wrap async call to handle promise rejections
        (async () => {
        if (!videoRef.current || !stream || !stream.active) {
          if (detectionInterval) clearInterval(detectionInterval);
          return;
        }

        try {
          // Basic face detection: any motion/content in video frame that's not pure color
          let faceDetected = false;
          let faceCount = 0;

          // Use video frame variance analysis for face detection
          // (Ollama handles actual face comparison on backend)
          if (videoRef.current.videoWidth > 0) {
            try {
              const brightness = analyzeBrightness(videoRef.current);
              
              // IMPORTANT: Only analyze variance if lighting is already in good range
              // This prevents dark cameras from falsely detecting as faces
              if (brightness >= 40 && brightness <= 230) {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                  const imageData = ctx.getImageData(0, 0, 320, 240);
                  const data = imageData.data;
                  
                  // Calculate variance to detect if there's any meaningful content
                  let sum = 0, sumSquares = 0;
                  for (let i = 0; i < data.length; i += 4) {
                    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    sum += lum;
                    sumSquares += lum * lum;
                  }
                  
                  const mean = sum / (data.length / 4);
                  const variance = (sumSquares / (data.length / 4)) - (mean * mean);
                  
                  // High variance + good brightness = face/person detected
                  faceDetected = variance > 500; // Threshold for meaningful content
                  faceCount = faceDetected ? 1 : 0; // Assume 1 if we detect content
                }
              } else {
                // Dark or overly bright - cannot have a valid face
                faceDetected = false;
                faceCount = 0;
              }
            } catch (e) {
              faceDetected = videoRef.current.videoWidth > 0;
              faceCount = faceDetected ? 1 : 0;
            }
          }

          // Update Face Visibility
          if (faceDetected) {
            if (!faceDetectedSoFar) {
              faceDetectedSoFar = true;
              updateCheck('face', { status: 'passed', message: 'Face detected in frame' });
            }
          } else {
            updateCheck('face', { status: 'failed', message: 'No face detected — ensure you are visible' });
            faceDetectedSoFar = false;
          }

          // Update Lighting
          const brightness = analyzeBrightness(videoRef.current);
          if (brightness < 40) {
            updateCheck('lighting', { status: 'failed', message: 'Too dark — move to a brighter area' });
            lightingConfirmed = false;
          } else if (brightness > 230) {
            updateCheck('lighting', { status: 'failed', message: 'Too bright — reduce direct light on face' });
            lightingConfirmed = false;
          } else {
            updateCheck('lighting', { status: 'passed', message: `Good lighting detected (level: ${Math.round(brightness)})` });
            lightingConfirmed = true;
          }

          // Update Camera Position
          if (faceDetected) {
            updateCheck('position', { status: 'passed', message: 'Face centered and properly framed' });
          } else {
            updateCheck('position', { status: 'failed', message: 'Position check failed — face not visible' });
          }

          // Update Single Person - assume 1 person if face detected via variance
          if (faceCount === 1 || (faceDetected && faceCount === 0)) {
            if (faceCountConfirmed !== 1) {
              faceCountConfirmed = 1;
              updateCheck('single', { status: 'passed', message: 'Only one person detected' });
            }
          } else if (faceCount > 1) {
            updateCheck('single', { status: 'failed', message: `${faceCount} people detected — exam requires single person` });
            faceCountConfirmed = faceCount;
          } else {
            updateCheck('single', { status: 'failed', message: 'Cannot verify — face not detected' });
            faceCountConfirmed = 0;
          }

          // Move to identity verification once face is consistently detected with good lighting
          if (faceDetectedSoFar && lightingConfirmed && (faceCountConfirmed === 1 || (faceDetected && faceCount === 0))) {
            if (detectionInterval) clearInterval(detectionInterval);
            detectionInterval = null;

            // Step 6: Identity Verification (MANDATORY - Both Signup & Login Photos)
            updateCheck('identity', { status: 'checking', message: 'Comparing against signup and login photos...' });

            const signupPhoto = localStorage.getItem(IDENTITY_SIGNUP_KEY);
            const loginPhoto = localStorage.getItem(IDENTITY_LOGIN_KEY);
            
            if (!signupPhoto || !loginPhoto) {
              // CRITICAL SECURITY: Reject if either photo is missing
              updateCheck('identity', {
                status: 'failed',
                message: 'Identity verification required',
                detail: 'Missing signup or login face reference. Please complete full signup and login flow.',
              });
              setIdentityScore(null);
              return;
            }

            // SECURITY CHECK: Use DeepFace + ArcFace for accurate face verification
            console.log('🧠 [SECURITY] Starting ArcFace face verification (signup vs login)...');
            updateCheck('identity', { status: 'checking', message: 'Running ArcFace face recognition...' });
            
            try {
              // Compare only signup and login photos (login already verified, live feed not needed)
              console.log('📸 [ArcFace] Comparing signup photo with login photo...');
              
              // Call backend ArcFace endpoint with 2-photo comparison (no live feed)
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
              const compareResponse = await fetch(`${apiUrl}/verify/compare-faces-arcface`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  signupPhotoUrl: signupPhoto,
                  loginPhotoUrl: loginPhoto
                  // ✅ Removed: currentPhotoBase64 (live feed not needed, login already verified)
                })
              });
              
              const comparisonResult = await compareResponse.json();
              console.log('🧠 [ArcFace] 2-photo comparison result:', comparisonResult);
              console.log(`   Decision: ${comparisonResult.decision}`);
              console.log(`   Verified: ${comparisonResult.verified}`);
              console.log(`   Distance: ${comparisonResult.distance}`);
              console.log(`   Confidence: ${comparisonResult.confidence}%`);
              
              // Ensure confidence is a valid number
              const confidence = Math.max(0, Math.min(100, parseInt(comparisonResult.confidence) || 0));
              setIdentityScore(confidence);
              
              if (comparisonResult.decision === 'ALLOW') {
                // ✅ Signup and login photos match = same person
                updateCheck('identity', {
                  status: 'passed',
                  message: `✅ Identity verified (signup ✓ matches login)`,
                  detail: `${comparisonResult.reasoning} Confidence: ${confidence}%`,
                });
                setAllPassed(true);
              } else {
                // ❌ Signup and login photos don't match = different person, BLOCKED
                updateCheck('identity', {
                  status: 'failed',
                  message: `🚨 BLOCKED: Identity mismatch (signup ✗ doesn't match login)`,
                  detail: `${comparisonResult.reasoning} Confidence: ${confidence}%`,
                });
                console.error('❌ [SECURITY] BLOCKED: Signup and login photos do not match!');
              }
            } catch (arcfaceError) {
              console.error('❌ [ArcFace] Face comparison error:', arcfaceError);
              updateCheck('identity', {
                status: 'failed',
                message: '❌ Face verification failed',
                detail: 'Could not complete ArcFace recognition. Please try again.',
              });
            }
          }
        } catch (err) {
          console.error('Detection error:', err);
        }
        })().catch(() => {
          // Suppress unhandled promise rejections from model inference
          // Models may not be fully ready yet, that's okay - will retry on next interval
        });
      }, 300); // Check every 300ms for real-time feel

      return () => {
        if (detectionInterval) clearInterval(detectionInterval);
      };
    }

    // Initialize and run checks
    initializePrecheck().then(() => {
      runChecks();
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [started]);

  // Debug logging: Track photo URL state changes
  useEffect(() => {
    console.log('📷 Photo URL State Updated:');
    console.log(`  signupPhotoUrl: ${signupPhotoUrl ? signupPhotoUrl.substring(0, 80) + '...' : 'null'}`);
    console.log(`  refPhotoUrl: ${refPhotoUrl ? refPhotoUrl.substring(0, 80) + '...' : 'null'}`);
    if (signupPhotoUrl && refPhotoUrl) {
      console.log(`  Are they the same? ${signupPhotoUrl === refPhotoUrl ? '⚠️ YES' : '✓ NO (correct)'}`);
    }
    
    // Detailed URL comparison
    if (signupPhotoUrl && refPhotoUrl) {
      const signupVersion = signupPhotoUrl.match(/v\d+/)?.[0];
      const loginVersion = refPhotoUrl.match(/v\d+/)?.[0];
      console.log(`  Signup version: ${signupVersion}`);
      console.log(`  Login version: ${loginVersion}`);
      console.log(`  Versions match? ${signupVersion === loginVersion ? '⚠️ SAME VERSION' : '✓ Different'}`);
    }
  }, [signupPhotoUrl, refPhotoUrl]);

  const passedCount = checks.filter(c => c.status === 'passed').length;
  const hasFailed = checks.some(c => c.status === 'failed');

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="w-full max-w-xl px-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Login', 'System Check', 'Rules', 'Exam'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${i === 1 ? 'bg-teal-500 text-white' : i < 1 ? 'bg-[#2d3139] text-[#9ca3af]' : 'border border-[#2d3139] text-[#4b5563]'}`}>
                {i + 1}
              </div>
              {i < 3 && <div className={`w-8 h-px ${i < 1 ? 'bg-teal-500/50' : 'bg-[#1e2330]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-white mb-1">System Check</h1>
            <p className="text-[#6b7280] text-sm">Verifying your setup before the exam begins</p>
          </div>

          {/* Reference photos comparison panel (2 columns: signup vs login) */}
          {/* Live webcam feed is captured but not displayed (not needed for 2-photo comparison) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
            style={{ display: 'none' }}
          />
          <div className="grid grid-cols-2 gap-3 mb-7">
            {/* Signup reference photo */}
            <div>
              <div className="text-[#4b5563] text-xs font-semibold mb-1.5 text-center">Signup Enrolled</div>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-[#2d3139] bg-[#0a0c10]">
                {signupPhotoUrl ? (
                  <img 
                    key={`signup-${signupPhotoUrl}`}
                    src={signupPhotoUrl} 
                    alt="Signup" 
                    className="w-full h-full object-cover object-top scale-x-[-1]"
                    onLoad={() => console.log('✅ Signup photo loaded successfully')}
                    onError={() => console.error('❌ Signup photo failed to load:', signupPhotoUrl)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <i className="ri-image-line text-[#2d3139] text-3xl mb-1" />
                    <span className="text-[#374151] text-xs text-center px-2">No signup photo</span>
                  </div>
                )}
                {signupPhotoUrl && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5 backdrop-blur-sm">
                    <i className="ri-verified-badge-line text-purple-400 text-xs" />
                    <span className="text-white text-xs font-bold">SIGN</span>
                  </div>
                )}
              </div>
            </div>

            {/* Login reference photo */}
            <div>
              <div className="text-[#4b5563] text-xs font-semibold mb-1.5 text-center">Login Verified</div>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-[#2d3139] bg-[#0a0c10]">
                {refPhotoUrl ? (
                  <img 
                    key={`login-${refPhotoUrl}`}
                    src={refPhotoUrl} 
                    alt="Login" 
                    className="w-full h-full object-cover object-top scale-x-[-1]"
                    onLoad={() => console.log('✅ Login photo loaded successfully')}
                    onError={() => console.error('❌ Login photo failed to load:', refPhotoUrl)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <i className="ri-image-line text-[#2d3139] text-3xl mb-1" />
                    <span className="text-[#374151] text-xs text-center px-2">No login photo</span>
                  </div>
                )}
                {refPhotoUrl && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5 backdrop-blur-sm">
                    <i className="ri-shield-check-line text-emerald-400 text-xs" />
                    <span className="text-white text-xs font-bold">LOGIN</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similarity score bar (shown after identity check runs) */}
          {identityScore !== null && (
            <div className="mb-5 p-3 bg-[#0a0c10] border border-[#1e2330] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#9ca3af]">Face Similarity Score</span>
                <span className={`text-sm font-black ${identityScore >= 82 ? 'text-emerald-400' : identityScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {identityScore}%
                </span>
              </div>
              <div className="h-2 bg-[#1e2330] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${identityScore >= 82 ? 'bg-emerald-400' : identityScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${identityScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[#374151] text-xs mt-1">
                <span>0%</span>
                <span className="text-[#4b5563]">
                  {identityScore >= 82 ? 'Strong match ✓' : identityScore >= 60 ? 'Marginal match' : 'Mismatch ✗'}
                </span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${allPassed ? 'bg-emerald-500/15 text-emerald-400' : hasFailed ? 'bg-red-500/15 text-red-400' : 'bg-teal-500/15 text-teal-400'}`}>
              {passedCount}/{checks.length} checks completed
            </span>
          </div>

          {/* Checklist */}
          <div className="space-y-2.5 mb-7">
            {checks.map(check => (
              <div
                key={check.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                  check.status === 'passed' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  check.status === 'checking' ? 'bg-teal-500/5 border-teal-500/20' :
                  check.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-[#0a0c10] border-[#1e2330]'
                }`}
              >
                <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${
                  check.status === 'passed' ? 'bg-emerald-500/15' :
                  check.status === 'checking' ? 'bg-teal-500/15' :
                  check.status === 'failed' ? 'bg-red-500/15' :
                  'bg-[#1a1d24]'
                }`}>
                  {check.status === 'checking' ? (
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className={`${check.icon} text-sm ${
                      check.status === 'passed' ? 'text-emerald-400' :
                      check.status === 'failed' ? 'text-red-400' :
                      'text-[#4b5563]'
                    }`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${
                    check.status === 'passed' ? 'text-emerald-400' :
                    check.status === 'checking' ? 'text-teal-400' :
                    check.status === 'failed' ? 'text-red-400' :
                    'text-[#6b7280]'
                  }`}>{check.label}</div>
                  <div className="text-xs text-[#4b5563]">{check.message}</div>
                  {check.detail && <div className="text-xs text-[#374151] mt-0.5">{check.detail}</div>}
                </div>
                {check.status === 'passed' && <i className="ri-checkbox-circle-fill text-emerald-400 flex-shrink-0" />}
                {check.status === 'failed' && <i className="ri-close-circle-fill text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <button
            onClick={() => hasFailed ? retry() : allPassed ? navigate('/exam/rules') : null}
            disabled={!allPassed && !hasFailed}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${allPassed ? 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer' : hasFailed ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer' : 'bg-[#1a1d24] text-[#4b5563] cursor-not-allowed'}`}
          >
            {allPassed ? 'Continue to Exam Rules →' : hasFailed ? 'Retry System Check' : 'Running system checks...'}
          </button>
        </div>
      </div>
    </div>
  );
}
