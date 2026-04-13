import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    type: {
      type: String,
      enum: ['risk_threshold', 'behavior_anomaly', 'system_error', 'manual_flag'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    message: String,
    riskScore: Number,
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    acknowledgedAt: Date,
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Alert', alertSchema);
