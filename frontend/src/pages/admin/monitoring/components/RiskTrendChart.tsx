import { mockRiskHistory } from '../../../../mocks/alerts';

interface RiskTrendChartProps {
  riskScores: Record<string, number>;
  students: Array<{ id: string; name: string }>;
}

export default function RiskTrendChart({ riskScores, students }: RiskTrendChartProps) {
  const topStudents = students
    .map(s => ({ ...s, score: riskScores[s.id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold">Risk Leaderboard</h3>
        <span className="text-xs text-[#4b5563]">Live</span>
      </div>

      {/* Trend bars visual */}
      <div className="flex items-end gap-1 h-16 mb-4">
        {mockRiskHistory.map((point, i) => {
          const avgRisk = Math.round(
            Object.values({ s001: point.s001, s002: point.s002, s003: point.s003, s005: point.s005, s007: point.s007, s008: point.s008 })
              .reduce((a, b) => a + b, 0) / 6
          );
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div
                className={`w-full rounded-t transition-all ${avgRisk >= 60 ? 'bg-red-500/60' : avgRisk >= 35 ? 'bg-amber-500/60' : 'bg-emerald-500/60'}`}
                style={{ height: `${(avgRisk / 100) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-[#2d3139] mb-4">
        {mockRiskHistory.map(p => <span key={p.time}>{p.time}m</span>)}
      </div>

      {/* Top risk students */}
      <div className="space-y-2">
        {topStudents.map((s, i) => {
          const level = s.score >= 70 ? 'high' : s.score >= 40 ? 'medium' : 'low';
          const barColor = level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-[#4b5563] text-xs w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[#9ca3af] text-xs truncate">{s.name.split(' ')[0]}</span>
                  <span className={`text-xs font-bold ${level === 'high' ? 'text-red-400' : level === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(s.score)}</span>
                </div>
                <div className="h-1 bg-[#1e2330] rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
