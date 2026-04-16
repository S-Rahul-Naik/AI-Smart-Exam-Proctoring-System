import Session from '../models/Session.js';
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import Alert from '../models/Alert.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { monitoringService } from '../services/monitoringService.js';
import scoringService from '../services/scoringService.js';
import logger from '../utils/logger.js';

// Event weights for the malpractice report
const EVENT_WEIGHTS = {
  face_absent: { weight: 20, severity: 'high' },
  multiple_faces: { weight: 25, severity: 'critical' },
  phone_detected: { weight: 30, severity: 'critical' },
  gaze_deviation: { weight: 8, severity: 'medium' },
  tab_switch: { weight: 15, severity: 'high' },
  fullscreen_exit: { weight: 12, severity: 'high' },
  right_click: { weight: 5, severity: 'low' },
  devtools_open: { weight: 25, severity: 'critical' },
  copy_paste: { weight: 20, severity: 'high' },
  unusual_movement: { weight: 10, severity: 'medium' },
  headphone_detected: { weight: 15, severity: 'medium' },
  low_light: { weight: 5, severity: 'low' },
  face_blur: { weight: 10, severity: 'medium' },
  extreme_gaze_angle: { weight: 12, severity: 'high' },
  rapid_head_movement: { weight: 15, severity: 'high' },
  background_change: { weight: 8, severity: 'medium' },
};

export const initializeSession = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const studentId = req.user?.id;

    console.log('==== initializeSession Request ====');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    console.log('StudentID:', studentId);
    console.log('ExamID:', examId);

    if (!studentId) {
      console.error('❌ Student not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!examId) {
      console.error('❌ Exam ID missing');
      return res.status(400).json({ error: 'Exam ID required' });
    }

    // Try to find exam, but don't fail if it doesn't exist
    let exam = null;
    try {
      exam = await Exam.findById(examId);
      console.log('Found exam by ID:', exam ? exam._id : 'not found');
    } catch (e) {
      // Invalid ObjectId format, check for default exam
      console.log('Invalid ObjectId format, checking for default exam');
      if (examId === 'exam-001') {
        // Check if default exam already exists
        exam = await Exam.findOne({ code: 'CS401' });
        
        // If it doesn't exist, create it
        if (!exam) {
          console.log('Creating new default exam...');
          exam = new Exam({
            title: 'Advanced Algorithms & Data Structures',
            description: 'Test your knowledge of DSA concepts',
            subject: 'Computer Science',
            code: 'CS401',
            duration: 180,
            totalQuestions: 5,
            totalMarks: 100,
            passingMarks: 50,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
            instructions: 'Answer all questions.',
            status: 'published',
          });
          try {
            await exam.save();
            console.log('✓ Default exam created successfully:', exam._id);
          } catch (saveErr) {
            console.error('Failed to create default exam:', saveErr.message);
          }
        } else {
          console.log('✓ Using existing default exam:', exam._id);
        }
      }
    }

    const examRef = exam?._id || examId;

    // Check for existing session
    console.log('Checking for existing session...');
    let existingSession = await Session.findOne({
      exam: examRef,
      student: studentId,
      status: { $in: ['initiated', 'in_progress'] },
    });

    if (existingSession) {
      console.log('✓ Reusing existing session:', existingSession._id);
      return res.status(201).json({ message: 'Session reused', session: existingSession });
    }

    // Create new session
    console.log('Creating new session...');
    const session = new Session({
      exam: examRef,
      student: studentId,
      status: 'initiated',
    });

    await session.save();
    console.log('✓ Session created successfully:', session._id);

    res.status(201).json({ message: 'Session initialized', session });
  } catch (error) {
    console.error('❌ Session initialization error:', error.message);
    console.error('Stack:', error.stack);
    next(error);
  }
};

export const startSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Get session and exam details
    const session = await Session.findById(sessionId).populate('exam');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const exam = session.exam;

    // ✅ VALIDATE EXAM DATE AND TIME
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (exam.date) {
      const examDate = new Date(exam.date);
      const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

      // Check if today is not the exam date
      if (examDateOnly.getTime() !== today.getTime()) {
        return res.status(403).json({
          error: `Exam can only be taken on ${exam.date}. Today is ${today.toISOString().split('T')[0]}`,
          examDate: exam.date,
        });
      }
    }

    // Check time window if start and end times are specified
    if (exam.startTime && exam.endTime) {
      const [startHour, startMin] = exam.startTime.split(':').map(Number);
      const [endHour, endMin] = exam.endTime.split(':').map(Number);

      const startTime = new Date(now);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(now);
      endTime.setHours(endHour, endMin, 0, 0);

      if (now < startTime) {
        return res.status(403).json({
          error: `Exam has not started yet. It will start at ${exam.startTime}.`,
          startTime: exam.startTime,
          currentTime: now.toLocaleTimeString(),
        });
      }

      if (now > endTime) {
        return res.status(403).json({
          error: `Exam has ended. It ended at ${exam.endTime}.`,
          endTime: exam.endTime,
          currentTime: now.toLocaleTimeString(),
        });
      }
    }

    // Update session status
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { status: 'in_progress', startTime: new Date() },
      { new: true }
    ).populate('exam');

    console.log(`✅ Session ${sessionId} started successfully`);
    res.json({ message: 'Session started', session: updatedSession });
  } catch (error) {
    console.error('❌ Error starting session:', error.message);
    next(error);
  }
};

export const submitSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;

    // First fetch existing session to get startTime
    const existingSession = await Session.findById(sessionId).populate('exam');
    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate duration based on existing session
    const duration = Date.now() - new Date(existingSession.startTime).getTime();

    // ✅ CALCULATE EXAM SCORE
    let examScore = { score: 0, percentage: 0, breakdown: {} };
    let riskScoreData = { riskScore: 0, riskLevel: 'low' };

    // Determine if auto-submitted
    const phoneDetected = existingSession.events?.some(e => e.type === 'phone_detected');
    const multipleFacesDetected = existingSession.events?.some(e => e.type === 'multiple_faces');
    const devtoolsDetected = existingSession.events?.some(e => e.type === 'devtools_open');
    const isAutoSubmitted = phoneDetected || multipleFacesDetected || devtoolsDetected;

    try {
      // Calculate exam score from answers
      const examIdForScoring =
        (existingSession.exam && typeof existingSession.exam === 'object' && existingSession.exam._id)
          ? existingSession.exam._id
          : existingSession.exam;

      if (answers && examIdForScoring) {
        examScore = await scoringService.calculateExamScore(
          examIdForScoring,
          new Map(Object.entries(answers)),
          isAutoSubmitted  // Pass flag for auto-submitted handling
        );
        console.log('✅ Exam score calculated:', {
          examIdForScoring,
          percentage: examScore.percentage,
          obtainedMarks: examScore.obtainedMarks,
          totalMarks: examScore.totalMarks,
          isAutoSubmitted,
        });
      }

      // Calculate risk score from events
      riskScoreData = monitoringService.calculateRiskScore(existingSession);
      console.log('✅ Risk score calculated:', { score: riskScoreData.riskScore });
    } catch (scoreError) {
      console.warn('⚠️ Error calculating scores:', scoreError.message);
      // Continue with defaults if scoring fails
    }

    // ✅ AUTO-FLAG on critical malpractice
    // Check for critical violations that should auto-flag
    const criticalViolations = [];
    
    // 1. Check for phone detected
    if (phoneDetected) {
      criticalViolations.push('phone_detected');
    }
    
    // 2. Check for multiple faces
    if (multipleFacesDetected) {
      criticalViolations.push('multiple_faces');
    }
    
    // 3. Check for devtools
    if (devtoolsDetected) {
      criticalViolations.push('devtools_open');
    }
    
    // Determine if session should be flagged
    let shouldFlag = false;
    let flagReason = '';
    
    if (criticalViolations.length > 0) {
      shouldFlag = true;
      const violationLabels = {
        phone_detected: 'Phone detected during exam',
        multiple_faces: 'Multiple people detected',
        devtools_open: 'Developer tools opened'
      };
      
      flagReason = `CRITICAL VIOLATIONS: ${criticalViolations
        .map(v => violationLabels[v])
        .join('; ')}`;
      
      console.warn(`🚨 AUTO-FLAGGING SESSION ${sessionId} FOR MALPRACTICE`);
      console.warn(`   Violations: ${flagReason}`);
    }

    // Now update session with calculated duration, scores, and flagging
    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        status: shouldFlag ? 'flagged' : 'submitted',
        endTime: new Date(),
        answers,
        duration,
        score: examScore.score,
        examScore: {
          obtained: examScore.obtainedMarks || 0,
          total: examScore.totalMarks || 0,
          percentage: examScore.percentage || 0,
        },
        riskScore: riskScoreData.riskScore,
        riskLevel: riskScoreData.riskLevel,
        flagged: shouldFlag,
        flagReason: shouldFlag ? flagReason : undefined,
        flagSeverity: shouldFlag ? 'critical' : undefined,
      },
      { new: true }
    );

    // Also update malpractice indicators if flagged
    if (shouldFlag) {
      const indicators = monitoringService.detectMalpractice(session);
      if (indicators.length > 0) {
        session.malpracticeIndicators = indicators;
        await session.save();
      }
    }

    console.log(`✅ Session ${sessionId} submitted:`, {
      flagged: shouldFlag,
      reason: flagReason || 'Clean submission',
      duration: `${(duration / 1000).toFixed(1)}s`,
      examScore: `${examScore.percentage}%`,
      riskScore: riskScoreData.riskScore,
    });

    res.json({ 
      message: shouldFlag ? 'Session flagged for malpractice' : 'Session submitted',
      session,
      flagged: shouldFlag,
      scores: {
        examScore: examScore.percentage,
        riskScore: riskScoreData.riskScore,
      }
    });
  } catch (error) {
    console.error('❌ ERROR Submitting Session:', error.message);
    next(error);
  }
};

export const recordEvent = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { events } = req.body;

    // Filter to show ONLY phone detection
    const phoneEvents = events?.filter(e => e.type === 'phone_detected') || [];
    if (phoneEvents.length > 0) {
      console.log('\n🔴🔴🔴 PHONE DETECTION ATTEMPT 🔴🔴🔴');
      phoneEvents.forEach((event, idx) => {
        console.log(`  [${idx + 1}] Confidence: ${event.confidence}% | Label: ${event.label}`);
      });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      console.warn('⚠️ No events in request body');
      return res.status(400).json({ error: 'Events array required' });
    }

    // ⚠️ AGGRESSIVE: Prevent MongoDB 16MB document size limit
    // Limit each batch to max 50 events per request (stricter than before)
    const maxEventsPerBatch = 50;
    const limitedEvents = events.slice(0, maxEventsPerBatch);
    if (events.length > maxEventsPerBatch) {
      console.warn(`⚠️ Event batch too large (${events.length}), limiting to ${maxEventsPerBatch} events`);
    }

    // Use monitoring service to record events
    const result = await monitoringService.recordEvent(sessionId, limitedEvents);

    res.json({
      message: 'Events recorded',
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      flagged: result.flagged,
      malpracticeIndicators: result.malpracticeIndicators,
    });
  } catch (error) {
    console.error('❌ ERROR Recording Events:', error.message);
    console.error(error);
    next(error);
  }
};

// Background upload queue - non-blocking snapshot uploads
const uploadQueue = [];
let isProcessingQueue = false;

const processUploadQueue = async () => {
  if (isProcessingQueue || uploadQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (uploadQueue.length > 0) {
    const task = uploadQueue.shift();
    try {
      await task();
    } catch (err) {
      console.error('❌ Background upload failed:', err.message);
    }
  }
  isProcessingQueue = false;
};

export const uploadSnapshot = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { eventType } = req.body;
    const file = req.file;

    if (!file) {
      logger.error('Upload Error', 'No file provided in snapshot upload');
      return res.status(400).json({ error: 'No file provided' });
    }

    // Find session first
    const session = await Session.findById(sessionId);
    if (!session) {
      logger.error('Upload Error', 'Session not found', sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }

    // IMMEDIATELY store a real image URL (data URL) so admin timeline can render thumbnails
    const mimeType = file.mimetype || 'image/jpeg';
    const inlineDataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;

    // Store snapshot metadata immediately - never wait for cloud upload
    const snapshotMetadata = {
      url: inlineDataUrl,
      timestamp: new Date(),
      eventType,
      size: file.size,
      stored: 'local-inline',
      cloudinaryPending: true,
    };

    session.snapshots.push(snapshotMetadata);
    await session.save();

    // Return success IMMEDIATELY to avoid blocking the exam
    res.json({
      message: 'Snapshot stored',
      snapshot: snapshotMetadata,
    });

    // Queue the Cloudinary upload as a background task (non-blocking)
    // Check if Cloudinary is enabled in .env
    const cloudinaryEnabled = process.env.CLOUDINARY_ENABLED === 'true';
    
    if (cloudinaryEnabled) {
      console.log('📤 Queuing Cloudinary upload in background...');
      uploadQueue.push(async () => {
        // Check if ALL Cloudinary credentials are configured
        const hasCloudinaryCredentials = 
          process.env.CLOUDINARY_CLOUD_NAME && 
          process.env.CLOUDINARY_API_KEY && 
          process.env.CLOUDINARY_API_SECRET;

        if (!hasCloudinaryCredentials) {
          console.log('⚠️ Cloudinary not fully configured (missing credentials) - keeping local copy');
          return;
        }

        try {
          // Try Cloudinary upload with a short deadline (15 seconds)
          const uploadResult = await Promise.race([
            uploadToCloudinary(
              file.buffer,
              `session-${sessionId}-${Date.now()}`,
              'proctor/snapshots'
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Cloudinary timeout (15s)')), 15000)
            ),
          ]);

          // Update the snapshot URL if upload succeeds
          const snapshot = session.snapshots.find(s => s._id.equals(snapshotMetadata._id));
          if (snapshot) {
            snapshot.url = uploadResult.secure_url;
            snapshot.cloudinaryPending = false;
            snapshot.stored = 'cloudinary';
            await session.save();
            logger.snapshot('upload', eventType, file.size, 'Cloudinary success');
          }
        } catch (error) {
          logger.warn('Cloud Upload Failed', error.message);
          // Keep local copy - Cloudinary failure is not critical
          // Snapshots are safely stored in MongoDB
        }
      });

      // Start processing queue asynchronously
      setImmediate(() => processUploadQueue());
    } else {
      logger.snapshot('save', eventType, file.size, 'Local storage (Cloudinary disabled)');
    }

    // Start processing queue asynchronously
    setImmediate(() => processUploadQueue());

  } catch (error) {
    logger.error('Upload Error', error.message);
    next(error);
  }
};

export const getSessionDetails = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('exam')
      .populate('student');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
};

export const reviewSession = async (req, res, next) => {
  try {
    const { sessionId, decision, notes } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        'adminReview.reviewed': true,
        'adminReview.reviewedBy': req.user.id,
        'adminReview.reviewedAt': new Date(),
        'adminReview.decision': decision,
        'adminReview.notes': notes,
        status: decision === 'rejected' ? 'flagged' : 'completed',
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session reviewed', session });
  } catch (error) {
    next(error);
  }
};

export const getSessionAnalysis = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const analysis = await monitoringService.getSessionAnalysis(sessionId);
    res.json({ analysis });
  } catch (error) {
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    next(error);
  }
};

export const getHighRiskSessions = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);

    const sessions = await monitoringService.getHighRiskSessions(examId, limit);
    res.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionsNeedingReview = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const sessions = await monitoringService.getSessionsNeedingReview(limit);
    res.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    next(error);
  }
};

export const flagSessionForReview = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { reason, severity, notes } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        flagged: true,
        flagReason: reason,
        flagSeverity: severity || 'high',
        'adminReview.notes': notes,
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session flagged for review', session });
  } catch (error) {
    next(error);
  }
};

export const getMalpracticeReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const snapshots = Array.isArray(session.snapshots) ? session.snapshots : [];

    const resolveNearestSnapshotUrl = (eventTimestamp) => {
      if (!eventTimestamp || !snapshots.length) return null;
      const eventTime = new Date(eventTimestamp).getTime();
      if (Number.isNaN(eventTime)) return null;

      let best = null;
      let bestDiff = Number.POSITIVE_INFINITY;

      for (const snapshot of snapshots) {
        if (!snapshot?.timestamp || !snapshot?.url) continue;
        const snapTime = new Date(snapshot.timestamp).getTime();
        if (Number.isNaN(snapTime)) continue;
        const diff = Math.abs(snapTime - eventTime);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = snapshot;
        }
      }

      // Only attach when snapshot is reasonably close to the event.
      return best && bestDiff <= 5 * 60 * 1000 ? best.url : null;
    };

    // Generate comprehensive malpractice report
    const report = {
      sessionId: session._id,
      studentEmail: session.student?.email,
      examCode: session.exam,
      timestamp: new Date(),
      overallRiskScore: session.riskScore,
      riskLevel: session.riskLevel,
      eventLog: session.events.map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        label: typeof e.label === 'string' ? e.label : e.type,
        severity: e.severity || EVENT_WEIGHTS[e.type]?.severity,
        confidence: e.confidence,
        snapshotUrl: e.snapshotUrl || resolveNearestSnapshotUrl(e.timestamp),
      })),
      malpracticeIndicators: session.malpracticeIndicators,
      evidence: {
        totalSnapshots: session.snapshots.length,
        videoAvailable: !!session.videoUrl,
        snapshots: session.snapshots,
      },
      administratorNotes: session.adminReview?.notes,
    };

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

/**
 * Background face verification endpoint
 * Verifies student identity without blocking exam UI
 * Auto-submits exam if verification fails N times
 */
export const verifyFaceBackground = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { livePhotoBase64, confidence } = req.body;

    if (!sessionId || !livePhotoBase64) {
      return res.status(400).json({ 
        error: 'Missing sessionId or live photo',
        verified: false 
      });
    }

    // Get session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found',
        verified: false 
      });
    }

    // Check if enrollment photo exists
    if (!session.identityVerification?.enrollmentPhotoUrl) {
      console.warn(`⚠️ No enrollment photo for session ${sessionId}`);
      return res.status(400).json({
        error: 'No enrollment photo available',
        verified: false
      });
    }

    // Determine if verification is successful based on confidence score
    // Using the confidence passed from frontend (from face matching service)
    const verificationThreshold = 70; // 70% confidence required
    const isVerified = confidence >= verificationThreshold;

    // Update session
    if (isVerified) {
      // Success - mark as verified
      session.identityVerification.verified = true;
      session.identityVerification.faceMatchConfidence = confidence;
      session.identityVerification.verificationTimestamp = new Date();
      session.faceVerificationFailures = 0;
    } else {
      // Failure - increment failure counter
      session.faceVerificationFailures = (session.faceVerificationFailures || 0) + 1;
      session.identityVerification.faceMatchConfidence = confidence;
      
      console.warn(`⚠️ Face verification failed for session ${sessionId}. Attempts: ${session.faceVerificationFailures}`);
      
      // Auto-submit if max failures reached (3 attempts)
      const MAX_VERIFY_FAILURES = 3;
      if (session.faceVerificationFailures >= MAX_VERIFY_FAILURES) {
        console.error(`❌ AUTO-SUBMITTING SESSION ${sessionId} - Face verification failed after ${MAX_VERIFY_FAILURES} attempts`);
        
        session.autoSubmit = true;
        session.autoSubmitReason = 'face_verification_failed';
        session.autoSubmitTimestamp = new Date();
        session.status = 'submitted';
        session.endTime = new Date();
        
        // Calculate duration
        const duration = session.endTime - new Date(session.startTime);
        session.duration = Math.floor(duration / 1000); // Convert to seconds
        
        // Add event for auto-submission
        session.events.push({
          type: 'face_absent',
          timestamp: new Date(),
          label: 'Auto-submit: Identity verification failed',
          severity: 'critical',
          weight: 30,
          confidence: 100,
        });
        
        await session.save();
        
        return res.status(200).json({
          verified: false,
          autoSubmitted: true,
          reason: 'Face verification failed after 3 attempts. Exam has been auto-submitted.',
          message: 'Identity verification could not be completed. Your exam has been submitted automatically.'
        });
      }
    }

    await session.save();

    res.status(200).json({
      verified: isVerified,
      confidence,
      attempts: session.faceVerificationFailures,
      message: isVerified ? 'Identity verified' : `Verification failed. Attempt ${session.faceVerificationFailures}/3`
    });
  } catch (error) {
    console.error('❌ Face verification error:', error);
    next(error);
  }
};
