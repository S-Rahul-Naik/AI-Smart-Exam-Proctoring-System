import mongoose from 'mongoose';

const proctorEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'gaze_deviation', 
      'face_absent', 
      'multiple_faces', 
      'phone_detected', 
      'tab_switch', 
      'fullscreen_exit',
      'right_click',
      'devtools_open',
      'copy_paste',
      'unusual_movement',
      'headphone_detected',
      'low_light',
      'face_blur',
      'extreme_gaze_angle',
      'rapid_head_movement',
      'background_change',
      'audio_detection',
      'speech_detected',
      'lip_movement_detected',
      'browser_lockdown',
      'context_menu_blocked',
      'face_match_success',     // ← NEW: Successful face verification
      'face_match_failure',      // ← NEW: Failed face verification
      'face_swap_suspected',     // ← NEW: Face swap/spoofing detected
      'face_mismatch',           // ← NEW: Face mismatch detected
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  weight: {
    type: Number,
    required: true,
  },
  gazeDir: String,
  label: String,
  snapshotUrl: String,
  confidence: Number,
  deviceDetected: String, // "phone", "tablet", "headphones", etc.
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  metadata: mongoose.Schema.Types.Mixed, // For additional event-specific data
}, { _id: false }); // Disable automatic _id for subdocuments

const malpracticeIndicatorSchema = new mongoose.Schema({
  indicatorType: {
    type: String, // "phone_use", "multiple_people", "tab_switching", "copy_paste", etc.
  },
  severity: String,
  evidence: String,
  timestamps: [Date], // Array of timestamps when the malpractice was detected
  confidence: Number, // Confidence score 0-100
}, { _id: false }); // Disable automatic _id for subdocuments

const sessionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: Number,
    status: {
      type: String,
      enum: ['initiated', 'in_progress', 'submitted', 'completed', 'flagged', 'terminated'],
      default: 'initiated',
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    events: [proctorEventSchema],
    totalEvents: {
      type: Number,
      default: 0,
    },
    // Event counters by type
    eventCounts: {
      faceAbsent: { type: Number, default: 0 },
      gazeDeviation: { type: Number, default: 0 },
      multipleFaces: { type: Number, default: 0 },
      phoneDetected: { type: Number, default: 0 },
      tabSwitch: { type: Number, default: 0 },
      fullscreenExit: { type: Number, default: 0 },
      rightClick: { type: Number, default: 0 },
      devtoolsOpen: { type: Number, default: 0 },
      copyPaste: { type: Number, default: 0 },
      unusualMovement: { type: Number, default: 0 },
      headphoneDetected: { type: Number, default: 0 },
      lowLight: { type: Number, default: 0 },
      faceBlur: { type: Number, default: 0 },
      extremeGazeAngle: { type: Number, default: 0 },
      rapidHeadMovement: { type: Number, default: 0 },
      backgroundChange: { type: Number, default: 0 },
    },
    // Risk indicators
    suspiciousActivities: [
      {
        category: String, // "biometric", "behavior", "environment", "technical"
        indicator: String,
        severity: String,
        detectedAt: Date,
        confidence: Number,
      },
    ],
    // Snapshots and evidence
    snapshots: [
      {
        url: String,
        timestamp: Date,
        eventType: String,
        reason: String,
      },
    ],
    videoUrl: String,
    // Session integrity flags
    malpracticeIndicators: [malpracticeIndicatorSchema],
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
    flagSeverity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    // Admin review and decision
    adminReview: {
      reviewed: {
        type: Boolean,
        default: false,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
      reviewedAt: Date,
      notes: String,
      decision: {
        type: String,
        enum: ['approved', 'rejected', 'pending', 'needs_manual_review'],
        default: 'pending',
      },
      riskAssessment: String, // "no_risk", "low_risk", "medium_risk", "high_risk"
    },
    // Identity Verification Data
    identityVerification: {
      verified: {
        type: Boolean,
        default: false,
      },
      verificationMethod: String, // "selfie_only", "selfie_with_id"
      enrollmentPhotoUrl: String,
      verificationPhotoUrl: String,
      faceMatchConfidence: Number, // 0-100
      verificationTimestamp: Date,
      attempts: {
        type: Number,
        default: 0,
      },
      verificationNotes: String,
    },
    // Screen & Session Recording
    recording: {
      enabled: {
        type: Boolean,
        default: true,
      },
      videoUrl: String, // Full session recording
      recordingSize: Number, // In bytes
      recordingDuration: Number, // In seconds
      startedAt: Date,
      stoppedAt: Date,
      uploadedAt: Date,
      uploadStatus: String, // pending | uploading | completed | failed
    },
    // Browser Lockdown Events
    browserLockdown: {
      devtoolsAttempts: {
        type: Number,
        default: 0,
      },
      copyPasteAttempts: {
        type: Number,
        default: 0,
      },
      contextMenuAttempts: {
        type: Number,
        default: 0,
      },
      shortcutsBlocked: {
        type: Number,
        default: 0,
      },
      inspectElementAttempts: {
        type: Number,
        default: 0,
      },
      printAttempts: {
        type: Number,
        default: 0,
      },
    },
    // Lip Movement & Audio Detection
    audioAnalysis: {
      suspiciousSpeechDetected: {
        type: Boolean,
        default: false,
      },
      speechEvents: {
        type: Number,
        default: 0,
      },
      lipMovementEvents: {
        type: Number,
        default: 0,
      },
      audioDeviceChanges: {
        type: Number,
        default: 0,
      },
    },
    // Exam answers and scores
    answers: {
      type: Map,
      of: Number,
    },
    score: Number,
    examScore: {
      obtained: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },
    result: String,
    // Performance metrics
    performanceMetrics: {
      averageResponseTime: Number,
      skippedQuestions: Number,
      changedAnswers: Number,
      reviewedQuestions: Number,
    },
    // Biometric data summary
    biometricSummary: {
      facePresencePercentage: Number,
      averageGazeDeviation: Number,
      headStabilityScore: Number,
      lightingQuality: String,
    },
    // Auto-submit tracking for identity verification failures
    autoSubmit: {
      type: Boolean,
      default: false,
    },
    autoSubmitReason: {
      type: String,
      enum: [
        'face_verification_failed',
        'face_mismatch_detected',
        'no_face_detected',
        'multiple_people_detected',
        'identity_confidence_low',
      ],
    },
    autoSubmitTimestamp: Date,
    faceVerificationFailures: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Session', sessionSchema);
