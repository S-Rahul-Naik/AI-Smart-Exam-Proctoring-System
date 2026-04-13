import Alert from '../models/Alert.js';
import Session from '../models/Session.js';

export const createAlert = async (req, res, next) => {
  try {
    const { sessionId, type, severity, message, riskScore } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const alert = new Alert({
      session: sessionId,
      student: session.student,
      exam: session.exam,
      type,
      severity,
      message,
      riskScore,
    });

    await alert.save();

    res.status(201).json({ message: 'Alert created', alert });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const { examId, studentId, resolved } = req.query;
    const filter = {};

    if (examId) filter.exam = examId;
    if (studentId) filter.student = studentId;
    if (resolved !== undefined) filter.resolved = resolved === 'true';

    const alerts = await Alert.find(filter)
      .populate('session')
      .populate('student', 'firstName lastName email')
      .populate('exam', 'title')
      .sort({ createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        acknowledged: true,
        acknowledgedBy: req.user.id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert resolved', alert });
  } catch (error) {
    next(error);
  }
};
