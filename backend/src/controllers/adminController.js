import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Session from '../models/Session.js';
import Alert from '../models/Alert.js';
import jwt from 'jsonwebtoken';

// ===== ADMIN AUTHENTICATION =====

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email, status: 'active' });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    admin.loginAttempts = 0;
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your_secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    next(error);
  }
};

// ===== STUDENT MANAGEMENT =====

export const getStudents = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query).select('-password').lean();
    res.json({ count: students.length, students });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).select('-password').lean();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get student's sessions and alerts
    const sessions = await Session.find({ student: studentId }).lean();
    const alerts = await Alert.find({ student: studentId }).lean();

    res.json({
      student,
      sessionsCount: sessions.length,
      alertsCount: alerts.length,
      highRiskAlerts: alerts.filter(a => a.severity === 'high').length,
    });
  } catch (error) {
    next(error);
  }
};

// ===== SESSION MONITORING =====

export const getActiveSessions = async (req, res, next) => {
  try {
    const activeSessions = await Session.find({ status: { $in: ['initiated', 'in_progress', 'submitted'] } })
      .populate('student', 'email firstName lastName')
      .lean();

    const sessionsWithRisk = await Promise.all(
      activeSessions.map(async session => {
        const alerts = await Alert.find({ session: session._id }).lean();
        const highRiskCount = alerts.filter(a => a.severity === 'high').length;
        const avgRisk = alerts.length > 0 
          ? alerts.reduce((sum, a) => sum + (a.riskScore || 0), 0) / alerts.length 
          : 0;

        return {
          ...session,
          alertsCount: alerts.length,
          highRiskCount,
          avgRisk: Math.round(avgRisk),
        };
      })
    );

    res.json({
      count: sessionsWithRisk.length,
      sessions: sessionsWithRisk.sort((a, b) => b.avgRisk - a.avgRisk), // Sort by risk
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId)
      .populate('student', 'email firstName lastName')
      .lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const alerts = await Alert.find({ session: sessionId }).lean();
    const events = session.events || [];

    res.json({
      ...session,
      alerts,
      eventsCount: events.length,
      highRiskAlerts: alerts.filter(a => a.severity === 'high'),
    });
  } catch (error) {
    next(error);
  }
};

export const reviewSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { decision, notes } = req.body;

    if (!['approve', 'reject', 'pending'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewDecision: decision,
        reviewNotes: notes,
      },
      { new: true }
    );

    res.json({ message: 'Session reviewed', session });
  } catch (error) {
    next(error);
  }
};

// ===== ANALYTICS & REPORTS =====

export const getAnalyticsData = async (req, res, next) => {
  try {
    const { examId, startDate, endDate } = req.query;

    let sessionQuery = {};
    if (examId) {
      sessionQuery.exam = examId;
    }
    if (startDate || endDate) {
      sessionQuery.createdAt = {};
      if (startDate) sessionQuery.createdAt.$gte = new Date(startDate);
      if (endDate) sessionQuery.createdAt.$lte = new Date(endDate);
    }

    const totalSessions = await Session.countDocuments(sessionQuery);
    const completedSessions = await Session.countDocuments({
      ...sessionQuery,
      status: 'completed',
    });
    const totalStudents = await Student.countDocuments({ status: 'active' });

    let alertQuery = {};
    if (examId) {
      alertQuery.exam = examId;
    }

    const alertsByType = await Alert.aggregate([
      { $match: alertQuery },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const alertsBySeverity = await Alert.aggregate([
      { $match: alertQuery },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const avgRiskScore = await Alert.aggregate([
      { $match: alertQuery },
      { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } },
    ]);

    const sessionsWithHighRisk = await Session.countDocuments({
      ...sessionQuery,
      riskScore: { $gte: 70 },
    });

    res.json({
      summary: {
        totalSessions,
        completedSessions,
        totalStudents,
        sessionsWithHighRisk,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      },
      alerts: {
        byType: alertsByType,
        bySeverity: alertsBySeverity,
        avgRiskScore: avgRiskScore[0]?.avgRisk || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHighRiskAlerts = async (req, res, next) => {
  try {
    const { limit = 50, status = 'unresolved' } = req.query;

    const alerts = await Alert.find({
      severity: 'high',
      resolved: status === 'unresolved' ? false : true,
    })
      .populate('sessionId', 'studentId status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ count: alerts.length, alerts });
  } catch (error) {
    next(error);
  }
};

// ===== EXAM MANAGEMENT =====

export const getExams = async (req, res, next) => {
  try {
    const { status } = req.query;
    const Exam = require('../models/Exam.js').default;

    let query = {};
    if (status) {
      query.status = status;
    }

    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Add session count for each exam
    const examsWithCounts = await Promise.all(
      exams.map(async exam => {
        const sessionCount = await Session.countDocuments({ examId: exam._id });
        return { ...exam, sessionCount };
      })
    );

    res.json({ count: examsWithCounts.length, exams: examsWithCounts });
  } catch (error) {
    next(error);
  }
};

// ===== ALERTS MANAGEMENT =====

export const resolveAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        resolution,
      },
      { new: true }
    );

    res.json({ message: 'Alert resolved', alert });
  } catch (error) {
    next(error);
  }
};
