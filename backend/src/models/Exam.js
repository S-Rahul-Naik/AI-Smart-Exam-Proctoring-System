import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '',
    },
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
    },
    courseCode: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 600,
    },
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    passingMarks: {
      type: Number,
      default: 40,
    },
    startTime: {
      type: String,
      default: '',
    },
    endTime: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    riskThresholds: {
      low: {
        type: Number,
        default: 35,
      },
      medium: {
        type: Number,
        default: 65,
      },
    },
    allowedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    sessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'active', 'completed', 'archived'],
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
