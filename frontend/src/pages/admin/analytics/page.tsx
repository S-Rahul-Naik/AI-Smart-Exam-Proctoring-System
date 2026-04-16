import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { adminAPI } from '../../../services/api';
import QuestionHeatmap from './components/QuestionHeatmap';
import type { QuestionViolationData } from './components/QuestionHeatmap';

interface ResultSessionRow {
  id: string;
  student: string;
  exam: string;
  date: string | null;
  examScore: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status?: 'approved' | 'pending' | 'flagged' | 'rejected';
}

interface ViolationType {
  label: string;
  value: number;
  color: string;
}

interface TrendPoint {
  label: string;
  cumulativeExams: number;
  avgRisk: number;
}

interface AnalyticsViewModel {
  summary: {
    totalExams: number;
    avgRiskScore: number;
    flaggedSessions: number;
    approvalRate: number;
  };
  riskDistribution: Array<{ label: string; value: number; color: string }>;
  violationTypes: ViolationType[];
  trendData: TrendPoint[];
  recentSessions: ResultSessionRow[];
  questionHeatmap: QuestionViolationData[];
}

const EMPTY_ANALYTICS: AnalyticsViewModel = {
  summary: {
    totalExams: 0,
    avgRiskScore: 0,
    flaggedSessions: 0,
    approvalRate: 0,
  },
  riskDistribution: [
    { label: 'Low Risk', value: 0, color: '#10b981' },
    { label: 'Medium Risk', value: 0, color: '#f59e0b' },
    { label: 'High Risk', value: 0, color: '#ef4444' },
  ],
  violationTypes: [],
  trendData: [],
  recentSessions: [],
  questionHeatmap: [],
};

const VIOLATION_COLORS: Record<string, string> = {
  'Gaze Deviation': '#f59e0b',
  'Face Missing': '#ef4444',
  'Multiple Faces': '#f97316',
  'Phone Detected': '#dc2626',
};

function formatViolationLabel(type: string): string {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('gaze')) return 'Gaze Deviation';
  if (normalized.includes('multiple')) return 'Multiple Faces';
  if (normalized.includes('phone')) return 'Phone Detected';
  if (normalized.includes('face')) return 'Face Missing';
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsViewModel>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [analyticsRes, sessionsRes] = await Promise.all([
          adminAPI.getAnalyticsData(),
          adminAPI.getResultSessions(),
        ]);

        const analyticsPayload = analyticsRes?.data || {};
        const sessionRows: ResultSessionRow[] = sessionsRes?.data?.sessions || [];

        const totalSessions = sessionRows.length;
        const totalExams = new Set(
          sessionRows
            .map((session) => String(session.exam || '').trim())
            .filter(Boolean)
        ).size;

        const avgRiskScore =
          totalSessions > 0
            ? Math.round(
                sessionRows.reduce((sum, session) => sum + Number(session.riskScore || 0), 0) /
                  totalSessions
              )
            : 0;

        const flaggedSessions = sessionRows.filter(
          (session) =>
            Number(session.riskScore || 0) >= 70 ||
            session.riskLevel === 'high' ||
            session.riskLevel === 'critical' ||
            session.status === 'flagged' ||
            session.status === 'rejected'
        ).length;

        const approvedCount = sessionRows.filter((session) => session.status === 'approved').length;
        const approvalRate = totalSessions > 0 ? Math.round((approvedCount / totalSessions) * 100) : 0;

        const lowCount = sessionRows.filter((session) => session.riskLevel === 'low').length;
        const mediumCount = sessionRows.filter((session) => session.riskLevel === 'medium').length;
        const highCount = sessionRows.filter(
          (session) => session.riskLevel === 'high' || session.riskLevel === 'critical'
        ).length;

        const riskDistribution = [
          {
            label: 'Low Risk',
            value: totalSessions > 0 ? Math.round((lowCount / totalSessions) * 100) : 0,
            color: '#10b981',
          },
          {
            label: 'Medium Risk',
            value: totalSessions > 0 ? Math.round((mediumCount / totalSessions) * 100) : 0,
            color: '#f59e0b',
          },
          {
            label: 'High Risk',
            value: totalSessions > 0 ? Math.round((highCount / totalSessions) * 100) : 0,
            color: '#ef4444',
          },
        ];

        const violationTypesRaw: Array<{ _id: string; count: number }> =
          analyticsPayload?.alerts?.byType || [];

        const violationTypes = violationTypesRaw
          .map((entry) => {
            const label = formatViolationLabel(String(entry?._id || 'Unknown'));
            return {
              label,
              value: Number(entry?.count || 0),
              color: VIOLATION_COLORS[label] || '#14b8a6',
            };
          })
          .sort((a, b) => b.value - a.value);

        // Sort sessions by date to show cumulative trend
        const sortedSessions = [...sessionRows]
          .filter((s) => s.date && !Number.isNaN(new Date(s.date).getTime()))
          .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

        // Calculate cumulative trend: select up to 12 evenly-spaced snapshots
        const trendData: TrendPoint[] = [];
        const interval = Math.max(1, Math.ceil(sortedSessions.length / 12));
        
        for (let i = 0; i < sortedSessions.length; i += interval) {
          const upToIndex = i;
          const sessionsSoFar = sortedSessions.slice(0, upToIndex + 1);
          const sessionDate = sortedSessions[upToIndex].date;
          const parsed = new Date(sessionDate || '');
          const dateLabel = parsed ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
          
          const cumulativeExams = sessionsSoFar.length;
          const cumAvgRisk = Math.round(
            sessionsSoFar.reduce((sum, s) => sum + Number(s.riskScore || 0), 0) / cumulativeExams
          );
          
          trendData.push({
            label: dateLabel,
            cumulativeExams,
            avgRisk: cumAvgRisk,
          });
        }
        
        // Always include final point if not already included
        if (sortedSessions.length > 0 && trendData.length === 0) {
          const final = sortedSessions[sortedSessions.length - 1];
          const parsed = new Date(final.date || '');
          const dateLabel = parsed ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
          trendData.push({
            label: dateLabel,
            cumulativeExams: sortedSessions.length,
            avgRisk: Math.round(
              sortedSessions.reduce((sum, s) => sum + Number(s.riskScore || 0), 0) / sortedSessions.length
            ),
          });
        }

        const recentSessions = [...sessionRows]
          .sort((a, b) => {
            const aDate = a.date ? new Date(a.date).getTime() : 0;
            const bDate = b.date ? new Date(b.date).getTime() : 0;
            return bDate - aDate;
          })
          .slice(0, 12)
          .map((session) => ({ ...session, date: formatDate(session.date) }));

        setData({
          summary: {
            totalExams,
            avgRiskScore,
            flaggedSessions,
            approvalRate,
          },
          riskDistribution,
          violationTypes,
          trendData,
          recentSessions,
          // Keep empty until question-level telemetry is available from backend.
          questionHeatmap: [],
        });
      } catch (loadError: any) {
        setError(loadError?.response?.data?.error || 'Failed to load analytics');
        setData(EMPTY_ANALYTICS);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const trends = useMemo(() => {
    const trendPoints = data.trendData;
    const last = trendPoints[trendPoints.length - 1];
    const prev = trendPoints[trendPoints.length - 2];

    const safePct = (current: number, previous: number) => {
      if (!previous) {
        return current > 0 ? '+100%' : '+0%';
      }
      const delta = ((current - previous) / previous) * 100;
      const rounded = Math.round(delta * 10) / 10;
      return `${rounded >= 0 ? '+' : ''}${rounded}%`;
    };

    return {
      totalExams: safePct(last?.cumulativeExams || 0, prev?.cumulativeExams || 0),
      avgRiskScore: safePct(last?.avgRisk || 0, prev?.avgRisk || 0),
      flaggedSessions: `+${data.summary.flaggedSessions}`,
      approvalRate: `${data.summary.approvalRate >= 50 ? '+' : ''}${Math.round((data.summary.approvalRate - 50) * 10) / 10}%`,
    };
  }, [data.trendData, data.summary]);

  return (
    <AdminLayout title="Reports & Analytics" subtitle="System-wide behavioral analysis and performance metrics">
      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Exams', val: data.summary.totalExams, trend: trends.totalExams, up: true, icon: 'ri-file-list-3-line', color: 'text-teal-400' },
          { label: 'Avg Risk Score', val: data.summary.avgRiskScore, trend: trends.avgRiskScore, up: false, icon: 'ri-radar-line', color: 'text-amber-400' },
          { label: 'Flagged Sessions', val: data.summary.flaggedSessions, trend: trends.flaggedSessions, up: true, icon: 'ri-flag-line', color: 'text-red-400' },
          { label: 'Approval Rate', val: `${data.summary.approvalRate}%`, trend: trends.approvalRate, up: true, icon: 'ri-checkbox-circle-line', color: 'text-emerald-400' },
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-1 gap-6 mb-6">
        {/* Violation types donut */}
        <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Violation Types</h3>
          <p className="text-[#4b5563] text-xs mb-5">Distribution of detected violations</p>
          {data.violationTypes.length === 0 ? (
            <div className="text-[#6b7280] text-xs mb-2">No live violation-type data available yet.</div>
          ) : (
            <div className="space-y-3">
              {data.violationTypes.map(vt => {
                const total = data.violationTypes.reduce((s, v) => s + v.value, 0);
                const pct = total > 0 ? Math.round((vt.value / total) * 100) : 0;
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
          )}

          <div className="mt-5 pt-4 border-t border-[#1e2330]">
            <h4 className="text-white font-semibold text-xs mb-3">Risk Distribution</h4>
            <div className="flex items-center gap-2">
              {data.riskDistribution.map(rd => (
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
        <QuestionHeatmap data={data.questionHeatmap} />
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
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#6b7280] text-sm">Loading analytics...</td>
              </tr>
            )}

            {!loading && data.recentSessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#6b7280] text-sm">No recent sessions available</td>
              </tr>
            )}

            {!loading && data.recentSessions.map(s => (
              <tr key={s.id} className="border-b border-[#1e2330] hover:bg-[#1a1d24] transition-colors">
                <td className="px-5 py-3.5 text-white text-sm font-medium whitespace-nowrap">{s.student}</td>
                <td className="px-5 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">{s.exam.length > 22 ? `${s.exam.slice(0, 22)}...` : s.exam}</td>
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
