import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== STUDENT API ====================
export const studentAPI = {
  register: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  }) => apiClient.post('/students/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/students/login', data),

  getProfile: () => apiClient.get('/students/profile'),

  updateProfile: (data: { firstName: string; lastName: string }) =>
    apiClient.put('/students/profile', data),

  verifyFace: (faceData: ArrayBuffer, photoType: string = 'signup') =>
    apiClient.post('/students/verify-face', { faceData, photoType }),

  // Store enrollment photos in MongoDB
  saveEnrollmentPhotoSignup: (faceImageUrl: string) =>
    apiClient.post('/students/enrollment-photos/signup', { faceImageUrl }),

  saveEnrollmentPhotoLogin: (faceImageUrl: string) =>
    apiClient.post('/students/enrollment-photos/login', { faceImageUrl }),

  // Retrieve enrollment photos from MongoDB
  getEnrollmentPhotos: () =>
    apiClient.get('/students/enrollment-photos'),

  // Exam identity verification - continuous face matching during exam
  matchFaceForExam: (data: {
    livePhoto: string; // base64 encoded jpeg
    enrollmentPhotoUrl: string; // URL string
    photoType?: string;
  }) => apiClient.post('/students/match-face-exam', data),

  // Exam start verification - mandatory face capture at exam start
  comparePhotoForExam: (data: { capturedFrame: string }) =>
    apiClient.post('/students/compare-photo-exam', data),
};

// ==================== EXAM API ====================
export const examAPI = {
  createExam: (data: {
    title: string;
    description: string;
    subject: string;
    code: string;
    duration: number;
    totalQuestions: number;
    totalMarks: number;
    passingMarks: number;
    startTime: string;
    endTime: string;
    instructions?: string;
    allowedStudents?: string[];
  }) => apiClient.post('/exams', data),

  getExams: () => apiClient.get('/exams'),

  getExamById: (id: string) => apiClient.get(`/exams/${id}`),

  updateExam: (id: string, data: any) =>
    apiClient.put(`/exams/${id}`, data),

  publishExam: (id: string) =>
    apiClient.patch(`/exams/${id}/publish`, {}),

  deleteExam: (id: string) =>
    apiClient.delete(`/exams/${id}`),
};

// ==================== SESSION API ====================
export const sessionAPI = {
  initializeSession: (examId: string) =>
    apiClient.post('/sessions/initialize', { examId }),

  startSession: (sessionId: string) =>
    apiClient.post(`/sessions/${sessionId}/start`, {}),

  submitSession: (sessionId: string, answers: Record<number, number>) =>
    apiClient.post(`/sessions/${sessionId}/submit`, { sessionId, answers }),

  recordEvents: (
    sessionId: string,
    events: Array<{
      type: string;
      timestamp: number;
      weight: number;
      label: string;
      gazeDir?: string;
    }>
  ) => apiClient.post(`/sessions/${sessionId}/events`, { sessionId, events }),

  uploadSnapshot: (
    sessionId: string,
    file: File,
    eventType: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventType', eventType);
    // CRITICAL: Set Content-Type to undefined to override the default 'application/json'
    // This allows axios to auto-detect FormData and set proper multipart boundary
    return apiClient.post(`/sessions/${sessionId}/snapshot`, formData, {
      headers: {
        'Content-Type': undefined
      }
    });
  },

  getSessionDetails: (sessionId: string) =>
    apiClient.get(`/sessions/${sessionId}`),

  reviewSession: (
    sessionId: string,
    data: { decision: string; notes: string }
  ) => apiClient.post(`/sessions/${sessionId}/review`, data),
};

// ==================== ALERT API ====================
export const alertAPI = {
  createAlert: (data: {
    sessionId: string;
    type: string;
    severity: string;
    message: string;
    riskScore: number;
  }) => apiClient.post('/alerts', data),

  getAlerts: (filters?: {
    examId?: string;
    studentId?: string;
    resolved?: boolean;
  }) => apiClient.get('/alerts', { params: filters }),

  acknowledgeAlert: (alertId: string) =>
    apiClient.patch(`/alerts/${alertId}/acknowledge`, {}),

  resolveAlert: (alertId: string) =>
    apiClient.patch(`/alerts/${alertId}/resolve`, {}),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/admins/login', data),

  getAdminProfile: () => apiClient.get('/admins/profile'),

  getActiveSessions: () => apiClient.get('/admin/sessions/active'),

  getHighRiskAlerts: () =>
    apiClient.get('/alerts', { params: { severity: 'high', resolved: false } }),

  getAnalyticsData: (examId: string) =>
    apiClient.get(`/admin/analytics/${examId}`),

  // Session analysis and review
  getSessionAnalysis: (sessionId: string) =>
    apiClient.get(`/sessions/${sessionId}/analysis`),

  getMalpracticeReport: (sessionId: string) =>
    apiClient.get(`/sessions/${sessionId}/malpractice-report`),

  getHighRiskSessions: (examId?: string, limit?: number) =>
    apiClient.get('/sessions/admin/high-risk', {
      params: { examId, limit },
    }),

  getSessionsNeedingReview: (limit: number = 20) =>
    apiClient.get('/sessions/admin/needs-review', { params: { limit } }),

  flagSessionForReview: (
    sessionId: string,
    data: { reason: string; severity: string; notes: string }
  ) => apiClient.post(`/sessions/${sessionId}/flag`, data),

  reviewSession: (
    sessionId: string,
    data: { decision: string; notes: string }
  ) => apiClient.post(`/sessions/${sessionId}/review`, data),
};

export default apiClient;
