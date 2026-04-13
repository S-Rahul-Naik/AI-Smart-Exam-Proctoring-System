import express from 'express';
import {
  loginAdmin,
  getAdminProfile,
  getStudents,
  getStudentById,
  getActiveSessions,
  getSessionById,
  reviewSession,
  getAnalyticsData,
  getHighRiskAlerts,
  getExams,
  resolveAlert,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ===== AUTHENTICATION =====
router.post('/login', loginAdmin);
router.get('/profile', authenticate, getAdminProfile);

// ===== STUDENT MANAGEMENT =====
router.get('/students', authenticate, getStudents);
router.get('/students/:studentId', authenticate, getStudentById);

// ===== SESSION MONITORING =====
router.get('/sessions/active', authenticate, getActiveSessions);
router.get('/sessions/:sessionId', authenticate, getSessionById);
router.post('/sessions/:sessionId/review', authenticate, reviewSession);

// ===== ALERTS =====
router.get('/alerts/high-risk', authenticate, getHighRiskAlerts);
router.patch('/alerts/:alertId/resolve', authenticate, resolveAlert);

// ===== ANALYTICS =====
router.get('/analytics', authenticate, getAnalyticsData);

// ===== EXAMS =====
router.get('/exams', authenticate, getExams);

export default router;
