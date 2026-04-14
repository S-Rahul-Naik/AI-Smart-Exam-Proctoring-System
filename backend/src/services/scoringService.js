import Question from '../models/Question.js';
import Exam from '../models/Exam.js';

/**
 * Scoring Service
 * Handles exam score calculation based on student answers
 */
class ScoringService {
  /**
   * Calculate exam score based on submitted answers
   * @param {string} examId - The exam ID
   * @param {Map} answers - Map of questionId to student's answer
   * @returns {Promise<{score: number, percentage: number, breakdown: object}>}
   */
  async calculateExamScore(examId, answers) {
    try {
      if (!answers || answers.size === 0) {
        return { score: 0, percentage: 0, breakdown: {}, totalMarks: 0, obtainedMarks: 0 };
      }

      // Fetch all questions for this exam
      const questions = await Question.find({ exam: examId });

      if (questions.length === 0) {
        return { score: 0, percentage: 0, breakdown: {}, totalMarks: 0, obtainedMarks: 0 };
      }

      let totalMarks = 0;
      let obtainedMarks = 0;
      const breakdown = {};

      // Process each question
      for (const question of questions) {
        const questionId = question._id.toString();
        const studentAnswer = answers.get ? answers.get(questionId) : answers[questionId];

        totalMarks += question.marks;
        breakdown[questionId] = {
          questionNumber: question.number,
          marks: question.marks,
          type: question.type,
          studentAnswer,
          isCorrect: false,
          marksObtained: 0,
        };

        // Check if answer is correct based on question type
        let isCorrect = false;

        if (question.type === 'mcq') {
          // For MCQ, check if the selected option is marked as correct
          if (studentAnswer && question.options) {
            const correctOption = question.options.find(
              opt => opt.id === studentAnswer && opt.isCorrect
            );
            isCorrect = !!correctOption;
          }
        } else if (question.type === 'true-false') {
          // For true/false, compare directly
          isCorrect =
            studentAnswer &&
            studentAnswer.toLowerCase() === question.correctAnswer?.toLowerCase();
        } else if (question.type === 'short-answer' || question.type === 'essay') {
          // For essay/short-answer, mark as correct if answered (admin will manually review)
          // In a real system, you'd use AI or keyword matching
          isCorrect = !!studentAnswer && studentAnswer.trim().length > 0;
        }

        if (isCorrect) {
          obtainedMarks += question.marks;
          breakdown[questionId].isCorrect = true;
          breakdown[questionId].marksObtained = question.marks;
        }
      }

      // Calculate percentage
      const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

      console.log(`✅ Score Calculation:`, {
        totalMarks,
        obtainedMarks,
        percentage: `${percentage}%`,
      });

      return {
        score: obtainedMarks,
        percentage,
        breakdown,
        totalMarks,
        obtainedMarks,
      };
    } catch (error) {
      console.error('❌ Error calculating exam score:', error);
      throw error;
    }
  }

  /**
   * Get passing score for an exam
   * @param {string} examId - The exam ID
   * @returns {Promise<object>}
   */
  async getExamPassingCriteria(examId) {
    try {
      const exam = await Exam.findById(examId);

      if (!exam) {
        return { passingMarks: 40, totalMarks: 100, passingPercentage: 40 };
      }

      return {
        passingMarks: exam.passingMarks || 40,
        totalMarks: exam.totalMarks || 100,
        passingPercentage: exam.passingPercentage || 40,
      };
    } catch (error) {
      console.error('❌ Error getting exam criteria:', error);
      throw error;
    }
  }

  /**
   * Determine if student passed
   * @param {number} percentage - Student's percentage score
   * @param {number} passingPercentage - Passing percentage threshold
   * @returns {boolean}
   */
  determinePassed(percentage, passingPercentage = 40) {
    return percentage >= passingPercentage;
  }

  /**
   * Get performance grade based on percentage
   * @param {number} percentage - Score percentage
   * @returns {string}
   */
  getGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E';
    return 'F';
  }

  /**
   * Get detailed score report
   * @param {object} scoreData - Score calculation result
   * @returns {object}
   */
  generateScoreReport(scoreData, riskScoreData = {}) {
    return {
      examScore: {
        obtained: scoreData.obtainedMarks,
        total: scoreData.totalMarks,
        percentage: scoreData.percentage,
        grade: this.getGrade(scoreData.percentage),
      },
      riskScore: {
        score: riskScoreData.riskScore ?? 0,
        level: riskScoreData.riskLevel ?? 'low',
      },
      breakdown: scoreData.breakdown,
    };
  }
}

export default new ScoringService();
