import Exam from '../models/Exam.js';
import Session from '../models/Session.js';

export const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      code,
      courseCode,
      duration,
      totalQuestions,
      totalMarks,
      passingMarks,
      startTime,
      endTime,
      instructions,
      allowedStudents,
      date,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Exam title is required' });
    }

    const examCode = (code || courseCode || '').toUpperCase();
    if (!examCode) {
      return res.status(400).json({ error: 'Course code is required' });
    }

    if (!duration || duration < 1) {
      return res.status(400).json({ error: 'Valid duration is required' });
    }

    const exam = new Exam({
      title: title.trim(),
      description: description || '',
      subject: subject || '',
      code: examCode,
      courseCode: examCode,
      duration: parseInt(duration, 10),
      totalQuestions: totalQuestions || 0,
      totalMarks: totalMarks || 100,
      passingMarks: passingMarks || 40,
      startTime: startTime || '',
      endTime: endTime || '',
      date: date || '',
      instructions: instructions || '',
      allowedStudents: allowedStudents || [],
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
