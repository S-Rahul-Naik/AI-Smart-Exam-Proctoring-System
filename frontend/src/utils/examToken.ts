export interface ExamTokenPayload {
  examId: string;
  examTitle: string;
  courseCode: string;
  date: string;
  startTime: string;
  duration: number;
  invitedEmail?: string;
  issuedAt: number;
  expiresAt: number;
}

export function encodeExamToken(payload: ExamTokenPayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeExamToken(token: string): ExamTokenPayload | null {
  try {
    const json = decodeURIComponent(atob(token));
    const payload = JSON.parse(json) as ExamTokenPayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

const TWO_DAYS = 1000 * 60 * 60 * 48;

const DEMO_EXAM_DATA: Record<string, Omit<ExamTokenPayload, 'issuedAt' | 'expiresAt'>> = {
  e001: {
    examId: 'e001',
    examTitle: 'Advanced Algorithms & Data Structures',
    courseCode: 'CS401',
    date: '2026-03-24',
    startTime: '09:00',
    duration: 180,
  },
  e002: {
    examId: 'e002',
    examTitle: 'Machine Learning Fundamentals',
    courseCode: 'AI302',
    date: '2026-03-25',
    startTime: '14:00',
    duration: 120,
  },
  e003: {
    examId: 'e003',
    examTitle: 'Database Systems & SQL',
    courseCode: 'CS305',
    date: '2026-03-28',
    startTime: '10:00',
    duration: 150,
  },
};

export function getDemoToken(examId: string): string {
  const base = DEMO_EXAM_DATA[examId] ?? DEMO_EXAM_DATA['e001'];
  const payload: ExamTokenPayload = {
    ...base,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TWO_DAYS,
  };
  return encodeExamToken(payload);
}
