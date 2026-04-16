import { useNavigate } from 'react-router-dom';

interface Exam {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  startTime: string;
  endTime: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  status: string;
  avgRiskScore: number;
  highRiskCount: number;
  createdBy: string;
}

interface Props {
  activeExams: Exam[];
  scheduledExams: Exam[];
  completedExams: Exam[];
}

function statusColor(status: string) {
  if (status === 'active') return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
  if (status === 'scheduled') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-[#6b7280] bg-[#1a1d24] border-[#2a2d35]';
}

function riskColor(score: number) {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-emerald-400';
}

export default function LiveExamStatus({ activeExams, scheduledExams, completedExams }: Props) {
  const navigate = useNavigate();
  const allExams = [...activeExams, ...scheduledExams, ...completedExams].slice(0, 5);

  return (
    <div className="bg-[#12151c] border border-[#1e2330] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2330]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-file-list-3-line text-teal-400 text-base" />
          </div>
          <h2 className="text-white font-semibold text-sm">Exam Status Overview</h2>
          {activeExams.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              {activeExams.length} Live
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/admin/exams')}
          className="text-xs text-[#6b7280] hover:text-teal-400 transition-colors cursor-pointer whitespace-nowrap"
        >
          View all <i className="ri-arrow-right-s-line" />
        </button>
      </div>

      <div className="divide-y divide-[#1e2330]">
        {allExams.map((exam) => {
          const progress =
            exam.status === 'active' && exam.totalStudents > 0
              ? Math.round((exam.activeStudents / exam.totalStudents) * 100)
              : exam.status === 'completed'
              ? 100
              : 0;

          return (
            <div
              key={exam.id}
              className="px-5 py-3.5 hover:bg-[#1a1d24] transition-colors cursor-pointer"
              onClick={() => navigate('/admin/exams')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium truncate">{exam.title}</span>
                    <span className="text-[#4b5563] text-xs font-mono">{exam.courseCode}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[#6b7280] text-xs flex items-center gap-1">
                      <i className="ri-user-line" />
                      {exam.totalStudents} students
                    </span>
                    <span className="text-[#6b7280] text-xs flex items-center gap-1">
                      <i className="ri-time-line" />
                      {exam.startTime} – {exam.endTime}
                    </span>
                    {exam.status === 'active' && (
                      <span className={`text-xs font-medium ${riskColor(exam.avgRiskScore)}`}>
                        Avg risk: {exam.avgRiskScore}
                      </span>
                    )}
                    {exam.highRiskCount > 0 && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <i className="ri-alert-line" />
                        {exam.highRiskCount} high-risk
                      </span>
                    )}
                  </div>
                  {exam.status === 'active' && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[#1e2330] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[#6b7280] text-xs whitespace-nowrap">
                        {exam.activeStudents}/{exam.totalStudents} active
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColor(
                    exam.status
                  )}`}
                >
                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
