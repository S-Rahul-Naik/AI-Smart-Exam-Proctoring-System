import Exam from '../models/Exam.js';
import Session from '../models/Session.js';

export const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      code,
      duration,
      totalQuestions,
      totalMarks,
      passingMarks,
      startTime,
      endTime,
      instructions,
      allowedStudents,
    } = req.body;

    const exam = new Exam({
      title,
      description,
      subject,
      code: code.toUpperCase(),
      duration,
      totalQuestions,
      totalMarks,
      passingMarks,
      startTime,
      endTime,
      instructions,
      allowedStudents,
      createdBy: req.user.id,
    });

    await exam.save();
    res.status(201).json({ message: 'Exam created', exam });
  } catch (error) {
    next(error);
  }
};

export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find().populate('createdBy', 'firstName lastName email');
    res.json({ exams });
  } catch (error) {
    next(error);
  }
};

export const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy')
      .populate('sessions')
      .populate('allowedStudents');

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ exam });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ message: 'Exam updated', exam });
  } catch (error) {
    next(error);
  }
};

export const publishExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { status: 'published' },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ message: 'Exam published', exam });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ message: 'Exam deleted' });
  } catch (error) {
    next(error);
  }
};
