export const calculateRiskScore = (events) => {
  const now = Date.now();
  const TEMPORAL_WINDOW_MS = 30_000;
  const WEIGHTS = {
    face_absent: 3,
    gaze_deviation: 2,
    multiple_faces: 5,
    phone_detected: 5,
    tab_switch: 3,
    fullscreen_exit: 4,
  };

  const recent = events.filter(e => now - new Date(e.timestamp).getTime() < TEMPORAL_WINDOW_MS);
  const raw = recent.reduce((acc, e) => acc + (WEIGHTS[e.type] || 0), 0);

  return Math.min(100, Math.round(raw * 1.4));
};

export const getRiskLevel = (score) => {
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
};

export const generateSessionToken = (sessionId) => {
  return `session_${sessionId}_${Date.now()}`;
};

export const formatErrorResponse = (error, statusCode = 500) => {
  return {
    error: error.message || 'Internal server error',
    statusCode,
    timestamp: new Date(),
  };
};
