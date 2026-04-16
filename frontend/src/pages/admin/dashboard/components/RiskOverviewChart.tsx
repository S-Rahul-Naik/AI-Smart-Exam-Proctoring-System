interface MonthlyPoint {
  month: string;
  exams: number;
  avgRisk: number;
  flagged: number;
}

interface Props {
  monthlyTrend: MonthlyPoint[];
}

export default function RiskOverviewChart({ monthlyTrend }: Props) {
  const maxRisk = Math.max(...monthlyTrend.map((m) => m.avgRisk));
  const safeMaxRisk = maxRisk > 0 ? maxRisk : 1;
  const barMaxHeight = 120;

  return (
    <div className="bg-[#12151c] border border-[#1e2330] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2330]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-bar-chart-2-line text-teal-400 text-base" />
          </div>
          <h2 className="text-white font-semibold text-sm">Risk Analytics</h2>
        </div>
      </div>

      <div className="p-5">
        <div>
          <div className="flex items-end gap-2 h-36">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
                  <div
                    className="w-full bg-teal-500/20 border border-teal-500/30 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(10, (m.avgRisk / safeMaxRisk) * barMaxHeight)}px` }}
                    title={`Avg Risk: ${m.avgRisk}`}
                  />
                </div>
                <span className="text-[#4b5563] text-xs">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {monthlyTrend.slice(-3).map((m) => (
              <div key={m.month} className="bg-[#1a1d24] rounded-lg p-3">
                <div className="text-[#6b7280] text-xs">{m.month}</div>
                <div className="text-white text-sm font-semibold mt-1">{m.exams} exams</div>
                <div className="text-amber-400 text-xs">Avg risk: {m.avgRisk}</div>
                <div className="text-red-400 text-xs">{m.flagged} flagged</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
