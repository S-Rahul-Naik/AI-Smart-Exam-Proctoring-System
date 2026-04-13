import express from 'express';
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  publishExam,
  deleteExam,
} from '../controllers/examController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'superadmin'), createExam);
router.get('/', authenticate, getExams);
router.get('/:id', authenticate, getExamById);
router.put('/:id', authenticate, authorize('admin', 'superadmin'), updateExam);
router.patch('/:id/publish', authenticate, authorize('admin', 'superadmin'), publishExam);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteExam);

export default router;
