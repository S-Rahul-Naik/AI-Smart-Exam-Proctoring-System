import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeExamToken, getDemoToken } from '../../../utils/examToken';
import type { ExamTokenPayload } from '../../../utils/examToken';

interface StudentForm {
  fullName: string;
  studentId: string;
  email: string;
  program: string;
  agreed: boolean;
}

const PROGRAMS = [
  'Computer Science',
  'Data Science',
  'Artificial Intelligence & ML',
  'Software Engineering',
  'Cybersecurity',
  'Information Technology',
  'Other',
];

export default function ExamJoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamTokenPayload | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>({
    fullName: '',
    studentId: '',
    email: '',
    program: '',
    agreed: false,
  });
  const [errors, setErrors] = useState<Partial<StudentForm>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let token = searchParams.get('token');
    const examId = searchParams.get('exam');

    // If no token but exam id provided, use demo token for testing
    if (!token && examId) {
      token = getDemoToken(examId);
    }
    // If neither, use demo exam e001 token
    if (!token) {
      token = getDemoToken('e001');
    }

    const payload = decodeExamToken(token);
    if (!payload) {
      setTokenError('This exam link is invalid or has expired. Please contact your instructor for a new link.');
    } else {
      setExam(payload);
      if (payload.invitedEmail) {
        setForm(prev => ({ ...prev, email: payload.invitedEmail ?? '' }));
      }
    }
  }, [searchParams]);

  function validate(): boolean {
    const newErrors: Partial<StudentForm> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!form.program) newErrors.program = 'Please select your program';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !exam) return;
    setLoading(true);

    await new Promise(r => setTimeout(r, 1200));

    // Store student session data
    sessionStorage.setItem(
      'examSession',
      JSON.stringify({
        student: { fullName: form.fullName, studentId: form.studentId, email: form.email, program: form.program },
        exam,
        joinedAt: Date.now(),
      })
    );

    setSubmitted(true);
    setLoading(false);
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] p-6">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500/10 mx-auto mb-5">
            <i className="ri-link-unlink text-red-400 text-2xl" />
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Invalid Exam Link</h1>
          <p className="text-[#6b7280] text-sm leading-relaxed mb-6">{tokenError}</p>
          <a href="/login" className="inline-block bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  if (submitted && exam) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] p-6">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-teal-500/15 mx-auto mb-5">
            <i className="ri-checkbox-circle-fill text-teal-400 text-3xl" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-2">Registration Confirmed!</h1>
          <p className="text-[#6b7280] text-sm mb-1">
            Welcome, <span className="text-white font-semibold">{form.fullName}</span>
          </p>
          <p className="text-[#4b5563] text-xs mb-6">You&apos;re registered for <span className="text-teal-400">{exam.examTitle}</span></p>
          <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-4 text-left mb-6">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#4b5563]">Exam Date</span>
                <div className="text-white font-medium mt-0.5">{exam.date}</div>
              </div>
              <div>
                <span className="text-[#4b5563]">Start Time</span>
                <div className="text-white font-medium mt-0.5">{exam.startTime}</div>
              </div>
              <div>
                <span className="text-[#4b5563]">Duration</span>
                <div className="text-white font-medium mt-0.5">{exam.duration} minutes</div>
              </div>
              <div>
                <span className="text-[#4b5563]">Course Code</span>
                <div className="text-teal-400 font-medium mt-0.5">{exam.courseCode}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/exam/precheck')}
            className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            Begin System Check →
          </button>
          <p className="text-[#4b5563] text-xs mt-3">
            You will be asked to verify your identity and camera before the exam starts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] py-10 px-6">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="w-full max-w-lg">
        {/* Header */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 mb-8 text-left cursor-pointer"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-500/10">
            <i className="ri-shield-check-fill text-teal-400 text-lg" />
          </div>
          <span className="text-white font-bold text-lg">ProctorAI</span>
        </button>

        {/* Exam info banner */}
        {exam && (
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-teal-400 text-xs font-bold bg-teal-500/10 px-2 py-0.5 rounded-full">
                    {exam.courseCode}
                  </span>
                  <span className="text-[#4b5563] text-xs">Secure Exam Invite</span>
                </div>
                <h2 className="text-white font-bold text-base">{exam.examTitle}</h2>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-500/10 flex-shrink-0">
                <i className="ri-file-list-3-line text-teal-400" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                <i className="ri-calendar-line text-teal-400/70" />
                {exam.date}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                <i className="ri-time-line text-teal-400/70" />
                {exam.startTime}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                <i className="ri-timer-line text-teal-400/70" />
                {exam.duration} min
              </div>
            </div>
          </div>
        )}

        {/* Registration form */}
        <div className="bg-[#111318] border border-[#1e2330] rounded-2xl p-7">
          <h1 className="text-white font-bold text-xl mb-1">Student Registration</h1>
          <p className="text-[#6b7280] text-sm mb-6">Complete your details to access this exam</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="As it appears on your student ID"
                className={`w-full bg-[#0a0c10] border ${errors.fullName ? 'border-red-500/50' : 'border-[#2d3139]'} rounded-xl px-4 py-3 text-white text-sm placeholder-[#4b5563] outline-none focus:border-teal-500/50 transition-colors`}
              />
              {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">Student ID *</label>
              <input
                type="text"
                value={form.studentId}
                onChange={e => setForm(prev => ({ ...prev, studentId: e.target.value }))}
                placeholder="e.g. STU-2024-001"
                className={`w-full bg-[#0a0c10] border ${errors.studentId ? 'border-red-500/50' : 'border-[#2d3139]'} rounded-xl px-4 py-3 text-white text-sm placeholder-[#4b5563] outline-none focus:border-teal-500/50 transition-colors`}
              />
              {errors.studentId && <p className="text-red-400 text-xs mt-1">{errors.studentId}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@university.edu"
                className={`w-full bg-[#0a0c10] border ${errors.email ? 'border-red-500/50' : 'border-[#2d3139]'} rounded-xl px-4 py-3 text-white text-sm placeholder-[#4b5563] outline-none focus:border-teal-500/50 transition-colors`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Program */}
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">Program / Department *</label>
              <div className="relative">
                <select
                  value={form.program}
                  onChange={e => setForm(prev => ({ ...prev, program: e.target.value }))}
                  className={`w-full bg-[#0a0c10] border ${errors.program ? 'border-red-500/50' : 'border-[#2d3139]'} rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500/50 transition-colors appearance-none cursor-pointer ${form.program ? 'text-white' : 'text-[#4b5563]'}`}
                >
                  <option value="" disabled>Select your program</option>
                  {PROGRAMS.map(p => (
                    <option key={p} value={p} className="bg-[#111318] text-white">
                      {p}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-[#4b5563] pointer-events-none" />
              </div>
              {errors.program && <p className="text-red-400 text-xs mt-1">{errors.program}</p>}
            </div>

            {/* Consent checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(prev => ({ ...prev, agreed: !prev.agreed }))}
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    form.agreed ? 'bg-teal-500 border-teal-500' : 'border-[#4b5563] bg-transparent'
                  }`}
                >
                  {form.agreed && <i className="ri-check-line text-white text-xs" />}
                </div>
                <span className="text-[#6b7280] text-xs leading-relaxed">
                  I confirm that the information provided is accurate. I agree to be monitored by the AI proctoring
                  system during this exam and understand that violations will be recorded.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!form.agreed || loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                form.agreed && !loading
                  ? 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
                  : 'bg-[#1a1d24] text-[#4b5563] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying registration...
                </span>
              ) : (
                'Register & Access Exam →'
              )}
            </button>
          </form>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <i className="ri-lock-line text-[#4b5563] text-xs" />
          <span className="text-[#4b5563] text-xs">
            This link is unique to you. Do not share it.
          </span>
        </div>
      </div>
    </div>
  );
}
