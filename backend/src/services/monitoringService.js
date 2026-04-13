/**
 * Comprehensive Exam Monitoring Service
 * Handles event recording, risk scoring, and malpractice detection
 */

import Session from '../models/Session.js';

// Event weights for risk calculation
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

// Thresholds for auto-flagging
const RISK_THRESHOLDS = {
  low: { min: 0, max: 35 },
  medium: { min: 35, max: 65 },
  high: { min: 65, max: 85 },
  critical: { min: 85, max: 100 },
};

const AUTO_FLAG_THRESHOLDS = {
  critical_events: 2, // 2+ critical events = auto-flag
  multiple_violations: 5, // 5+ events within time window
  phone_detected: true, // Any phone detection = auto-flag
  multiple_people: true, // Multiple faces = auto-flag
  devtools_opened: true, // DevTools = auto-flag
};

export const monitoringService = {
  /**
   * Calculate risk score based on events
   */
  calculateRiskScore(session) {
    if (!session.events || session.events.length === 0) {
      return { riskScore: 0, riskLevel: 'low', breakdown: {} };
    }

    const now = Date.now();
    const WINDOW = 30 * 60 * 1000; // 30-minute rolling window

    // Get recent events
    const recentEvents = session.events.filter(
      e => now - new Date(e.timestamp).getTime() < WINDOW
    );

    let totalScore = 0;
    const breakdown = {};

    // Calculate score from events
    recentEvents.forEach(event => {
      const eventConfig = EVENT_WEIGHTS[event.type];
      if (eventConfig) {
        const weight = eventConfig.weight * (event.confidence || 1);
        totalScore += weight;
        breakdown[event.type] = (breakdown[event.type] || 0) + weight;
      }
    });

    // Add severity multipliers
    const criticalCount = session.events.filter(
      e => EVENT_WEIGHTS[e.type]?.severity === 'critical'
    ).length;
    if (criticalCount > 0) {
      totalScore += criticalCount * 15; // Multiplier for critical events
    }

    // Cap at 100
    const riskScore = Math.min(100, Math.round(totalScore));
    const riskLevel = this.getRiskLevel(riskScore);

    return { riskScore, riskLevel, breakdown };
  },

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score >= 85) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  },

  /**
   * Detect malpractice indicators
   */
  detectMalpractice(session) {
    const indicators = [];

    if (!session.events) return indicators;

    // 1. Phone detection
    const phoneEvents = session.events.filter(e => e.type === 'phone_detected');
    if (phoneEvents.length > 0) {
      indicators.push({
        indicatorType: 'phone_use',
        severity: 'critical',
        evidence: `${phoneEvents.length} phone detections`,
        timestamps: phoneEvents.map(e => e.timestamp),
        confidence: Math.min(100, 80 + phoneEvents.length * 5),
      });
    }

    // 2. Multiple people
    const multiplesFaces = session.events.filter(e => e.type === 'multiple_faces');
    if (multiplesFaces.length > 1) {
      indicators.push({
        indicatorType: 'multiple_people',
        severity: 'critical',
        evidence: `${multiplesFaces.length} instances of multiple faces`,
        timestamps: multiplesFaces.map(e => e.timestamp),
        confidence: 95,
      });
    }

    // 3. Frequent face absence
    const faceAbsent = session.events.filter(e => e.type === 'face_absent');
    if (faceAbsent.length > 10) {
      indicators.push({
        indicatorType: 'frequent_face_absence',
        severity: 'high',
        evidence: `${faceAbsent.length} instances of face absence`,
        timestamps: faceAbsent.map(e => e.timestamp),
        confidence: Math.min(100, 60 + faceAbsent.length * 2),
      });
    }

    // 4. Tab switching
    const tabSwitches = session.events.filter(e => e.type === 'tab_switch');
    if (tabSwitches.length > 5) {
      indicators.push({
        indicatorType: 'tab_switching',
        severity: 'high',
        evidence: `${tabSwitches.length} tab switches detected`,
        timestamps: tabSwitches.map(e => e.timestamp),
        confidence: Math.min(100, 70 + tabSwitches.length),
      });
    }

    // 5. Developer tools
    const devtoolsEvents = session.events.filter(e => e.type === 'devtools_open');
    if (devtoolsEvents.length > 0) {
      indicators.push({
        indicatorType: 'devtools_usage',
        severity: 'critical',
        evidence: `${devtoolsEvents.length} devtools openings`,
        timestamps: devtoolsEvents.map(e => e.timestamp),
        confidence: 100,
      });
    }

    // 6. Copy-paste attempts
    const copyPasteEvents = session.events.filter(e => e.type === 'copy_paste');
    if (copyPasteEvents.length > 3) {
      indicators.push({
        indicatorType: 'copy_paste_usage',
        severity: 'high',
        evidence: `${copyPasteEvents.length} copy-paste attempts`,
        timestamps: copyPasteEvents.map(e => e.timestamp),
        confidence: Math.min(100, 75 + copyPasteEvents.length * 5),
      });
    }

    // 7. Unusual gaze patterns
    const gazeEvents = session.events.filter(e => e.type === 'gaze_deviation');
    if (gazeEvents.length > 20) {
      indicators.push({
        indicatorType: 'unusual_gaze_pattern',
        severity: 'medium',
        evidence: `${gazeEvents.length} gaze deviations`,
        timestamps: gazeEvents.slice(-5).map(e => e.timestamp),
        confidence: 65,
      });
    }

    // 8. Background changes
    const bgChanges = session.events.filter(e => e.type === 'background_change');
    if (bgChanges.length > 3) {
      indicators.push({
        indicatorType: 'background_manipulation',
        severity: 'high',
        evidence: `${bgChanges.length} background changes`,
        timestamps: bgChanges.map(e => e.timestamp),
        confidence: 80,
      });
    }

    // 9. Rapid head movement
    const headMovement = session.events.filter(e => e.type === 'rapid_head_movement');
    if (headMovement.length > 8) {
      indicators.push({
        indicatorType: 'suspicious_head_movement',
        severity: 'medium',
        evidence: `${headMovement.length} instances of rapid movement`,
        timestamps: headMovement.slice(-5).map(e => e.timestamp),
        confidence: 70,
      });
    }

    // 10. Extreme gaze angles
    const extremeGaze = session.events.filter(e => e.type === 'extreme_gaze_angle');
    if (extremeGaze.length > 5) {
      indicators.push({
        indicatorType: 'extreme_gaze_angles',
        severity: 'medium',
        evidence: `${extremeGaze.length} extreme angles detected`,
        timestamps: extremeGaze.slice(-5).map(e => e.timestamp),
        confidence: 75,
      });
    }

    return indicators;
  },

  /**
   * Determine if session should be auto-flagged
   */
  shouldAutoFlag(session, riskLevel) {
    if (!session.events) return false;

    // Critical risk level auto-flag
    if (riskLevel === 'critical') {
      return { flag: true, reason: 'Critical risk level detected' };
    }

    // Count critical events
    const criticalEvents = session.events.filter(
      e => EVENT_WEIGHTS[e.type]?.severity === 'critical'
    );
    if (criticalEvents.length >= AUTO_FLAG_THRESHOLDS.critical_events) {
      return {
        flag: true,
        reason: `Multiple critical events detected (${criticalEvents.length})`,
      };
    }

    // Phone detected = auto-flag
    if (session.events.some(e => e.type === 'phone_detected')) {
      return { flag: true, reason: 'Phone device detected' };
    }

    // Multiple faces = auto-flag
    if (session.events.some(e => e.type === 'multiple_faces')) {
      return { flag: true, reason: 'Multiple people detected' };
    }

    // DevTools opened = auto-flag
    if (session.events.some(e => e.type === 'devtools_open')) {
      return { flag: true, reason: 'Developer tools opened' };
    }

    // Too many events in short time
    const recentWindow = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const recentCount = session.events.filter(
      e => now - new Date(e.timestamp).getTime() < recentWindow
    ).length;
    if (recentCount >= AUTO_FLAG_THRESHOLDS.multiple_violations) {
      return {
        flag: true,
        reason: `Many suspicious events detected (${recentCount} in 5 minutes)`,
      };
    }

    return { flag: false, reason: null };
  },

  /**
   * Record event and update session risk
   */
  async recordEvent(sessionId, events) {
    try {
      if (!events || events.length === 0) {
        return {};
      }

      // FILTER AND LOG ONLY PHONE DETECTION
      const phoneEvents = events.filter(e => e.type === 'phone_detected');
      if (phoneEvents.length > 0) {
        console.log('\n🔴🔴🔴 PHONE DETECTED IN SERVICE 🔴🔴🔴');
        phoneEvents.forEach((event, idx) => {
          console.log(`  [${idx + 1}] Confidence: ${event.confidence}% | Label: ${event.label}`);
        });
      }

      // ⚠️ PROACTIVE FIX: Archive events BEFORE pushing new ones
      // This prevents the "BSONObjectTooLarge" error
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // If session already has many events, archive them IMMEDIATELY
      if (session.events && session.events.length > 2000) {
        console.log(`⚠️ Session has ${session.events.length} events. Archiving to prevent 16MB limit...`);
        
        // Keep only the most recent 500 events
        const eventsToKeep = 500;
        if (session.events.length > eventsToKeep) {
          console.log(`📦 Pruning to ${eventsToKeep} events (removing ${session.events.length - eventsToKeep} old events)`);
          
          await Session.findByIdAndUpdate(
            sessionId,
            {
              $set: {
                events: session.events.slice(-eventsToKeep), // Keep ONLY last 500
                eventCount: session.events.length, // Track original total
              },
            },
            { runValidators: false }
          );
          
          // Reload session with pruned events
          const updatedSession = await Session.findById(sessionId);
          if (updatedSession) {
            session.events = updatedSession.events;
          }
        }
      }

      // Now safely push new events (after pruning)
      const updateOps = {
        $push: { events: { $each: events } },
        $inc: { totalEvents: events.length },
      };

      // Add counter increments
      events.forEach(event => {
        const countKey = this.getCountKeyForEventType(event.type);
        if (countKey) {
          updateOps.$inc[`eventCounts.${countKey}`] = 1;
        }
      });

      // Fetch session to calculate new stats
      const updatedSession = await Session.findByIdAndUpdate(
        sessionId,
        updateOps,
        { new: true, runValidators: false }
      );

      if (!updatedSession) {
        throw new Error('Session not found');
      }

      // Recalculate risk and malpractice (but don't save these atomically to avoid conflicts)
      const { riskScore, riskLevel } = this.calculateRiskScore(updatedSession);
      const malpracticeIndicators = this.detectMalpractice(updatedSession);

      // Check for auto-flagging
      const flagDecision = this.shouldAutoFlag(updatedSession, riskLevel);

      // Single update for risk and flags
      const flagUpdateOps = {
        $set: {
          riskScore,
          riskLevel,
          malpracticeIndicators,
        },
      };

      if (flagDecision.flag && !updatedSession.flagged) {
        flagUpdateOps.$set.flagged = true;
        flagUpdateOps.$set.flagReason = flagDecision.reason;
        flagUpdateOps.$set.flagSeverity = malpracticeIndicators.length > 0 ? 'critical' : 'high';
        flagUpdateOps.$set.status = 'flagged';
      }

      await Session.findByIdAndUpdate(sessionId, flagUpdateOps, { runValidators: false });

      console.log(`✅ Event recording complete\n`);

      return {
        riskScore,
        riskLevel,
        flagged: flagDecision.flag,
        malpracticeIndicators,
      };
    } catch (error) {
      console.error('❌ ERROR RECORDING EVENT:', error.message);
      console.error(error);
      throw error;
    }
  },

  /**
   * Map event type to count key
   */
  getCountKeyForEventType(eventType) {
    const mapping = {
      face_absent: 'faceAbsent',
      gaze_deviation: 'gazeDeviation',
      multiple_faces: 'multipleFaces',
      phone_detected: 'phoneDetected',
      tab_switch: 'tabSwitch',
      fullscreen_exit: 'fullscreenExit',
      right_click: 'rightClick',
      devtools_open: 'devtoolsOpen',
      copy_paste: 'copyPaste',
      unusual_movement: 'unusualMovement',
      headphone_detected: 'headphoneDetected',
      low_light: 'lowLight',
      face_blur: 'faceBlur',
      extreme_gaze_angle: 'extremeGazeAngle',
      rapid_head_movement: 'rapidHeadMovement',
      background_change: 'backgroundChange',
    };
    return mapping[eventType];
  },

  /**
   * Get detailed session analysis
   */
  async getSessionAnalysis(sessionId) {
    const session = await Session.findById(sessionId)
      .populate('student', 'email firstName lastName')
      .populate('exam', 'title subject');

    if (!session) {
      throw new Error('Session not found');
    }

    const analysis = {
      sessionId: session._id,
      student: session.student,
      exam: session.exam,
      status: session.status,
      timeline: {
        started: session.startTime,
        ended: session.endTime,
        duration: session.duration,
      },
      riskAssessment: {
        score: session.riskScore,
        level: session.riskLevel,
        flagged: session.flagged,
        reason: session.flagReason,
      },
      eventSummary: {
        total: session.totalEvents,
        byType: session.eventCounts,
      },
      malpracticeIndicators: session.malpracticeIndicators || [],
      evidence: {
        snapshotsCount: session.snapshots.length,
        snapshots: session.snapshots,
        videoUrl: session.videoUrl,
      },
      adminReview: session.adminReview,
      performance: {
        score: session.score,
        answers: session.answers,
        performanceMetrics: session.performanceMetrics,
      },
    };

    return analysis;
  },

  /**
   * Get sessions needing review
   */
  async getSessionsNeedingReview(limit = 20) {
    return await Session.find({
      flagged: true,
      'adminReview.reviewed': false,
    })
      .populate('student', 'email firstName lastName')
      .populate('exam', 'title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  /**
   * Get high-risk sessions
   */
  async getHighRiskSessions(exam = null, limit = 50) {
    const query = {
      riskLevel: { $in: ['high', 'critical'] },
    };

    if (exam) {
      query.exam = exam;
    }

    return await Session.find(query)
      .populate('student', 'email firstName lastName')
      .populate('exam', 'title')
      .sort({ riskScore: -1 })
      .limit(limit)
      .lean();
  },
};
