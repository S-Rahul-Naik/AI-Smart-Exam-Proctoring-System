import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExamTokenPayload } from '../../../utils/examToken';

const rules = [
  { icon: 'ri-eye-line', text: 'Keep your eyes on the screen at all times during the exam.' },
  { icon: 'ri-user-face-line', text: 'Your face must remain clearly visible in the webcam at all times.' },
  { icon: 'ri-smartphone-line', text: 'No mobile phones or external devices are permitted.' },
  { icon: 'ri-group-line', text: 'Only one person may be present in the examination environment.' },
  { icon: 'ri-door-closed-line', text: 'You may not leave the camera frame during the exam.' },
  { icon: 'ri-book-close-line', text: 'No reference materials, books, or notes are permitted.' },
  { icon: 'ri-record-circle-line', text: 'Your session will be recorded and reviewed by an invigilator.' },
  { icon: 'ri-shield-check-line', text: 'AI monitoring is active throughout. All suspicious behavior is logged.' },
];

export default function ExamRulesPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [exam, setExam] = useState<ExamTokenPayload | null>(null);

  useEffect(() => {
    // Get exam data from sessionStorage
    const examSessionStr = sessionStorage.getItem('examSession');
    if (examSessionStr) {
      try {
        const examSession = JSON.parse(examSessionStr);
        setExam(examSession.exam);
      } catch (error) {
        console.error('Failed to parse exam session:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] py-10">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="w-full max-w-2xl px-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Login', 'System Check', 'Rules', 'Exam'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${i === 2 ? 'bg-teal-500 text-white' : i < 2 ? 'bg-teal-500/40 text-teal-400' : 'border border-[#2d3139] text-[#4b5563]'}`}>{i < 2 ? <i className="ri-check-line text-xs" /> : i + 1}</div>
              {i < 3 && <div className={`w-8 h-px ${i < 2 ? 'bg-teal-500/50' : 'bg-[#1e2330]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#111318] border border-[#1e2330] rounded-2xl overflow-hidden">
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-7 py-5 flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-500/15 flex-shrink-0">
              <i className="ri-file-shield-2-line text-amber-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Exam Rules & Monitoring Consent</h1>
              <p className="text-amber-400/80 text-sm">Please read carefully before proceeding</p>
            </div>
          </div>

          <div className="p-7">
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <i className="ri-information-line text-teal-400" />
                <span className="text-teal-400 text-sm font-semibold">{exam?.examTitle || 'Exam'} · {exam?.courseCode || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center"><div className="text-white font-bold">{exam?.startTime || '00:00'}</div><div className="text-[#4b5563]">Start Time</div></div>
                <div className="text-center"><div className="text-white font-bold">{exam?.duration || 0} mins</div><div className="text-[#4b5563]">Duration</div></div>
                <div className="text-center"><div className="text-white font-bold">100 pts</div><div className="text-[#4b5563]">Total Marks</div></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-6">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-[#0a0c10] border border-[#1e2330] rounded-xl">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a1d24] flex-shrink-0 mt-0.5">
                    <i className={`${rule.icon} text-[#6b7280] text-sm`} />
                  </div>
                  <p className="text-[#9ca3af] text-xs leading-relaxed">{rule.text}</p>
                </div>
              ))}
            </div>

            <div
              onClick={() => setAgreed(!agreed)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all mb-6 ${agreed ? 'bg-teal-500/10 border-teal-500/30' : 'bg-[#0a0c10] border-[#2d3139] hover:border-[#3d4149]'}`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${agreed ? 'bg-teal-500' : 'border border-[#4b5563]'}`}>
                {agreed && <i className="ri-check-line text-white text-xs" />}
              </div>
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                I have read and understood all exam rules. I consent to AI-powered monitoring of my session including webcam recording, behavioral analysis, and risk scoring. I understand that violations may affect my result.
              </p>
            </div>

            <button
              onClick={() => {
                const examIdToUse = exam?.examId || 'exam-001';
                sessionStorage.setItem('examId', examIdToUse);
                navigate(`/exam/monitoring?examId=${examIdToUse}`);
              }}
              disabled={!agreed}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${agreed ? 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer' : 'bg-[#1a1d24] text-[#4b5563] cursor-not-allowed'}`}
            >
              {agreed ? '🔒 Start Exam Now' : 'Please agree to continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
