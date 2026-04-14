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

const router = express.Router({ mergeParams: true });

// Get all questions for an exam
router.get('/:examId/questions', getExamQuestions);

// Get question statistics
router.get('/:examId/questions/stats', getQuestionStats);

// Create a new question
router.post('/:examId/questions', createQuestion);

// Bulk add questions
router.post('/:examId/questions/bulk', bulkAddQuestions);

// Update a question
router.put('/:examId/questions/:questionId', updateQuestion);

// Delete a question
router.delete('/:examId/questions/:questionId', deleteQuestion);

// Reorder questions
router.post('/:examId/questions/reorder', reorderQuestions);

export default router;
