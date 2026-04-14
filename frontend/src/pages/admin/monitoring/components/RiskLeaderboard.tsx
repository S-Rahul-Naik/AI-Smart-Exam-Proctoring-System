import { useMemo } from 'react';

interface Session {
  _id: string;
  student: { firstName: string; lastName: string; email: string };
  avgRisk: number;
}

interface Props {
  sessions: Session[];
  riskScores: Record<string, number>;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

function getRiskLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const RISK_COLORS = {
  high: { text: 'text-red-400', bg: 'bg-red-500/10', bar: 'bg-red-500', badge: 'bg-red-500/20 text-red-400' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-400' },
  low: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400' },
};

export default function RiskLeaderboard({ sessions, riskScores, onSelect, selectedId }: Props) {
  const sorted = useMemo(() => {
    return sessions
      .filter(s => s.student && s.student.firstName && s.student.lastName) // Filter out invalid sessions
      .map(s => ({
        id: s._id,
        name: `${s.student.firstName} ${s.student.lastName}`,
        email: s.student.email || 'No email',
        currentRisk: Math.round(riskScores[s._id] || s.avgRisk || 0),
      }))
      .sort((a, b) => b.currentRisk - a.currentRisk);
  }, [sessions, riskScores]);

  return (
    <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e2330] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-bar-chart-grouped-line text-teal-400 text-sm" />
          </div>
          <span className="text-white text-sm font-semibold">Risk Leaderboard</span>
        </div>
        <span className="text-[#4b5563] text-xs">Live · auto-sorts</span>
      </div>

      <div className="divide-y divide-[#1a1d24]">
        {sorted.map((student, rank) => {
          const level = getRiskLevel(student.currentRisk);
          const colors = RISK_COLORS[level];
          const isSelected = selectedId === student.id;

          return (
            <div
              key={student.id}
              onClick={() => onSelect(student.id)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${isSelected ? 'bg-teal-500/5 border-l-2 border-teal-500' : 'hover:bg-[#15181f] border-l-2 border-transparent'}`}
            >
              {/* Rank */}
              <div className={`w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 text-xs font-bold ${rank === 0 ? 'bg-red-500/20 text-red-400' : rank === 1 ? 'bg-amber-500/20 text-amber-400' : rank === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-[#1a1d24] text-[#6b7280]'}`}>
                {rank + 1}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">{student.name}</div>
                <div className="text-[#6b7280] text-xs truncate">{student.email}</div>
                <div className="relative h-1.5 bg-[#1e2330] rounded-full overflow-hidden mt-1">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${colors.bar}`}
                    style={{ width: `${student.currentRisk}%` }}
                  />
                </div>
              </div>

              {/* Score */}
              <div className={`text-sm font-bold tabular-nums flex-shrink-0 ${colors.text}`}>
                {student.currentRisk}
              </div>

              {/* Level badge */}
              <div className={`hidden sm:flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${colors.badge}`}>
                {level === 'high' ? 'HIGH' : level === 'medium' ? 'MED' : 'LOW'}
              </div>

              {/* Pulse for high risk */}
              {level === 'high' && (
                <div className="w-2 h-2 flex items-center justify-center flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
