import express from 'express';
import {
  initializeSession,
  startSession,
  submitSession,
  recordEvent,
  uploadSnapshot,
  getSessionDetails,
  reviewSession,
  getSessionAnalysis,
  getHighRiskSessions,
  getSessionsNeedingReview,
  flagSessionForReview,
  getMalpracticeReport,
  verifyFaceBackground,
} from '../controllers/sessionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Student routes
router.post('/initialize', authenticate, initializeSession);
router.post('/:sessionId/start', authenticate, startSession);
router.post('/:sessionId/submit', authenticate, submitSession);
router.post('/:sessionId/events', authenticate, recordEvent);
router.post('/:sessionId/snapshot', authenticate, uploadSingle, uploadSnapshot);
router.post('/:sessionId/verify-face-bg', authenticate, verifyFaceBackground);
router.get('/:sessionId', authenticate, getSessionDetails);

// Admin routes
router.post('/:sessionId/review', authenticate, authorize('admin', 'reviewer', 'superadmin'), reviewSession);
router.post('/:sessionId/flag', authenticate, authorize('admin', 'reviewer', 'superadmin'), flagSessionForReview);
router.get('/:sessionId/analysis', authenticate, authorize('admin', 'reviewer', 'superadmin'), getSessionAnalysis);
router.get('/:sessionId/malpractice-report', authenticate, authorize('admin', 'reviewer', 'superadmin'), getMalpracticeReport);
router.get('/admin/high-risk', authenticate, authorize('admin', 'reviewer', 'superadmin'), getHighRiskSessions);
router.get('/admin/needs-review', authenticate, authorize('admin', 'reviewer', 'superadmin'), getSessionsNeedingReview);

export default router;
