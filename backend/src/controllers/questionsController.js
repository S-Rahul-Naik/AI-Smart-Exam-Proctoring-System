import Question from '../models/Question.js';
import Exam from '../models/Exam.js';

// Get all questions for an exam
export const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId || examId.trim() === '') {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const questions = await Question.find({ exam: examId })
      .sort({ number: 1 })
      .lean();

    res.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Create a new question
export const createQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const { question, type, marks, options, difficulty, explanation, tags, description } = req.body;

    if (!examId || examId.trim() === '') {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    // Validate exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get the next question number (robust against bad/legacy values)
    const maxNumberDoc = await Question.find({ exam: examId })
      .sort({ number: -1 })
      .select('number')
      .limit(1)
      .lean();
    const currentMaxNumber = Number(maxNumberDoc?.[0]?.number || 0);
    let nextNumber = currentMaxNumber + 1;

    // Validate question data
    if (!question || !type || !marks) {
      return res.status(400).json({ error: 'Missing required fields: question, type, marks' });
    }

    if (type === 'mcq' && (!options || options.length < 2)) {
      return res.status(400).json({ error: 'MCQ must have at least 2 options' });
    }

    if (type === 'true-false') {
      if (!options || options.length < 2) {
        return res.status(400).json({ error: 'True/False must include True and False options' });
      }
      const tfCorrectCount = options.filter(opt => opt?.isCorrect).length;
      if (tfCorrectCount !== 1) {
        return res.status(400).json({ error: 'True/False must have exactly one correct answer' });
      }
    }

    let normalizedOptions = undefined;
    let correctAnswer = undefined;

    if (type === 'mcq') {
      normalizedOptions = options;
    }

    if (type === 'true-false') {
      normalizedOptions = options;
      const correctOption = options.find(opt => opt?.isCorrect);
      correctAnswer = correctOption?.text ? String(correctOption.text).toLowerCase() : undefined;
    }

    let newQuestion;
    try {
      newQuestion = new Question({
        exam: examId,
        number: nextNumber,
        question,
        type,
        marks,
        options: normalizedOptions,
        correctAnswer,
        difficulty: difficulty || 'medium',
        explanation,
        tags: tags || [],
        description,
        createdBy: req.admin?._id,
      });

      await newQuestion.save();
    } catch (saveError) {
      // Handle race on unique index (exam + number) by retrying once with fresh number
      if (saveError?.code === 11000) {
        const retryMaxDoc = await Question.find({ exam: examId })
          .sort({ number: -1 })
          .select('number')
          .limit(1)
          .lean();
        nextNumber = Number(retryMaxDoc?.[0]?.number || 0) + 1;

        newQuestion = new Question({
          exam: examId,
          number: nextNumber,
          question,
          type,
          marks,
          options: normalizedOptions,
          correctAnswer,
          difficulty: difficulty || 'medium',
          explanation,
          tags: tags || [],
          description,
          createdBy: req.admin?._id,
        });

        await newQuestion.save();
      } else {
        throw saveError;
      }
    }

    // Update exam's totalQuestions if not already set correctly
    const questionCount = await Question.countDocuments({ exam: examId });
    if (exam.totalQuestions < questionCount) {
      exam.totalQuestions = questionCount;
      await exam.save();
    }

    res.status(201).json({ question: newQuestion, message: 'Question created successfully' });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// Update a question
export const updateQuestion = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.exam;
    delete updates.number;
    delete updates.createdBy;

    if (updates.type === 'true-false' || (updates.options && updates.type !== 'mcq')) {
      const tfOptions = updates.options || [];
      if (tfOptions.length < 2) {
        return res.status(400).json({ error: 'True/False must include True and False options' });
      }
      const tfCorrectCount = tfOptions.filter(opt => opt?.isCorrect).length;
      if (tfCorrectCount !== 1) {
        return res.status(400).json({ error: 'True/False must have exactly one correct answer' });
      }
      const correctOption = tfOptions.find(opt => opt?.isCorrect);
      updates.correctAnswer = correctOption?.text ? String(correctOption.text).toLowerCase() : undefined;
      updates.options = tfOptions;
    }

    if (updates.type === 'mcq' && updates.options) {
      updates.correctAnswer = undefined;
    }

    const question = await Question.findOneAndUpdate(
      { _id: questionId, exam: examId },
      { ...updates, updatedBy: req.admin?._id },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ question, message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
  try {
    const { examId, questionId } = req.params;

    const question = await Question.findOneAndDelete({
      _id: questionId,
      exam: examId,
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Renumber remaining questions
    const remainingQuestions = await Question.find({ exam: examId }).sort({ number: 1 });
    for (let i = 0; i < remainingQuestions.length; i++) {
      remainingQuestions[i].number = i + 1;
      await remainingQuestions[i].save();
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// Bulk add questions
export const bulkAddQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions array' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const lastQuestion = await Question.findOne({ exam: examId })
      .sort({ number: -1 })
      .select('number');
    let nextNumber = (lastQuestion?.number || 0) + 1;

    const createdQuestions = [];
    for (const q of questions) {
      const newQuestion = new Question({
        exam: examId,
        number: nextNumber++,
        ...q,
        createdBy: req.admin?._id,
      });
      await newQuestion.save();
      createdQuestions.push(newQuestion);
    }

    // Update exam total questions
    const totalCount = await Question.countDocuments({ exam: examId });
    exam.totalQuestions = totalCount;
    await exam.save();

    res.status(201).json({ 
      questions: createdQuestions, 
      message: `${createdQuestions.length} questions added successfully` 
    });
  } catch (error) {
    console.error('Error bulk adding questions:', error);
    res.status(500).json({ error: 'Failed to add questions' });
  }
};

// Reorder questions
export const reorderQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ error: 'Invalid question IDs array' });
    }

    // Update question numbers based on new order
    for (let i = 0; i < questionIds.length; i++) {
      await Question.findByIdAndUpdate(
        questionIds[i],
        { number: i + 1 },
        { runValidators: true }
      );
    }

    res.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
};

// Get question statistics for an exam
export const getQuestionStats = async (req, res) => {
  try {
    const { examId } = req.params;

    const stats = await Question.aggregate([
      { $match: { exam: mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          totalMarks: { $sum: '$marks' },
          byType: {
            $push: {
              type: '$type',
              count: { $sum: 1 },
            },
          },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: { $sum: 1 },
            },
          },
        },
      },
    ]);

    res.json({ stats: stats[0] || { totalQuestions: 0, totalMarks: 0 } });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
