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
    },
    subject: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    instructions: {
      type: String,
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
