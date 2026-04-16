interface Props {
  totalExams: number;
  totalSessions: number;
  avgRiskScore: number;
  flaggedSessions: number;
  approvalRate: number;
  activeExams: number;
  highRiskStudents: number;
}

interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  bgAccent: string;
}

function KPICard({ icon, label, value, sub, accent, bgAccent }: KPICardProps) {
  return (
    <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${bgAccent}`}>
          <i className={`${icon} text-base ${accent}`} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-[#6b7280] text-xs mt-0.5">{label}</div>
        {sub && <div className={`text-xs mt-1 font-medium ${accent}`}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardKPICards({
  totalExams,
  totalSessions,
  avgRiskScore,
  flaggedSessions,
  approvalRate,
  activeExams,
  highRiskStudents,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KPICard
        icon="ri-live-line"
        label="Active Exams"
        value={activeExams}
        sub="Live right now"
        accent="text-teal-400"
        bgAccent="bg-teal-500/10"
      />
      <KPICard
        icon="ri-shield-flash-line"
        label="High-Risk Students"
        value={highRiskStudents}
        sub="Risk score &gt; 70"
        accent="text-red-400"
        bgAccent="bg-red-500/10"
      />
      <KPICard
        icon="ri-check-double-line"
        label="Approval Rate"
        value={`${approvalRate}%`}
        sub={`${totalSessions} total sessions`}
        accent="text-emerald-400"
        bgAccent="bg-emerald-500/10"
      />
      <KPICard
        icon="ri-file-list-3-line"
        label="Total Exams"
        value={totalExams}
        sub="This semester"
        accent="text-violet-400"
        bgAccent="bg-violet-500/10"
      />
      <KPICard
        icon="ri-camera-line"
        label="Total Sessions"
        value={totalSessions}
        sub="Proctored sessions"
        accent="text-sky-400"
        bgAccent="bg-sky-500/10"
      />
      <KPICard
        icon="ri-bar-chart-line"
        label="Avg Risk Score"
        value={avgRiskScore}
        sub="Across all sessions"
        accent="text-orange-400"
        bgAccent="bg-orange-500/10"
      />
      <KPICard
        icon="ri-flag-2-line"
        label="Flagged Sessions"
        value={flaggedSessions}
        sub="Needs attention"
        accent="text-rose-400"
        bgAccent="bg-rose-500/10"
      />
    </div>
  );
}
