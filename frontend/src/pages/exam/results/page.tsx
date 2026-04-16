import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { sessionAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

export default function ExamResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get sessionId from sessionStorage or URL params
        const sessionId = sessionStorage.getItem('sessionId') || searchParams.get('sessionId');
        if (sessionId) {
          const response = await sessionAPI.getSessionDetails(sessionId);
          console.log('Session data:', response);
          const sessionData = response?.data?.session || null;
          setSession(sessionData);
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
  const isFlaggedForMalpractice = session?.flagged === true;
  const autoSubmitReason = session?.autoSubmitReason;
  const flagReason = session?.flagReason;
  
  // Get scores from session data
  const examScoreObj = session?.examScore || {};
  const examMarksObtained =
    typeof examScoreObj.obtained === 'number'
      ? examScoreObj.obtained
      : typeof session?.score === 'number'
      ? session.score
      : 0;
  const examTotalMarks =
    typeof examScoreObj.total === 'number' && examScoreObj.total > 0
      ? examScoreObj.total
      : 100;
  const examPercentage =
    typeof examScoreObj.percentage === 'number'
      ? examScoreObj.percentage
      : examTotalMarks > 0
      ? Math.round((examMarksObtained / examTotalMarks) * 100)
      : 0;
  
  const riskScore = session?.riskScore ?? 0;
  const riskLevel = session?.riskLevel || 'low';

  const startMs = session?.startTime ? new Date(session.startTime).getTime() : 0;
  const endMs =
    (session?.endTime ? new Date(session.endTime).getTime() : 0) ||
    (session?.autoSubmitTimestamp ? new Date(session.autoSubmitTimestamp).getTime() : 0);
  const derivedDuration = startMs > 0 && endMs > startMs ? endMs - startMs : 0;
  const durationMs =
    typeof session?.duration === 'number' && session.duration > 0
      ? session.duration
      : derivedDuration;
  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} minutes`;
  };

  const studentUsn = user?.usn || session?.student?.usn || session?.usn || 'N/A';
  const examDate =
    (session?.startTime ? new Date(session.startTime).toLocaleDateString() : 'N/A');
  const displayStatus =
    isAutoSubmitted
      ? 'Auto-Submitted'
      : isFlaggedForMalpractice
      ? 'Flagged'
      : session?.status
      ? String(session.status).replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Pending Admin Review';

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-['Inter',sans-serif] py-10">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="w-full max-w-lg px-6 text-center">
        <div className={`border rounded-2xl p-8 ${
          isAutoSubmitted || isFlaggedForMalpractice
            ? 'bg-[#111318] border-red-500/30'
            : 'bg-[#111318] border-[#1e2330]'
        }`}>
          <div className={`w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4 ${
            isAutoSubmitted || isFlaggedForMalpractice
              ? 'bg-red-500/15'
              : 'bg-teal-500/15'
          }`}>
            <i className={`text-4xl ${
              isAutoSubmitted || isFlaggedForMalpractice
                ? 'ri-alert-line text-red-400'
                : 'ri-checkbox-circle-fill text-teal-400'
            }`} />
          </div>
          
          <h1 className="text-white font-black text-2xl mb-2">
            {isAutoSubmitted ? 'Exam Auto-Submitted' : isFlaggedForMalpractice ? 'Malpractice Detected' : 'Exam Submitted'}
          </h1>
          
          <p className="text-[#6b7280] text-sm mb-8">
            {isAutoSubmitted 
              ? 'Your session was automatically submitted due to a verification failure.'
              : isFlaggedForMalpractice
              ? 'Your exam has been flagged for review due to malpractice detection.'
              : 'Your session has been recorded and is under admin review'}
          </p>

          {/* Malpractice Alert */}
          {(isAutoSubmitted || isFlaggedForMalpractice) && (flagReason || autoSubmitReason) && (
            <div className={`border rounded-xl p-4 mb-6 text-left ${
              isAutoSubmitted
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <i className={`text-lg flex-shrink-0 mt-0.5 ${
                  isAutoSubmitted ? 'ri-alert-line text-amber-400' : 'ri-close-circle-line text-red-400'
                }`} />
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                    isAutoSubmitted ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {isAutoSubmitted ? 'Auto-Submit Reason' : 'Malpractice Reason'}
                  </div>
                  <p className="text-[#9ca3af] text-sm">
                    {flagReason || (
                      <>
                        {autoSubmitReason === 'face_verification_failed' && 'Identity verification could not be completed after 3 attempts. Your exam has been submitted automatically.'}
                        {autoSubmitReason === 'face_mismatch_detected' && 'The face detected does not match your enrollment photo.'}
                        {autoSubmitReason === 'no_face_detected' && 'Your face could not be detected during verification.'}
                        {autoSubmitReason === 'multiple_people_detected' && 'Multiple people were detected during verification.'}
                        {autoSubmitReason === 'identity_confidence_low' && 'Identity confidence was too low to proceed.'}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Score Display - Shows marks obtained and total marks */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`rounded-xl p-4 border ${
              examPercentage >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' :
              examPercentage >= 50 ? 'bg-amber-500/10 border-amber-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              <div className={`text-3xl font-black mb-1 ${
                examPercentage >= 70 ? 'text-emerald-400' :
                examPercentage >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {examMarksObtained}/{examTotalMarks}
              </div>
              <div className="text-[#6b7280] text-xs">Marks Obtained</div>
              <div className="text-[#6b7280] text-xs mt-2">{examPercentage}%</div>
            </div>
            
            <div className={`rounded-xl p-4 border ${
              riskLevel === 'high' || riskLevel === 'critical'
                ? 'bg-red-500/10 border-red-500/20'
                : riskLevel === 'medium'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className={`text-3xl font-black mb-1 ${
                riskLevel === 'high' || riskLevel === 'critical'
                  ? 'text-red-400'
                  : riskLevel === 'medium'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {riskScore}
              </div>
              <div className="text-[#6b7280] text-xs">Risk Score</div>
              <div className={`text-xs mt-2 font-semibold ${
                riskLevel === 'high' || riskLevel === 'critical' ? 'text-red-400' :
                riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {riskLevel?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Result Details */}
          <div className="bg-[#0a0c10] border border-[#1e2330] rounded-xl p-4 mb-6 text-left space-y-2">
            {[
              { label: 'USN', val: studentUsn },
              { label: 'Date', val: examDate },
              { label: 'Duration', val: formatDuration(durationMs) },
              { label: 'Status', val: displayStatus },
              { label: 'Risk Level', val: riskLevel?.charAt(0).toUpperCase() + riskLevel?.slice(1) },
              ...(session?.autoSubmitTimestamp ? [{
                label: 'Submitted At',
                val: new Date(session.autoSubmitTimestamp).toLocaleString()
              }] : []),
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">{r.label}</span>
                <span className="text-white font-medium">{r.val}</span>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className={`rounded-xl p-4 mb-6 text-left flex items-start gap-2 text-xs ${
            isAutoSubmitted || isFlaggedForMalpractice
              ? 'bg-red-500/5 border border-red-500/15'
              : 'bg-teal-500/5 border border-teal-500/15'
          }`}>
            <i className={`mt-0.5 flex-shrink-0 ${
              isAutoSubmitted || isFlaggedForMalpractice
                ? 'ri-alert-line text-red-400'
                : 'ri-mail-line text-teal-400'
            }`} />
            <span className={
              isAutoSubmitted || isFlaggedForMalpractice
                ? 'text-red-400/80'
                : 'text-teal-400/80'
            }>
              {isAutoSubmitted || isFlaggedForMalpractice
                ? 'Your exam has been flagged for manual review by an administrator due to malpractice indicators. You will be notified of the outcome within 24-48 hours.'
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
