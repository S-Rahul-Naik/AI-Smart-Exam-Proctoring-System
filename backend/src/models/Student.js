import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    faceEmbedding: {
      type: Buffer,
      select: false,
    },
    faceImageUrl: {
      type: String,
      default: null,
    },
    faceImagePublicId: {
      type: String,
      default: null,
    },
    // Enrollment photos for identity verification
    signupPhotoUrl: {
      type: String,
      default: null,
    },
    loginPhotoUrl: {
      type: String,
      default: null,
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    enrollmentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    usn: {
      type: String,
      unique: true,
      sparse: true,
      required: true,
      trim: true,
      uppercase: true,
    },
    program: {
      type: String,
      trim: true,
      default: null,
    },
    year: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },
    exams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
      },
    ],
    sessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
      },
    ],
  },
  { timestamps: true }
);

// Hash password before save
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Student', studentSchema);
