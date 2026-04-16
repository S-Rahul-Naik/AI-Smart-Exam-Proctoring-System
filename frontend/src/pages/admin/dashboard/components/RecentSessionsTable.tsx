import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  student: string;
  exam: string;
  date: string;
  examScore: number;
  riskScore: number;
  riskLevel: string;
  status: string;
}

interface Props {
  sessions: Session[];
}

function riskBadge(level: string, score: number) {
  if (level === 'high') return <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{score}</span>;
  if (level === 'medium') return <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{score}</span>;
  return <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{score}</span>;
}

function statusBadge(status: string) {
  if (status === 'pending') return <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>;
  if (status === 'approved') return <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Approved</span>;
  if (status === 'rejected') return <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Rejected</span>;
  return <span className="text-xs text-[#6b7280] bg-[#1a1d24] border border-[#2a2d35] px-2 py-0.5 rounded-full">{status}</span>;
}

export default function RecentSessionsTable({ sessions }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#12151c] border border-[#1e2330] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2330]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-camera-line text-teal-400 text-base" />
          </div>
          <h2 className="text-white font-semibold text-sm">Recent Sessions</h2>
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {sessions.filter((s) => s.status === 'pending').length} pending
          </span>
        </div>
        <button
          onClick={() => navigate('/admin/sessions')}
          className="text-xs text-[#6b7280] hover:text-teal-400 transition-colors cursor-pointer whitespace-nowrap"
        >
          Review all <i className="ri-arrow-right-s-line" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2330]">
              <th className="text-left text-[#4b5563] text-xs font-medium px-5 py-2.5">Student</th>
              <th className="text-left text-[#4b5563] text-xs font-medium px-3 py-2.5 hidden sm:table-cell">Exam</th>
              <th className="text-center text-[#4b5563] text-xs font-medium px-3 py-2.5">Score</th>
              <th className="text-center text-[#4b5563] text-xs font-medium px-3 py-2.5">Risk</th>
              <th className="text-center text-[#4b5563] text-xs font-medium px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2330]">
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-[#1a1d24] transition-colors cursor-pointer"
                onClick={() => navigate('/admin/sessions')}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-400 text-xs font-bold">
                        {s.student.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-white text-sm whitespace-nowrap">{s.student}</span>
                  </div>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className="text-[#9ca3af] text-xs truncate max-w-[140px] block">{s.exam}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-white text-sm font-medium">{s.examScore}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  {riskBadge(s.riskLevel, s.riskScore)}
                </td>
                <td className="px-3 py-3 text-center">
                  {statusBadge(s.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
