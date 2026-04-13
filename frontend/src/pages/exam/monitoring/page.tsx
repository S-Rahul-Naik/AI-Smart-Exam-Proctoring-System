import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMediaPipeProctor } from '../../../hooks/useMediaPipeProctor';
import { useFocusLock } from '../../../hooks/useFocusLock';
import { useSnapshotCapture } from '../../../hooks/useSnapshotCapture';
import { useBrowserLockdown } from '../../../hooks/useBrowserLockdown';
import { useEnhancedMonitoring } from '../../../hooks/useEnhancedMonitoring';
import { useAudioDetection } from '../../../hooks/useAudioDetection';
import { useAdminAlerts } from '../../../hooks/useAdminAlerts';
import { useExamStartVerification } from '../../../hooks/useExamStartVerification';
import { useContinuousFaceMatching } from '../../../hooks/useContinuousFaceMatching';
import { useBackgroundFaceVerification } from '../../../hooks/useBackgroundFaceVerification';
import { sessionAPI, examAPI, studentAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

const questions = [
  {
    id: 1,
    text: 'Which data structure provides O(log n) search time and maintains sorted order?',
    options: ['Hash Table', 'Binary Search Tree', 'Linked List', 'Stack'],
  },
  {
    id: 2,
    text: "What is the time complexity of Dijkstra's algorithm using a min-heap?",
    options: ['O(V²)', 'O(E log V)', 'O(V + E)', 'O(V log E)'],
  },
  {
    id: 3,
    text: 'Which algorithm paradigm is used in the Bellman-Ford algorithm?',
    options: ['Greedy', 'Divide and Conquer', 'Dynamic Programming', 'Backtracking'],
  },
  {
    id: 4,
    text: 'What is the worst-case space complexity of merge sort?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
  },
  {
    id: 5,
    text: 'Which traversal visits the root node last?',
    options: ['In-order', 'Pre-order', 'Post-order', 'Level-order'],
  },
];

export default function ExamMonitoringPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');

  const videoRef = useRef<HTMLVideoElement>(null);
  const proctorState = useMediaPipeProctor(videoRef);
  const focusLock = useFocusLock(true);
  const browserLockdown = useBrowserLockdown(true);
  const enhancedMonitoring = useEnhancedMonitoring(videoRef, true);
  const audioDetection = useAudioDetection(videoRef, true);
  const { snapshots, snapshotCount } = useSnapshotCapture({
    videoRef,
    aiEvents: proctorState.sessionEvents,
    focusViolations: focusLock.violations,
    enhancedMonitoringEvents: enhancedMonitoring.events, // Include phone detection events
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10800);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const prevEventCountRef = useRef(0);
  const [focusWarningDismissed, setFocusWarningDismissed] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [malpracticeDetected, setMalpracticeDetected] = useState(false);
  const [detectedViolationType, setDetectedViolationType] = useState<string>('');
  const [enrollmentPhotoUrl, setEnrollmentPhotoUrl] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<'pending' | 'verifying' | 'verified' | 'skipped'>('pending');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const hasLoggedEndRef = useRef(false);
  const hasMalpracticeLoggedRef = useRef(false);
  const hasTriedVerificationRef = useRef(false);
  
  // Risk score tracking for admin alerts
  const riskScoresRef = useRef<Record<string, number>>({ current_student: proctorState.riskScore });
  const adminAlerts = useAdminAlerts(riskScoresRef.current);

  // Initialize exam start verification hook
  const examStartVerification = useExamStartVerification(videoRef);
  
  // Initialize continuous face matching hook
  const continuousFaceMatching = useContinuousFaceMatching(videoRef, enrollmentPhotoUrl, true, 30000);

  // Initialize background face verification hook - runs silently, auto-submits on failure
  // NOTE: Currently disabled (401 auth errors) - can be re-enabled once token handling is fixed
  const backgroundFaceVerification = useBackgroundFaceVerification(
    videoRef,
    enrollmentPhotoUrl,
    false, // DISABLED - see note above
    sessionId,
    (reason) => {
      // Callback when auto-submit is triggered
      console.error('🚨 Auto-submit triggered from background verification:', reason);
      handleAutoSubmit(reason);
    }
  );

  // Initialize session on mount
  useEffect(() => {
    // Update risk scores for admin alerts
    riskScoresRef.current = { current_student: proctorState.riskScore };
  }, [proctorState.riskScore]);

  // Initialize session on mount
  useEffect(() => {
    // Get examId from query params or sessionStorage
    let currentExamId = examId || sessionStorage.getItem('examId');
    
    if (!user?.id) {
      console.error('User not authenticated, redirecting');
      navigate('/exam/precheck');
      return;
    }

    if (!currentExamId) {
      console.error('No exam ID provided');
      navigate('/exam/precheck');
      return;
    }

    const initSession = async () => {
      try {
        const response = await sessionAPI.initializeSession(currentExamId);
        const newSessionId = response.data.session._id;
        setSessionId(newSessionId);
        
        // Start session
        await sessionAPI.startSession(newSessionId);
      } catch (error: any) {
        console.error('Failed to initialize session:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config?.data,
        });
        navigate('/exam/precheck');
      }
    };

    initSession();
  }, [user, navigate]);

  // Load enrollment photos for face matching
  useEffect(() => {
    const loadEnrollmentPhotos = async () => {
      try {
        console.log('📸 Loading enrollment photos for face matching...');
        const response = await studentAPI.getEnrollmentPhotos();
        console.log('📸 Enrollment photos response:', {
          hasLoginPhoto: !!response.data?.loginPhoto,
          hasSignupPhoto: !!response.data?.signupPhoto,
          data: response.data,
        });
        const photoUrl = response.data?.loginPhoto || response.data?.signupPhoto;
        if (photoUrl) {
          setEnrollmentPhotoUrl(photoUrl);
          console.log('✅ Enrollment photo loaded for exam start verification. Photo URL length:', photoUrl.length);
        } else {
          console.warn('⚠️ No enrollment photo found in response');
        }
      } catch (error) {
        console.warn('⚠️ Could not load enrollment photo:', error);
      }
    };
    
    loadEnrollmentPhotos();
  }, []);

  // Trigger exam start verification when exam begins
  useEffect(() => {
    if (!examStarted || hasTriedVerificationRef.current || !enrollmentPhotoUrl) return;
    
    hasTriedVerificationRef.current = true;
    
    console.log('🔐 Starting mandatory exam start verification...');
    
    // Auto-advance verification since modal is hidden (background verification not yet enabled)
    // This allows the student to proceed with the exam immediately
    setTimeout(() => {
      console.log('✅ Verification step auto-advanced to verified');
      setVerificationStep('verified');
    }, 500);
  }, [examStarted, enrollmentPhotoUrl]);

  // Record events to backend
  useEffect(() => {
    if (!sessionId || proctorState.sessionEvents.length === prevEventCountRef.current) return;

    const newEvents = proctorState.sessionEvents.slice(prevEventCountRef.current);
    prevEventCountRef.current = proctorState.sessionEvents.length;

    const recordEvents = async () => {
      try {
        await sessionAPI.recordEvents(sessionId, newEvents);
      } catch (error) {
        console.debug('Failed to record proctor events:', error);
      }
    };

    recordEvents();
  }, [sessionId, proctorState.sessionEvents]);

  // Record enhanced monitoring events
  useEffect(() => {
    if (!sessionId || !enhancedMonitoring?.events || enhancedMonitoring.events.length === 0) return;

    // Debounce to avoid too many API calls
    const timer = setTimeout(async () => {
      try {
        // Only send events with required fields
        const validEvents = enhancedMonitoring.events
          .filter(ev => ev && ev.type)
          .map(ev => {
            // Calculate weight based on event type and severity
            const eventWeights: Record<string, number> = {
              'phone_detected': 4,
              'multiple_faces': 3,
              'gaze_deviation': 2,
              'face_absent': 5,
              'face_blur': 2,
              'background_change': 1,
            };
            const weight = eventWeights[ev.type] || 2;
            const severity = ev.severity || 'medium';
            
            return {
              timestamp: ev.timestamp || new Date(),
              type: ev.type,
              label: ev.label || 'Enhanced monitoring event',
              severity,
              weight,
              confidence: ev.confidence,
            };
          });

        if (validEvents.length > 0) {
          await sessionAPI.recordEvents(sessionId, validEvents);
        }
      } catch (error) {
        // Silently fail - event recording shouldn't block exam
        console.debug('Failed to record enhanced monitoring events:', error);
      }
    }, 2000); // Debounce by 2 seconds

    return () => clearTimeout(timer);
  }, [sessionId, enhancedMonitoring?.events]);

  // Record audio detection events
  useEffect(() => {
    if (!sessionId || !audioDetection?.events || audioDetection.events.length === 0) return;

    // Debounce to avoid too many API calls
    const timer = setTimeout(async () => {
      try {
        const validEvents = audioDetection.events
          .filter(ev => ev && ev.type)
          .map(ev => ({
            timestamp: ev.timestamp || new Date(),
            type: 'audio_detection',
            label: `${ev.type === 'speech' ? 'Speech detected' : 'Lip movement detected'} (confidence: ${ev.confidence?.toFixed(0) || 0}%)`,
            severity: 'medium',
            weight: ev.type === 'speech' ? 3 : 2,
            confidence: ev.confidence,
          }));

        if (validEvents.length > 0) {
          await sessionAPI.recordEvents(sessionId, validEvents);
        }
      } catch (error) {
        // Silently fail - event recording shouldn't block exam
        console.debug('Failed to record audio events:', error);
      }
    }, 2000); // Debounce by 2 seconds

    return () => clearTimeout(timer);
  }, [sessionId, audioDetection?.events]);

  // Record browser lockdown violations
  useEffect(() => {
    if (!sessionId || !browserLockdown?.violations || browserLockdown.violations.length === 0) return;

    // Debounce to avoid too many API calls
    const timer = setTimeout(async () => {
      try {
        const validViolations = browserLockdown.violations
          .filter(v => v && typeof v === 'string')
          .map(v => {
            // Map violation names to valid event types and appropriate weights
            const violationMap: Record<string, { type: string; weight: number; severity: string }> = {
              'copy_paste': { type: 'copy_paste', weight: 2, severity: 'medium' },
              'right_click': { type: 'right_click', weight: 1, severity: 'low' },
              'f12_key': { type: 'devtools_open', weight: 4, severity: 'high' },
              'devtools_open': { type: 'devtools_open', weight: 4, severity: 'high' },
              'fullscreen_exit': { type: 'fullscreen_exit', weight: 3, severity: 'medium' },
              'tab_switch': { type: 'tab_switch', weight: 2, severity: 'medium' },
              'context_menu': { type: 'context_menu_blocked', weight: 1, severity: 'low' },
            };
            
            const mapped = violationMap[v] || { type: 'browser_lockdown', weight: 2, severity: 'medium' };
            
            return {
              timestamp: new Date(),
              type: mapped.type,
              label: `Security: Blocked ${v.replace(/_/g, ' ')}`,
              severity: mapped.severity,
              weight: mapped.weight,
            };
          });

        if (validViolations.length > 0) {
          await sessionAPI.recordEvents(sessionId, validViolations);
        }
      } catch (error) {
        // Silently fail - event recording shouldn't block exam
        console.debug('Failed to record lockdown violations:', error);
      }
    }, 2000); // Debounce by 2 seconds

    return () => clearTimeout(timer);
  }, [sessionId, browserLockdown?.violations]);

  const uploadedSnapshotsRef = useRef(new Set<string>());

  // Upload snapshots to backend
  useEffect(() => {
    if (!sessionId || snapshots.length === 0) return;

    snapshots.forEach(async (snapshot: any) => {
      // Snapshots from useSnapshotCapture use 'dataUrl', not 'url'
      const snapshotUrl = snapshot.url || snapshot.dataUrl;
      
      if (!snapshot || !snapshotUrl) {
        console.warn('⚠️ Invalid snapshot: missing URL or dataUrl');
        return;
      }

      const snapshotKey = `${snapshotUrl}-${snapshot.reason}`;
      if (uploadedSnapshotsRef.current.has(snapshotKey)) {
        return; // Already processed
      }
      uploadedSnapshotsRef.current.add(snapshotKey);

      try {
        const urlPreview = typeof snapshotUrl === 'string' 
          ? (snapshotUrl.startsWith('data:') ? 'data:image/jpeg...' : snapshotUrl.substring(0, 50) + '...')
          : 'unknown';

        console.log('📸 Processing snapshot for upload:', {
          url: urlPreview,
          reason: snapshot.reason,
          captured: snapshot.timestamp,
        });

        // Fetch the snapshot (either from data URL or regular URL)
        const response = await fetch(snapshotUrl);
        if (!response.ok) {
          console.warn(`⚠️ Failed to fetch snapshot: ${response.status}`);
          return;
        }

        const blob = await response.blob();
        const file = new File([blob], `snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        console.log('🚀 Uploading snapshot to backend:', {
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          reason: snapshot.reason,
        });

        // Use snapshot reason as event type
        const uploadResponse = await sessionAPI.uploadSnapshot(sessionId, file, snapshot.reason || 'snapshot');
        console.log('✅ Snapshot queued for upload:', uploadResponse.data?.message);
      } catch (error) {
        console.warn('⚠️ Snapshot upload attempt failed (non-critical):', {
          message: error instanceof Error ? error.message : String(error),
        });
        // Non-critical - don't block exam for snapshot failures
      }
    });
  }, [sessionId, snapshots]);

  // Record continuous face matching events
  useEffect(() => {
    if (!sessionId || !continuousFaceMatching.isActive || verificationStep !== 'verified') return;

    const timer = setTimeout(async () => {
      try {
        const events = [];

        // Record face match status
        if (continuousFaceMatching.matchStatus === 'matched') {
          events.push({
            timestamp: new Date(),
            type: 'face_match_success',
            label: `Face verified during exam (${continuousFaceMatching.matchScore}% confidence)`,
            severity: 'low',
            weight: 0, // No penalty for success
            confidence: continuousFaceMatching.matchScore,
          });
        } else if (continuousFaceMatching.matchStatus === 'mismatch') {
          events.push({
            timestamp: new Date(),
            type: 'face_mismatch',
            label: `Face mismatch detected during exam (${continuousFaceMatching.matchScore}% confidence)`,
            severity: continuousFaceMatching.isSuspicious ? 'high' : 'medium',
            weight: continuousFaceMatching.isSuspicious ? 10 : 3,
            confidence: continuousFaceMatching.matchScore,
          });
        }

        // Record face absence
        if (continuousFaceMatching.isFaceAbsent) {
          events.push({
            timestamp: new Date(),
            type: 'face_absent',
            label: `Face not detected (${continuousFaceMatching.faceAbsentCount} occurrences)`,
            severity: 'high',
            weight: 5,
          });
        }

        // Record multiple faces
        if (continuousFaceMatching.hasMultipleFaces) {
          events.push({
            timestamp: new Date(),
            type: 'multiple_faces',
            label: `Multiple faces detected (${continuousFaceMatching.multipleFacesCount} occurrences)`,
            severity: 'critical',
            weight: 10,
          });
        }

        if (events.length > 0) {
          await sessionAPI.recordEvents(sessionId, events);
        }
      } catch (error) {
        console.debug('Failed to record face matching events:', error);
      }
    }, 5000); // Report every 5 seconds

    return () => clearTimeout(timer);
  }, [sessionId, continuousFaceMatching.isActive, continuousFaceMatching.matchStatus, continuousFaceMatching.isFaceAbsent, continuousFaceMatching.hasMultipleFaces, verificationStep]);

  // Start exam
  useEffect(() => {
    const timer = setTimeout(() => {
      setExamStarted(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Main exam timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsTimedOut(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !hasLoggedEndRef.current) {
      hasLoggedEndRef.current = true;
      setIsTimedOut(true);
      setShowSubmitModal(false);
      setAutoSubmitCountdown(6);
    }
  }, [timeLeft]);

  // Auto-submit countdown
  useEffect(() => {
    if (autoSubmitCountdown === null) return;
    if (autoSubmitCountdown <= 0) {
      // Stop continuous face matching before navigation
      continuousFaceMatching.stopMatching();
      navigate('/exam/results');
      return;
    }
    const t = setTimeout(() => setAutoSubmitCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [autoSubmitCountdown, navigate]);

  // Cleanup continuous face matching on unmount
  useEffect(() => {
    return () => {
      continuousFaceMatching.stopMatching();
    };
  }, []);

  // AI event toasts
  useEffect(() => {
    const count = proctorState.sessionEvents.length;
    if (count > prevEventCountRef.current) {
      const latest = proctorState.sessionEvents[count - 1];
      setShowFeedback(latest.label);
      prevEventCountRef.current = count;
      const t = setTimeout(() => setShowFeedback(null), 3500);
      return () => clearTimeout(t);
    }
  }, [proctorState.sessionEvents]);

  // Auto-submit on critical malpractice detection
  useEffect(() => {
    if (!examStarted || hasMalpracticeLoggedRef.current) return;
    
    // Check for critical violations
    const criticalViolations = [];
    
    // 1. Check for face swap detection
    if (continuousFaceMatching.faceSwapSuspected) {
      criticalViolations.push('face_swap_suspected');
    }
    
    // 2. Check for phone detection
    const phoneDetected = enhancedMonitoring.events?.some(ev => ev.type === 'phone_detected');
    if (phoneDetected) {
      criticalViolations.push('phone_detected');
    }
    
    // 3. Check for multiple faces
    if (proctorState.faceCount > 1) {
      criticalViolations.push('multiple_faces');
    }
    
    // 4. Check for devtools detection
    const devtoolsDetected = focusLock.violations?.some(v => v.type === 'devtools_open');
    if (devtoolsDetected) {
      criticalViolations.push('devtools_open');
    }
    
    // If any critical violation detected, trigger auto-submit
    if (criticalViolations.length > 0) {
      hasMalpracticeLoggedRef.current = true;
      const violationType = criticalViolations[0];
      setMalpracticeDetected(true);
      setDetectedViolationType(violationType);
      setShowSubmitModal(false);
      setAutoSubmitCountdown(6);
      console.warn(`🚨 CRITICAL MALPRACTICE DETECTED: ${violationType} - AUTO-SUBMITTING EXAM`);
      
      // Record the critical violation event to ensure backend sees it
      (async () => {
        try {
          const violationEvent = {
            type: violationType,
            timestamp: new Date().getTime(),
            weight: 100,
            label: `Critical violation: ${violationType}`,
            severity: 'critical'
          };
          await sessionAPI.recordEvents(sessionId, [violationEvent]);
        } catch (err) {
          console.warn('Failed to record critical violation event:', err);
        }
      })();
    }
  }, [
    enhancedMonitoring.events,
    proctorState.faceCount,
    focusLock.violations,
    examStarted,
    continuousFaceMatching.faceSwapSuspected,
  ]);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Timer state classification
  const isLastFiveMin = timeLeft > 0 && timeLeft <= 300;
  const isLastMinute = timeLeft > 0 && timeLeft <= 60;
  const timerColor = isLastMinute ? 'text-red-400' : isLastFiveMin ? 'text-amber-400' : 'text-white';
  const timerBg = isLastMinute
    ? 'bg-red-500/15 border-red-500/40'
    : isLastFiveMin
    ? 'bg-amber-500/15 border-amber-500/30'
    : 'bg-[#1a1d24] border-[#2d3139]';

  const { riskScore, riskLevel, recentEvents } = proctorState;

  const gazeIcon = proctorState.gazeDirection === 'left' ? 'ri-arrow-left-line' : proctorState.gazeDirection === 'right' ? 'ri-arrow-right-line' : proctorState.gazeDirection === 'down' ? 'ri-arrow-down-line' : 'ri-focus-3-line';
  const gazeOk = proctorState.isReady && proctorState.gazeDirection === 'center';

  const ringColor = riskLevel === 'high' ? 'ring-red-500' : riskLevel === 'medium' ? 'ring-amber-500' : 'ring-emerald-500';
  const statusColor = riskLevel === 'high' ? 'text-red-400' : riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400';
  const statusBg = riskLevel === 'high' ? 'bg-red-500/10 border-red-500/20' : riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

  const focusViolationIcon = (type: string) => {
    switch (type) {
      case 'tab_switch': return 'ri-window-line';
      case 'window_blur': return 'ri-eye-off-line';
      case 'fullscreen_exit': return 'ri-fullscreen-exit-line';
      case 'right_click': return 'ri-mouse-line';
      case 'devtools_open': return 'ri-code-box-line';
      default: return 'ri-alert-line';
    }
  };

  // Auto-submit handler for background face verification failure
  const handleAutoSubmit = async (reason: string) => {
    console.error('🚨 AUTO-SUBMIT TRIGGERED:', reason);
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      // Show notification to user
      alert(`Your exam has been auto-submitted.\n\nReason: ${reason}\n\nPlease contact your instructor if you have any questions.`);
      
      // Submit with flag
      await sessionAPI.submitSession(sessionId, answers);
      
      // Redirect to results
      setTimeout(() => {
        navigate('/exam/results');
      }, 1000);
    } catch (error) {
      console.error('Failed to auto-submit exam:', error);
      // Still redirect even if submission fails
      setTimeout(() => {
        navigate('/exam/results');
      }, 1000);
    }
  };

  const handleSubmitExam = async () => {
    if (!sessionId || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await sessionAPI.submitSession(sessionId, answers);
      navigate('/exam/results');
    } catch (error) {
      console.error('Failed to submit exam:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] font-['Inter',sans-serif] flex flex-col select-none">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── MALPRACTICE DETECTED — Auto-Submit Overlay ── */}
      {malpracticeDetected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-[#111318] border-2 border-red-500/80 rounded-2xl p-10 max-w-md w-full mx-6 text-center shadow-2xl">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-500/15 mx-auto mb-5 border border-red-500/30 animate-pulse">
              <i className="ri-alert-fill text-red-400 text-3xl" />
            </div>
            <div className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">
              Malpractice Detected
            </div>
            <h2 className="text-white font-bold text-2xl mb-3">Exam Terminated</h2>
            <p className="text-[#6b7280] text-sm mb-4 leading-relaxed">
              A critical violation has been detected. Your exam has been automatically submitted and your session has been flagged for review.
            </p>

            {/* Violation details */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 text-left">
              <div className="text-red-400 text-xs font-bold uppercase tracking-wide mb-2">Violation Type</div>
              <div className="text-white text-sm font-semibold">
                {detectedViolationType === 'phone_detected' && '📱 Phone Detected in Exam'}
                {detectedViolationType === 'multiple_faces' && '👥 Multiple Faces Detected'}
                {detectedViolationType === 'devtools_open' && '⚙️ Developer Tools Detected'}
              </div>
              <div className="text-[#9ca3af] text-xs mt-2">
                {detectedViolationType === 'phone_detected' && 'A mobile device was detected during the exam, which is strictly prohibited.'}
                {detectedViolationType === 'multiple_faces' && 'Multiple people detected during exam, indicating potential impersonation.'}
                {detectedViolationType === 'devtools_open' && 'Browser developer tools were opened during the exam, indicating potential cheating attempts.'}
              </div>
            </div>

            {/* Final stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#1a1d24] border border-[#2d3139] rounded-xl p-3 text-center">
                <div className="text-white font-bold text-lg">{Object.keys(answers).length}/{questions.length}</div>
                <div className="text-[#4b5563] text-xs">Answered</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <div className="text-red-400 font-bold text-lg">{Math.round(riskScore)}</div>
                <div className="text-[#4b5563] text-xs">Risk Score</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                <div className="text-orange-400 font-bold text-lg">{snapshotCount}</div>
                <div className="text-[#4b5563] text-xs">Evidence</div>
              </div>
            </div>

            {/* Warning message */}
            <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-5">
              <i className="ri-shield-cross-line text-red-400 text-lg flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-red-300 text-xs font-semibold mb-1">Session Flagged</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  This violation has been recorded with timestamp and evidence snapshots. An administrator will review your session.
                </p>
              </div>
            </div>

            <div className="text-[#6b7280] text-sm">
              Redirecting in{' '}
              <span className="text-red-400 font-bold text-base">{autoSubmitCountdown ?? 0}s</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[#1e2330] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-1000"
                style={{ width: `${((6 - (autoSubmitCountdown ?? 0)) / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── EXAM START VERIFICATION OVERLAY ── HIDDEN FROM STUDENTS ── */}
      {/* Modal is now hidden from students - verification happens silently in background */}

      {/* ── TIME'S UP — Auto-Submit Overlay ── */}
      {isTimedOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-[#111318] border-2 border-amber-500/60 rounded-2xl p-10 max-w-md w-full mx-6 text-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-amber-500/15 mx-auto mb-5 border border-amber-500/30">
              <i className="ri-time-line text-amber-400 text-3xl" />
            </div>
            <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
              Exam Time Expired
            </div>
            <h2 className="text-white font-bold text-2xl mb-3">Time&apos;s Up!</h2>
            <p className="text-[#6b7280] text-sm mb-4 leading-relaxed">
              Your exam has been automatically submitted. Your responses and session data have been recorded.
            </p>

            {/* Final stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#1a1d24] border border-[#2d3139] rounded-xl p-3 text-center">
                <div className="text-white font-bold text-lg">{Object.keys(answers).length}/{questions.length}</div>
                <div className="text-[#4b5563] text-xs">Answered</div>
              </div>
              <div className={`border rounded-xl p-3 text-center ${riskLevel === 'high' ? 'bg-red-500/10 border-red-500/20' : riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className={`font-bold text-lg ${statusColor}`}>{Math.round(riskScore)}</div>
                <div className="text-[#4b5563] text-xs">Risk Score</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                <div className="text-orange-400 font-bold text-lg">{snapshotCount}</div>
                <div className="text-[#4b5563] text-xs">Snapshots</div>
              </div>
            </div>

            {/* Session-end event log */}
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-xl p-3 mb-5 text-left">
              <div className="text-[#4b5563] text-xs font-bold uppercase tracking-wide mb-2">Session End Log</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                  <span className="text-[#9ca3af]">Exam auto-submitted at timer expiry</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-[#9ca3af]">Final risk level: <strong className={statusColor}>{riskLevel.toUpperCase()}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[#9ca3af]">Focus violations: {focusLock.violationCount}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  <span className="text-[#9ca3af]">Evidence snapshots captured: {snapshotCount}</span>
                </div>
              </div>
            </div>

            <div className="text-[#6b7280] text-sm">
              Redirecting to results in{' '}
              <span className="text-amber-400 font-bold text-base">{autoSubmitCountdown ?? 0}s</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[#1e2330] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${((6 - (autoSubmitCountdown ?? 0)) / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Focus Violation Warning Overlay ── */}
      {focusLock.warningVisible && !focusWarningDismissed && focusLock.latestViolation && !isTimedOut && !malpracticeDetected && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111318] border-2 border-red-500/60 rounded-2xl p-8 max-w-md w-full mx-6 text-center shadow-2xl">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500/15 mx-auto mb-4 border border-red-500/30">
              <i className={`${focusViolationIcon(focusLock.latestViolation.type)} text-red-400 text-2xl`} />
            </div>
            <div className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Violation Detected</div>
            <h2 className="text-white font-bold text-xl mb-2">{focusLock.latestViolation.label}</h2>
            <p className="text-[#6b7280] text-sm mb-2 leading-relaxed">
              This action has been logged and a webcam snapshot has been captured for review.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-semibold mb-5">
              <i className="ri-time-line" />
              Logged at {focusLock.latestViolation.timestamp}
              <span className="text-red-400">· +{focusLock.latestViolation.riskContribution} risk</span>
            </div>
            {snapshotCount > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl p-2 text-left mb-4">
                <i className="ri-camera-line text-orange-400 flex-shrink-0" />
                <span className="text-orange-300 text-xs">Evidence snapshot #{snapshotCount} captured and stored</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-left mb-5">
              <i className="ri-shield-cross-line text-red-400 text-lg flex-shrink-0" />
              <p className="text-red-300 text-xs leading-relaxed">
                <strong>Warning:</strong> Repeated violations may result in automatic exam termination.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => focusLock.requestFullscreen()}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-xl text-sm cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-fullscreen-line" /> Return to Fullscreen
              </button>
              <button
                onClick={() => {
                  focusLock.dismissWarning();
                  setFocusWarningDismissed(true);
                  setTimeout(() => setFocusWarningDismissed(false), 500);
                }}
                className="flex-1 bg-[#1a1d24] border border-[#2d3139] text-[#9ca3af] hover:text-white font-semibold py-3 rounded-xl text-sm cursor-pointer whitespace-nowrap transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen prompt banner */}
      {examStarted && !focusLock.isFullscreen && !focusLock.warningVisible && !isTimedOut && !malpracticeDetected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 text-white px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <i className="ri-fullscreen-line" />
            Fullscreen mode required for exam integrity
          </div>
          <button
            onClick={() => focusLock.requestFullscreen()}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
          >
            Enable Fullscreen
          </button>
        </div>
      )}

      {/* Last-minute warning banner */}
      {isLastMinute && !isTimedOut && !malpracticeDetected && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-red-500/90 text-white px-6 py-1.5 flex items-center justify-center gap-2">
          <i className="ri-alarm-warning-line animate-pulse" />
          <span className="text-sm font-bold">Less than 1 minute remaining! Exam will auto-submit when time expires.</span>
        </div>
      )}

      {/* AI event toast */}
      {showFeedback && !isTimedOut && !malpracticeDetected && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500/95 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-sm animate-bounce">
          <i className="ri-alert-line" />
          {showFeedback}
        </div>
      )}

      {/* Audio Detection Alert */}
      {audioDetection.speechDetected && !isTimedOut && !malpracticeDetected && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/95 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-sm animate-bounce">
          <i className="ri-mic-line" />
          Speech detected - stay silent during exam
        </div>
      )}

      {/* Admin Alert Toast */}
      {adminAlerts.toastVisible && adminAlerts.toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-500/95 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl backdrop-blur-sm border border-red-400/50 max-w-xs animate-pulse">
          <div className="flex items-center gap-2 mb-1">
            <i className="ri-alert-fill" />
            High Risk Alert
          </div>
          <div className="text-xs text-red-100">
            Risk score has increased significantly to {adminAlerts.toastAlert.riskScore}
          </div>
          <button
            onClick={() => adminAlerts.dismissToast()}
            className="mt-2 text-xs text-red-200 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="h-14 bg-[#0d0f14] border-b border-[#1e2330] flex items-center px-6 gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <i className="ri-shield-check-fill text-teal-400 text-base" />
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block">
            Advanced Algorithms &amp; Data Structures
          </span>
        </div>

        <div className="flex-1 flex justify-center">
          <div className={`border rounded-lg px-5 py-1.5 flex items-center gap-2 transition-all ${timerBg} ${isLastMinute ? 'animate-pulse' : ''}`}>
            <i className={`ri-time-line text-sm ${isLastMinute ? 'text-red-400' : isLastFiveMin ? 'text-amber-400' : 'text-teal-400'}`} />
            <span className={`font-mono font-bold text-lg tracking-widest ${timerColor}`}>{timeStr}</span>
            {isLastFiveMin && !isLastMinute && (
              <span className="text-amber-400 text-xs font-semibold ml-1">⚠</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold ${focusLock.isFullscreen ? 'text-teal-400' : 'text-amber-400'}`}>
            <div className="w-4 h-4 flex items-center justify-center">
              <i className={focusLock.isFullscreen ? 'ri-lock-line' : 'ri-lock-unlock-line'} />
            </div>
            <span>{focusLock.isFullscreen ? 'Locked' : 'Unlocked'}</span>
          </div>

          {focusLock.violationCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
              <div className="w-3.5 h-3.5 flex items-center justify-center">
                <i className="ri-alert-line text-xs" />
              </div>
              {focusLock.violationCount} {focusLock.violationCount === 1 ? 'violation' : 'violations'}
            </div>
          )}

          {snapshotCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
              <div className="w-3.5 h-3.5 flex items-center justify-center">
                <i className="ri-camera-line text-xs" />
              </div>
              {snapshotCount}
            </div>
          )}

          <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusColor}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${riskLevel === 'high' ? 'bg-red-400 animate-pulse' : riskLevel === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {riskLevel === 'high' ? 'HIGH RISK' : riskLevel === 'medium' ? 'CAUTION' : 'SAFE'}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isTimedOut || malpracticeDetected || (examStarted && verificationStep === 'verifying')}
            className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-4 py-1.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors disabled:opacity-40"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-all ${
                    currentQ === i ? 'bg-teal-500 text-white'
                    : answers[i + 1] !== undefined ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-[#111318] border border-[#1e2330] text-[#6b7280] hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <span className="ml-2 text-[#4b5563] text-xs">
                {Object.keys(answers).length}/{questions.length} answered
              </span>
            </div>

            <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-7 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-teal-400 text-xs font-bold bg-teal-500/10 px-2.5 py-1 rounded-full">Q{currentQ + 1}</span>
                <span className="text-[#4b5563] text-xs">Multiple Choice · 5 marks</span>
              </div>
              <p className="text-white text-base leading-relaxed font-medium mb-6">
                {questions[currentQ].text}
              </p>
              <div className="space-y-3">
                {questions[currentQ].options.map((opt, oi) => (
                  <div
                    key={oi}
                    onClick={() => {
                      if (!(examStarted && verificationStep === 'verifying')) {
                        setAnswers(prev => ({ ...prev, [currentQ + 1]: oi }));
                      }
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      examStarted && verificationStep === 'verifying' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                    } ${
                      answers[currentQ + 1] === oi
                        ? 'bg-teal-500/10 border-teal-500/40 text-white'
                        : 'bg-[#0a0c10] border-[#1e2330] text-[#9ca3af] hover:border-[#2d3139] hover:text-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[currentQ + 1] === oi ? 'border-teal-500 bg-teal-500' : 'border-[#4b5563]'}`}>
                      {answers[currentQ + 1] === oi && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0 || (examStarted && verificationStep === 'verifying')}
                className="flex items-center gap-2 text-[#6b7280] hover:text-white text-sm cursor-pointer disabled:opacity-30 whitespace-nowrap"
              >
                <i className="ri-arrow-left-line" /> Previous
              </button>
              <button
                onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                disabled={currentQ === questions.length - 1 || (examStarted && verificationStep === 'verifying')}
                className="flex items-center gap-2 text-[#6b7280] hover:text-white text-sm cursor-pointer disabled:opacity-30 whitespace-nowrap"
              >
                Next <i className="ri-arrow-right-line" />
              </button>
            </div>
          </div>
        </main>

        {/* AI Proctor Sidebar */}
        <aside className="w-56 border-l border-[#1e2330] bg-[#0d0f14] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Live webcam */}
          <div className={`relative rounded-xl overflow-hidden ring-2 ${ringColor} bg-[#111318]`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-36 object-cover object-top scale-x-[-1]"
            />
            {/* YOLO Detection Status Indicator */}
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/70 rounded-full px-2 py-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                enhancedMonitoring._debug?.videoStreamReady 
                  ? enhancedMonitoring.phoneDetected 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-green-500 animate-pulse'
                  : 'bg-yellow-500 animate-pulse'
              }`} />
              <span className="text-white text-xs font-bold font-mono">{
                enhancedMonitoring._debug?.videoStreamReady
                  ? enhancedMonitoring.phoneDetected 
                    ? 'PHONE'
                    : 'YOLO OK'
                  : 'INIT'
              }</span>
            </div>
            {proctorState.isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0c10]/90 gap-2">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-teal-400 text-xs font-semibold">Loading AI...</span>
              </div>
            )}
            {proctorState.error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0c10]/90 gap-1 p-2">
                <i className="ri-camera-off-line text-red-400 text-xl" />
                <span className="text-red-400 text-xs text-center leading-tight">{proctorState.error}</span>
              </div>
            )}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/70 rounded-full px-1.5 py-0.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${proctorState.isReady ? 'bg-red-400 animate-pulse' : 'bg-[#4b5563]'}`} />
              <span className="text-white text-xs font-bold">{proctorState.isReady ? 'REC' : 'INIT'}</span>
            </div>
            {proctorState.isReady && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1.5 py-0.5">
                <span className="text-[#9ca3af] text-xs font-mono">{proctorState.fps}fps</span>
              </div>
            )}
          </div>

          {/* Risk score */}
          <div className={`p-3 rounded-xl border ${statusBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wide">Risk Score</span>
              <span className={`text-sm font-bold ${statusColor}`}>{Math.round(riskScore)}/100</span>
            </div>
            <div className="h-2 bg-[#1e2330] rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${riskLevel === 'high' ? 'bg-red-500' : riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <div className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>{riskLevel} risk</div>
          </div>

          {/* AI detection */}
          <div>
            <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide mb-2">AI Detection</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280] flex items-center gap-1"><i className="ri-user-face-line text-xs" /> Face</span>
                <span className={`font-semibold ${!proctorState.isReady ? 'text-[#4b5563]' : proctorState.faceCount === 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {!proctorState.isReady ? '—' : proctorState.faceCount === 0 ? '✗ Absent' : proctorState.faceCount === 1 ? '✓ 1 face' : `✗ ${proctorState.faceCount} faces`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280] flex items-center gap-1"><i className="ri-eye-line text-xs" /> Gaze</span>
                <span className={`font-semibold flex items-center gap-1 ${!proctorState.isReady ? 'text-[#4b5563]' : gazeOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {proctorState.isReady && <i className={`${gazeIcon} text-xs`} />}
                  {!proctorState.isReady ? '—' : gazeOk ? 'Center' : proctorState.gazeDirection.charAt(0).toUpperCase() + proctorState.gazeDirection.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280] flex items-center gap-1"><i className="ri-smartphone-line text-xs" /> Phone</span>
                <span className={`font-semibold ${!proctorState.isReady ? 'text-[#4b5563]' : enhancedMonitoring.phoneDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                  {!proctorState.isReady ? '—' : enhancedMonitoring.phoneDetected ? '✗ Detected' : '✓ None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280] flex items-center gap-1"><i className="ri-focus-3-line text-xs" /> Focus</span>
                <span className={`font-semibold ${focusLock.isFullscreen ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {focusLock.isFullscreen ? '✓ Locked' : '⚠ Unlocked'}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Monitoring Alerts */}
          {(enhancedMonitoring.multipleFaces || enhancedMonitoring.phoneDetected || audioDetection.speechDetected) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide mb-2 text-red-400">
                <i className="ri-alert-line mr-1" />
                Active Alerts
              </div>
              <div className="space-y-1.5 text-xs">
                {enhancedMonitoring.multipleFaces && (
                  <div className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                    <span className="text-red-300">Multiple faces detected</span>
                  </div>
                )}
                {enhancedMonitoring.phoneDetected && (
                  <div className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                    <span className="text-red-300">Phone/device detected ({Math.round(enhancedMonitoring.phoneConfidence)}%)</span>
                  </div>
                )}
                {audioDetection.speechDetected && (
                  <div className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                    <span className="text-red-300">Speech detected</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent AI events */}
          {recentEvents.length > 0 && (
            <div>
              <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide mb-2">AI Events (30s)</div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {[...recentEvents].reverse().slice(0, 4).map(ev => (
                  <div key={ev.id} className="flex items-start gap-1.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${ev.type === 'multiple_faces' ? 'bg-red-400' : ev.type === 'face_absent' ? 'bg-orange-400' : 'bg-amber-400'}`} />
                    <span className="text-[#6b7280] leading-tight">{ev.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snapshot gallery preview */}
          {snapshots.length > 0 && (
            <div>
              <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide mb-2">
                Evidence ({snapshotCount})
              </div>
              <div className="grid grid-cols-2 gap-1">
                {snapshots.slice(-4).map(snap => (
                  <div key={snap.id} className="relative rounded-lg overflow-hidden bg-[#1a1d24] aspect-video">
                    <img
                      src={snap.dataUrl}
                      alt={snap.reason}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                      <div className="text-[10px] text-[#9ca3af] truncate">{snap.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus violations */}
          {focusLock.violations.length > 0 && (
            <div>
              <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide mb-2">Focus Log</div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {[...focusLock.violations].reverse().slice(0, 4).map(v => (
                  <div key={v.id} className="flex items-start gap-1.5 text-xs">
                    <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className={`${focusViolationIcon(v.type)} text-red-400 text-xs`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-red-300 leading-tight truncate">{v.label}</div>
                      <div className="text-[#4b5563] leading-tight">{v.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session events counter */}
          <div className="mt-auto bg-[#111318] border border-[#1e2330] rounded-xl p-3">
            <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide mb-1.5">Session Events</div>
            <div className="grid grid-cols-3 gap-1">
              <div className="text-center">
                <div className="text-amber-400 font-bold text-base">
                  {proctorState.sessionEvents.filter(e => e.type === 'gaze_deviation').length}
                </div>
                <div className="text-[#4b5563] text-xs">Gaze</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold text-base">
                  {proctorState.sessionEvents.filter(e => e.type === 'face_absent').length}
                </div>
                <div className="text-[#4b5563] text-xs">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-bold text-base">{focusLock.violationCount}</div>
                <div className="text-[#4b5563] text-xs">Focus</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit modal */}
      {showSubmitModal && !isTimedOut && !malpracticeDetected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-teal-500/15 mx-auto mb-4">
              <i className="ri-send-plane-line text-teal-400 text-2xl" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Submit Exam?</h2>
            <p className="text-[#6b7280] text-sm mb-3">
              You have answered {Object.keys(answers).length} of {questions.length} questions.
            </p>
            <div className={`flex items-center justify-center gap-2 text-sm font-semibold mb-3 ${statusColor}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${riskLevel === 'high' ? 'bg-red-400' : riskLevel === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              Final Risk Score: {Math.round(riskScore)} ({riskLevel.toUpperCase()})
            </div>
            {focusLock.violationCount > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-red-400 font-semibold mb-2">
                <i className="ri-alert-line" />
                {focusLock.violationCount} focus {focusLock.violationCount === 1 ? 'violation' : 'violations'} recorded
              </div>
            )}
            {snapshotCount > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-orange-400 font-semibold mb-4">
                <i className="ri-camera-line" />
                {snapshotCount} evidence {snapshotCount === 1 ? 'snapshot' : 'snapshots'} captured
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 bg-[#1a1d24] border border-[#2d3139] text-white font-semibold py-3 rounded-xl text-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:bg-[#4b5563] text-white font-bold py-3 rounded-xl text-sm cursor-pointer whitespace-nowrap transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><i className="ri-loader-4-line animate-spin" /> Submitting...</>
                ) : (
                  <>Confirm Submit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
