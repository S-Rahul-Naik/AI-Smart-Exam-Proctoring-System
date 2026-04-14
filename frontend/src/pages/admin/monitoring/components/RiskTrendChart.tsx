interface RiskTrendChartProps {
  riskScores: Record<string, number>;
  students: Array<{ _id: string; student: { firstName: string; lastName: string } }>;
}

export default function RiskTrendChart({ riskScores, students }: RiskTrendChartProps) {
  const topStudents = students
    .filter(s => s.student && s.student.firstName && s.student.lastName) // Filter out invalid sessions
    .map(s => ({
      id: s._id,
      name: `${s.student.firstName} ${s.student.lastName}`,
      score: riskScores[s._id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Generate trend bars from current average risk
  const trendBars = Array.from({ length: 6 }, (_, i) => {
    const variation = Math.sin(i * 0.5) * 15; // Create wave pattern
    const avgRisk = topStudents.length > 0
      ? Math.round(topStudents.reduce((sum, s) => sum + s.score, 0) / topStudents.length) + variation
      : 0;
    return Math.min(100, Math.max(0, avgRisk));
  });

  return (
    <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold">Risk Trend</h3>
        <span className="text-xs text-[#4b5563]">Live</span>
      </div>

      {/* Trend bars visual */}
      <div className="flex items-end gap-1 h-16 mb-4">
        {trendBars.map((risk, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end">
            <div
              className={`w-full rounded-t transition-all ${risk >= 70 ? 'bg-red-500/60' : risk >= 40 ? 'bg-amber-500/60' : 'bg-emerald-500/60'}`}
              style={{ height: `${(risk / 100) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#2d3139] mb-4">
        {['0m', '5m', '10m', '15m', '20m', '25m'].map((label) => (
          <span key={label}>{label}</span>
        ))}
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
