import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../../../services/api';

export default function EnterCourseCodePage() {
  const navigate = useNavigate();
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseCode.trim()) {
      setError('Please enter a course code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all exams and find one with matching course code
      console.log('🔍 Looking for exam with course code:', courseCode.toUpperCase());
      const response = await examAPI.getExams();
      const exams = response.data.exams || [];
      
      const matchingExam = exams.find((e: any) => 
        e.courseCode?.toUpperCase() === courseCode.toUpperCase() ||
        e.code?.toUpperCase() === courseCode.toUpperCase()
      );

      if (!matchingExam) {
        setError(`No exam found with course code "${courseCode.toUpperCase()}"`);
        setLoading(false);
        return;
      }

      console.log('✅ Found exam:', {
        id: matchingExam._id,
        title: matchingExam.title,
        courseCode: matchingExam.courseCode,
      });

      // Store exam data in sessionStorage
      sessionStorage.setItem(
        'examSession',
        JSON.stringify({
          exam: {
            examId: matchingExam._id,
            examTitle: matchingExam.title,
            courseCode: matchingExam.courseCode,
            date: matchingExam.date,
            startTime: matchingExam.startTime,
            duration: matchingExam.duration,
            totalMarks: matchingExam.totalMarks,
            totalQuestions: matchingExam.totalQuestions,
          },
          joinedAt: Date.now(),
        })
      );

      // Navigate to rules page
      navigate('/exam/rules');
    } catch (err: any) {
      console.error('Error fetching exam:', err);
      setError(err.response?.data?.error || 'Failed to find exam. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] py-10 px-6">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Login', 'System Check', 'Course Code', 'Rules', 'Exam'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${i === 2 ? 'bg-teal-500 text-white' : i < 2 ? 'bg-teal-500/40 text-teal-400' : 'border border-[#2d3139] text-[#4b5563]'}`}>{i < 2 ? <i className="ri-check-line text-xs" /> : i + 1}</div>
              {i < 4 && <div className={`w-8 h-px ${i < 2 ? 'bg-teal-500/50' : 'bg-[#1e2330]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#111318] border border-[#1e2330] rounded-2xl overflow-hidden">
          <div className="bg-teal-500/10 border-b border-teal-500/20 px-7 py-5 flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-teal-500/15 flex-shrink-0">
              <i className="ri-key-line text-teal-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Enter Course Code</h1>
              <p className="text-teal-400/80 text-sm">Access your exam</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-7">
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-xl p-5 mb-6">
              <p className="text-[#6b7280] text-sm mb-2">
                Your instructor provided you with a course code. Enter it below to access your exam.
              </p>
              <div className="text-sm text-teal-400 mt-3 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <i className="ri-lightbulb-line mr-2" />
                Example: <span className="font-mono font-semibold">CS401</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white font-semibold text-sm mb-3">
                Course Code
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Enter course code (e.g., CS401)"
                className="w-full bg-[#0a0c10] border border-[#1e2330] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 uppercase"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <i className="ri-error-warning-line text-red-400 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !courseCode.trim()}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                loading || !courseCode.trim()
                  ? 'bg-[#1a1d24] text-[#4b5563] cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Finding exam...
                </>
              ) : (
                <>
                  <i className="ri-search-line" />
                  Find My Exam
                </>
              )}
            </button>

            <p className="text-[#4b5563] text-xs text-center mt-4">
              Don't have a course code? Contact your instructor.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
