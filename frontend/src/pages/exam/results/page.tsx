import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { sessionAPI } from '../../../services/api';

export default function ExamResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get sessionId from sessionStorage or URL params
        const sessionId = sessionStorage.getItem('sessionId') || searchParams.get('sessionId');
        if (sessionId) {
          const response = await sessionAPI.getSessionDetails(sessionId);
          setSession(response);
        }
      } catch (error) {
        console.error('Failed to fetch session data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [searchParams]);

  const isAutoSubmitted = session?.autoSubmit === true;
  const autoSubmitReason = session?.autoSubmitReason;

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] py-10">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="w-full max-w-lg px-6 text-center">
        <div className={`border rounded-2xl p-8 ${isAutoSubmitted ? 'bg-[#111318] border-amber-500/30' : 'bg-[#111318] border-[#1e2330]'}`}>
          <div className={`w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4 ${isAutoSubmitted ? 'bg-amber-500/15' : 'bg-teal-500/15'}`}>
            <i className={`text-4xl ${isAutoSubmitted ? 'ri-alert-line text-amber-400' : 'ri-checkbox-circle-fill text-teal-400'}`} />
          </div>
          <h1 className="text-white font-black text-2xl mb-2">
            {isAutoSubmitted ? 'Exam Auto-Submitted' : 'Exam Submitted'}
          </h1>
          <p className="text-[#6b7280] text-sm mb-8">
            {isAutoSubmitted 
              ? 'Your session was automatically submitted due to a verification failure.' 
              : 'Your session has been recorded and is under admin review'}
          </p>

          {/* Auto-submit reason alert */}
          {isAutoSubmitted && autoSubmitReason && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <i className="ri-alert-line text-amber-400 text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-1">Auto-Submit Reason</div>
                  <p className="text-[#9ca3af] text-sm">
                    {autoSubmitReason === 'face_verification_failed' && 'Identity verification could not be completed after 3 attempts. Your exam has been submitted automatically.'}
                    {autoSubmitReason === 'face_mismatch_detected' && 'The face detected does not match your enrollment photo.'}
                    {autoSubmitReason === 'no_face_detected' && 'Your face could not be detected during verification.'}
                    {autoSubmitReason === 'multiple_people_detected' && 'Multiple people were detected during verification.'}
                    {autoSubmitReason === 'identity_confidence_low' && 'Identity confidence was too low to proceed.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="text-3xl font-black text-emerald-400 mb-1">82%</div>
              <div className="text-[#6b7280] text-xs">Exam Score</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="text-3xl font-black text-amber-400 mb-1">
                {session?.riskScore ? Math.round(session.riskScore) : 45}
              </div>
              <div className="text-[#6b7280] text-xs">Risk Score</div>
            </div>
          </div>

          <div className="bg-[#0a0c10] border border-[#1e2330] rounded-xl p-4 mb-6 text-left space-y-2">
            {[
              { label: 'Exam', val: session?.exam?.title || 'Advanced Algorithms & Data Structures' },
              { label: 'Duration', val: session?.duration ? `${Math.floor(session.duration / 60)}m` : '3h 00m' },
              { label: 'Status', val: isAutoSubmitted ? 'Auto-Submitted' : 'Pending Admin Review' },
              ...(session?.autoSubmitTimestamp ? [{
                label: 'Auto-Submitted At',
                val: new Date(session.autoSubmitTimestamp).toLocaleString()
              }] : []),
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">{r.label}</span>
                <span className="text-white font-medium">{r.val}</span>
              </div>
            ))}
          </div>

          <div className={`rounded-xl p-4 mb-6 text-left flex items-start gap-2 text-xs ${isAutoSubmitted ? 'bg-amber-500/5 border border-amber-500/15' : 'bg-teal-500/5 border border-teal-500/15'}`}>
            <i className={`mt-0.5 flex-shrink-0 ${isAutoSubmitted ? 'ri-alert-line text-amber-400' : 'ri-mail-line text-teal-400'}`} />
            <span className={isAutoSubmitted ? 'text-amber-400/80' : 'text-teal-400/80'}>
              {isAutoSubmitted 
                ? 'Your exam was auto-submitted. An administrator will review your session and notify you of the outcome.' 
                : 'You will receive an email notification once the admin reviews and releases your results. This typically takes 24–48 hours.'}
            </span>
          </div>

          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-xl text-sm cursor-pointer whitespace-nowrap transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
