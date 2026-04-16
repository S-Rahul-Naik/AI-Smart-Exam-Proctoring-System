import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/feature/AdminLayout';
import { adminAPI, examAPI } from '@/services/api';
import DashboardKPICards from './components/DashboardKPICards';
import LiveExamStatus from './components/LiveExamStatus';
import RecentSessionsTable from './components/RecentSessionsTable';
import RiskOverviewChart from './components/RiskOverviewChart';
import ActivityFeed from './components/ActivityFeed';

type TimeRange = 'today' | 'week' | 'month';

type DashboardExam = {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  startTime: string;
  endTime: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  status: 'active' | 'scheduled' | 'completed';
  avgRiskScore: number;
  highRiskCount: number;
  createdBy: string;
};

type DashboardSession = {
  id: string;
  student: string;
  exam: string;
  courseCode?: string;
  date: string;
  examScore: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: string;
};

type DistItem = { label: string; value: number; color: string };
type MonthlyPoint = { month: string; exams: number; avgRisk: number; flagged: number };

type DashboardAlert = {
  id: string;
  studentId: string;
  studentName?: string;
  type: string;
  timestamp: string;
  relativeTime: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskContribution: number;
};

type ActivityItem = {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  text: string;
  time: string;
};

const ADMIN_SESSIONS_UPDATED_EVENT = 'admin:sessions-updated';

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

function toTimeAgo(dateLike: string): string {
  const ts = new Date(dateLike).getTime();
  if (Number.isNaN(ts)) return 'just now';
  const diffMins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const EMPTY_STATE = {
  exams: [] as DashboardExam[],
  sessions: [] as DashboardSession[],
  alerts: [] as DashboardAlert[],
  monthlyTrend: [] as MonthlyPoint[],
  riskDistribution: [
    { label: 'Low Risk', value: 0, color: '#10b981' },
    { label: 'Medium Risk', value: 0, color: '#f59e0b' },
    { label: 'High Risk', value: 0, color: '#ef4444' },
  ] as DistItem[],
  violationTypes: [] as DistItem[],
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(EMPTY_STATE);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [examsRes, sessionsRes, analyticsRes, alertsRes] = await Promise.allSettled([
      examAPI.getExams(),
      adminAPI.getResultSessions(),
      adminAPI.getAnalyticsData(),
      adminAPI.getHighRiskAlerts(),
    ]);

    try {
      const examsRaw =
        examsRes.status === 'fulfilled' ? examsRes.value?.data?.exams || [] : [];
      const sessionsRaw: DashboardSession[] =
        sessionsRes.status === 'fulfilled'
          ? (sessionsRes.value?.data?.sessions || []).map((s: any) => ({
              id: String(s.id || s._id || ''),
              student: String(s.student || 'Student'),
              exam: String(s.exam || 'Exam Session'),
              courseCode: String(s.courseCode || ''),
              date: String(s.date || ''),
              examScore: Number(s.examScore || 0),
              riskScore: Number(s.riskScore || 0),
              riskLevel: s.riskLevel === 'critical' ? 'high' : (s.riskLevel || 'low'),
              status: String(s.status || 'pending'),
            }))
          : [];

        const normalizedExams: DashboardExam[] = examsRaw.map((exam: any) => {
          const title = String(exam.title || 'Untitled Exam');
          const courseCode = String(exam.courseCode || exam.code || '').toUpperCase();

          const linkedSessions = sessionsRaw.filter((session) => {
            const byCode = courseCode && String(session.courseCode || '').toUpperCase() === courseCode;
            const byTitle = title && session.exam.toLowerCase().includes(title.toLowerCase());
            return byCode || byTitle;
          });

          const avgRiskScore =
            linkedSessions.length > 0
              ? Math.round(
                  linkedSessions.reduce((sum, s) => sum + Number(s.riskScore || 0), 0) /
                    linkedSessions.length
                )
              : 0;

          const highRiskCount = linkedSessions.filter(
            (s) => Number(s.riskScore || 0) >= 70 || s.riskLevel === 'high'
          ).length;

          const totalStudents = Array.isArray(exam.allowedStudents)
            ? exam.allowedStudents.length
            : Number(exam.totalStudents || exam.sessionCount || linkedSessions.length || 0);
          const completedStudents = linkedSessions.length;

          const statusRaw = String(exam.status || 'scheduled').toLowerCase();
          const status: 'active' | 'scheduled' | 'completed' =
            statusRaw === 'active'
              ? 'active'
              : statusRaw === 'completed'
              ? 'completed'
              : 'scheduled';

          const activeStudents = status === 'active' ? Math.max(0, totalStudents - completedStudents) : 0;

          return {
            id: String(exam._id || exam.id || ''),
            title,
            courseCode,
            date: String(exam.date || ''),
            startTime: String(exam.startTime || '--'),
            endTime: String(exam.endTime || '--'),
            totalStudents,
            activeStudents,
            completedStudents,
            status,
            avgRiskScore,
            highRiskCount,
            createdBy: String(exam.createdBy?.firstName || exam.createdBy || 'Admin'),
          };
        });

        const lowCount = sessionsRaw.filter((s) => s.riskLevel === 'low').length;
        const mediumCount = sessionsRaw.filter((s) => s.riskLevel === 'medium').length;
        const highCount = sessionsRaw.filter((s) => s.riskLevel === 'high').length;
        const total = sessionsRaw.length || 1;

        const riskDistribution: DistItem[] = [
          { label: 'Low Risk', value: Math.round((lowCount / total) * 100), color: '#10b981' },
          { label: 'Medium Risk', value: Math.round((mediumCount / total) * 100), color: '#f59e0b' },
          { label: 'High Risk', value: Math.round((highCount / total) * 100), color: '#ef4444' },
        ];

        const analyticsPayload =
          analyticsRes.status === 'fulfilled' ? analyticsRes.value?.data || {} : {};
        const violationTypesRaw: Array<{ _id: string; count: number }> =
          analyticsPayload?.alerts?.byType || [];
        const violationTypes: DistItem[] = violationTypesRaw
          .map((entry) => {
            const label = formatViolationLabel(String(entry?._id || 'Unknown'));
            return {
              label,
              value: Number(entry?.count || 0),
              color:
                label === 'Gaze Deviation'
                  ? '#f59e0b'
                  : label === 'Face Missing'
                  ? '#ef4444'
                  : label === 'Multiple Faces'
                  ? '#f97316'
                  : label === 'Phone Detected'
                  ? '#dc2626'
                  : '#14b8a6',
            };
          })
          .sort((a, b) => b.value - a.value);

        const now = new Date();
        const monthBuckets = Array.from({ length: 6 }, (_, idx) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return { key, month: d.toLocaleString('en-US', { month: 'short' }) };
        });

        const monthlyTrend: MonthlyPoint[] = monthBuckets.map((bucket) => {
          const inMonth = sessionsRaw.filter((session) => {
            if (!session.date) return false;
            const parsed = new Date(session.date);
            if (Number.isNaN(parsed.getTime())) return false;
            const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
            return key === bucket.key;
          });

          const avgRisk =
            inMonth.length > 0
              ? Math.round(inMonth.reduce((sum, s) => sum + Number(s.riskScore || 0), 0) / inMonth.length)
              : 0;
          const flagged = inMonth.filter((s) => Number(s.riskScore || 0) >= 70 || s.riskLevel === 'high').length;

          return { month: bucket.month, exams: inMonth.length, avgRisk, flagged };
        });

        const alertsRaw =
          alertsRes.status === 'fulfilled' ? alertsRes.value?.data?.alerts || [] : [];
        const alerts: DashboardAlert[] = alertsRaw.map((alert: any, idx: number) => {
          const createdAt = String(alert.createdAt || new Date().toISOString());
          const studentName =
            `${alert?.student?.firstName || ''} ${alert?.student?.lastName || ''}`.trim() ||
            alert?.student?.email ||
            undefined;
          return {
            id: String(alert._id || `alert-${idx}`),
            studentId: String(alert?.student?._id || alert?.studentId || alert?.student || 'unknown'),
            studentName,
            type: String(alert.type || 'behavior_anomaly'),
            timestamp: createdAt,
            relativeTime: Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)),
            description: String(alert.message || `Alert: ${alert.type || 'behavior anomaly'}`),
            severity: (alert.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
            riskContribution: Number(alert.riskScore || 0),
          };
        });

      setData({
        exams: normalizedExams,
        sessions: sessionsRaw,
        alerts,
        monthlyTrend,
        riskDistribution,
        violationTypes,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
      setData(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const handleSessionsUpdated = () => {
      loadDashboard();
    };

    window.addEventListener(ADMIN_SESSIONS_UPDATED_EVENT, handleSessionsUpdated);
    return () => window.removeEventListener(ADMIN_SESSIONS_UPDATED_EVENT, handleSessionsUpdated);
  }, [loadDashboard]);

  const activeExams = data.exams.filter((e) => e.status === 'active');
  const scheduledExams = data.exams.filter((e) => e.status === 'scheduled');
  const completedExams = data.exams.filter((e) => e.status === 'completed');

  const totalSessions = data.sessions.length;
  const avgRiskScore =
    totalSessions > 0
      ? Math.round(data.sessions.reduce((sum, s) => sum + Number(s.riskScore || 0), 0) / totalSessions)
      : 0;
  const flaggedSessions = data.sessions.filter(
    (s) => Number(s.riskScore || 0) >= 70 || s.riskLevel === 'high' || s.status === 'flagged'
  ).length;
  const approvedCount = data.sessions.filter((s) => s.status === 'approved').length;
  const approvalRate = totalSessions > 0 ? Math.round((approvedCount / totalSessions) * 100) : 0;
  const highRiskStudents = new Set(
    data.sessions
      .filter((s) => Number(s.riskScore || 0) >= 70 || s.riskLevel === 'high')
      .map((s) => s.student)
  ).size;

  const recentSessions = [...data.sessions]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 8);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const alertActivities: ActivityItem[] = data.alerts.slice(0, 4).map((a) => ({
      id: `alert-${a.id}`,
      icon: 'ri-alert-line',
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      text: `${a.studentName || a.studentId}: ${a.description}`,
      time: toTimeAgo(a.timestamp),
    }));

    const sessionActivities: ActivityItem[] = recentSessions.slice(0, 4).map((s) => ({
      id: `session-${s.id}`,
      icon: s.status === 'approved' ? 'ri-check-double-line' : 'ri-camera-line',
      iconColor: s.status === 'approved' ? 'text-emerald-400' : 'text-sky-400',
      iconBg: s.status === 'approved' ? 'bg-emerald-500/10' : 'bg-sky-500/10',
      text: `${s.student} — ${s.exam} (${s.status})`,
      time: toTimeAgo(s.date),
    }));

    return [...alertActivities, ...sessionActivities].slice(0, 8);
  }, [data.alerts, recentSessions]);

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Welcome back, Admin — here's what's happening today"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-[#12151c] border border-[#1e2330] rounded-xl px-4 py-3 text-[#9ca3af] text-sm">
            Loading dashboard data...
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center bg-[#1a1d24] border border-[#2a2d35] rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  timeRange === r
                    ? 'bg-teal-500 text-white'
                    : 'text-[#6b7280] hover:text-white'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <DashboardKPICards
          totalExams={data.exams.length}
          totalSessions={totalSessions}
          avgRiskScore={avgRiskScore}
          flaggedSessions={flaggedSessions}
          approvalRate={approvalRate}
          activeExams={activeExams.length}
          highRiskStudents={highRiskStudents}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left column — 8 cols */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {/* Live Exam Status */}
            <LiveExamStatus
              activeExams={activeExams}
              scheduledExams={scheduledExams}
              completedExams={completedExams}
            />

            {/* Risk Overview Chart */}
            <RiskOverviewChart
              monthlyTrend={data.monthlyTrend}
            />

            {/* Recent Sessions */}
            <RecentSessionsTable sessions={recentSessions} />
          </div>

          {/* Right column — 4 cols */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            {/* Activity Feed */}
            <ActivityFeed items={activityItems} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
