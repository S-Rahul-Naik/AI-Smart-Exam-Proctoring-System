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
router.get('/exams/:examId/questions', getExamQuestions);

// Get question statistics
router.get('/exams/:examId/questions/stats', getQuestionStats);

// Create a new question
router.post('/exams/:examId/questions', createQuestion);

// Bulk add questions
router.post('/exams/:examId/questions/bulk', bulkAddQuestions);

// Update a question
router.put('/exams/:examId/questions/:questionId', updateQuestion);

// Delete a question
router.delete('/exams/:examId/questions/:questionId', deleteQuestion);

// Reorder questions
router.post('/exams/:examId/questions/reorder', reorderQuestions);

export default router;
