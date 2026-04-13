import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'reviewer'],
      default: 'admin',
    },
    permissions: [String],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  { timestamps: true }
);

// Hash password before save
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.default.genSalt(10);
  this.password = await bcrypt.default.hash(this.password, salt);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.default.compare(candidatePassword, this.password);
};

export default mongoose.model('Admin', adminSchema);
