import express from 'express';
import {
  getExamQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
  reorderQuestions,
  getQuestionStats,
} from '../controllers/questionsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Get all questions for an exam
router.get('/:examId/questions', authenticate, getExamQuestions);

// Get question statistics
router.get('/:examId/questions/stats', authenticate, getQuestionStats);

// Create a new question
router.post('/:examId/questions', authenticate, authorize('admin', 'superadmin'), createQuestion);

// Bulk add questions
router.post('/:examId/questions/bulk', authenticate, authorize('admin', 'superadmin'), bulkAddQuestions);

// Update a question
router.put('/:examId/questions/:questionId', authenticate, authorize('admin', 'superadmin'), updateQuestion);

// Delete a question
router.delete('/:examId/questions/:questionId', authenticate, authorize('admin', 'superadmin'), deleteQuestion);

// Reorder questions
router.post('/:examId/questions/reorder', authenticate, authorize('admin', 'superadmin'), reorderQuestions);

export default router;
