import AdminLayout from '../../../components/feature/AdminLayout';
import { mockAnalytics } from '../../../mocks/analytics';
import QuestionHeatmap from './components/QuestionHeatmap';

export default function AdminAnalyticsPage() {
  const { summary, riskDistribution, violationTypes, monthlyTrend, recentSessions, questionHeatmap } = mockAnalytics;

  return (
    <AdminLayout title="Reports & Analytics" subtitle="System-wide behavioral analysis and performance metrics">
      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Exams', val: summary.totalExams, trend: '+12%', up: true, icon: 'ri-file-list-3-line', color: 'text-teal-400' },
          { label: 'Avg Risk Score', val: summary.avgRiskScore, trend: '-4%', up: false, icon: 'ri-radar-line', color: 'text-amber-400' },
          { label: 'Flagged Sessions', val: summary.flaggedSessions, trend: '+2', up: true, icon: 'ri-flag-line', color: 'text-red-400' },
          { label: 'Approval Rate', val: `${summary.approvalRate}%`, trend: '+0.5%', up: true, icon: 'ri-checkbox-circle-line', color: 'text-emerald-400' },
        ].map(metric => (
          <div key={metric.label} className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1d24]">
                <i className={`${metric.icon} ${metric.color} text-lg`} />
              </div>
              <span className={`text-xs font-semibold ${metric.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {metric.up ? '↑' : '↓'} {metric.trend}
              </span>
            </div>
            <div className={`text-3xl font-black ${metric.color} mb-1`}>{metric.val}</div>
            <div className="text-[#6b7280] text-xs">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly trend chart */}
        <div className="lg:col-span-2 bg-[#111318] border border-[#1e2330] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Monthly Exam & Risk Trend</h3>
          <p className="text-[#4b5563] text-xs mb-5">Average risk score vs exams conducted per month</p>
          <div className="flex items-end gap-4 h-36 mb-3">
            {monthlyTrend.map(month => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-amber-500/60 rounded-t"
                  style={{ height: `${(month.avgRisk / 50) * 100}%` }}
                  title={`Avg risk: ${month.avgRisk}`}
                />
                <div
                  className="w-full bg-teal-500/40 rounded-t -mt-1"
                  style={{ height: `${(month.exams / 12) * 40}%` }}
                  title={`Exams: ${month.exams}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-around text-xs text-[#4b5563]">
            {monthlyTrend.map(m => <span key={m.month}>{m.month}</span>)}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <span className="w-3 h-3 rounded-sm bg-amber-500/60 flex-shrink-0" />Avg Risk Score
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
              <span className="w-3 h-3 rounded-sm bg-teal-500/40 flex-shrink-0" />Exams Conducted
            </div>
          </div>
        </div>

        {/* Violation types donut */}
        <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Violation Types</h3>
          <p className="text-[#4b5563] text-xs mb-5">Distribution of detected violations</p>
          <div className="space-y-3">
            {violationTypes.map(vt => {
              const total = violationTypes.reduce((s, v) => s + v.value, 0);
              const pct = Math.round((vt.value / total) * 100);
              return (
                <div key={vt.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#9ca3af] text-xs">{vt.label}</span>
                    <span className="text-white text-xs font-semibold">{vt.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#1e2330] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: vt.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-[#1e2330]">
            <h4 className="text-white font-semibold text-xs mb-3">Risk Distribution</h4>
            <div className="flex items-center gap-2">
              {riskDistribution.map(rd => (
                <div key={rd.label} className="flex-1 text-center">
                  <div className="text-xl font-black" style={{ color: rd.color }}>{rd.value}%</div>
                  <div className="text-[#4b5563] text-xs">{rd.label.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question Violation Heatmap */}
      <div className="mb-6">
        <QuestionHeatmap data={questionHeatmap} />
      </div>

      {/* Recent sessions table */}
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2330]">
          <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2330]">
              {['Student', 'Exam', 'Date', 'Exam Score', 'Risk Score', 'Status', 'Actions'].map(col => (
                <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-[#4b5563] uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentSessions.map(s => (
              <tr key={s.id} className="border-b border-[#1e2330] hover:bg-[#1a1d24] transition-colors">
                <td className="px-5 py-3.5 text-white text-sm font-medium whitespace-nowrap">{s.student}</td>
                <td className="px-5 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">{s.exam.slice(0, 22)}...</td>
                <td className="px-5 py-3.5 text-[#6b7280] text-xs">{s.date}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-sm font-bold ${s.examScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{s.examScore}%</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-sm font-bold ${s.riskScore >= 70 ? 'text-red-400' : s.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.riskScore}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {s.status === 'approved' ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-teal-400 hover:text-teal-300 text-xs cursor-pointer whitespace-nowrap">View Report</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
