import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['mcq', 'true-false'],
      default: 'mcq',
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    description: String, // Additional context for the question
    marks: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    // MCQ specific fields
    options: [
      {
        id: String,
        text: String,
        isCorrect: Boolean,
      },
    ],
    // For true/false
    correctAnswer: String, // 'true' or 'false'
    
    // Metadata
    imageUrl: String, // For questions with images
    explanation: String, // Explanation for the correct answer
    tags: [String], // For categorizing questions
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

// Ensure question number is unique within an exam
questionSchema.index({ exam: 1, number: 1 }, { unique: true });

export default mongoose.model('Question', questionSchema);
