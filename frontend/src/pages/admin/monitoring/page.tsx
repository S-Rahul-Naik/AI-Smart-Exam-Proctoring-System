import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { adminAPI } from '../../../services/api';
import StudentMonitorCard from './components/StudentMonitorCard';
import EventTimeline from './components/EventTimeline';
import RiskTrendChart from './components/RiskTrendChart';
import RiskLeaderboard from './components/RiskLeaderboard';
import { useAdminAlerts } from '../../../hooks/useAdminAlerts';

interface Session {
  _id: string;
  student: { email: string; firstName: string; lastName: string };
  exam: { title?: string; name?: string } | string;
  status: string;
  riskScore: number;
  alertsCount: number;
  highRiskCount: number;
  avgRisk: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export default function AdminMonitoringPage() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [riskScores, setRiskScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'leaderboard' | 'trend' | 'events'>('leaderboard');
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  const {
    notifications,
    unreadCount,
    toastAlert,
    toastVisible,
    isBadgeFlashing,
    markAllRead,
    markOneRead,
    dismissToast,
  } = useAdminAlerts(sessions);

  // Fetch active sessions from API
  useEffect(() => {
    let isInitialLoad = true;

    const fetchSessions = async () => {
      try {
        // Only show loading on initial load, not on polling updates
        if (isInitialLoad) {
          setLoading(true);
        }
        
        const response = await adminAPI.getActiveSessions();
        const sessionsData = response.data.sessions;
        setSessions(sessionsData);

        // Extract risk scores from sessions
        const scores = Object.fromEntries(
          sessionsData.map((s: Session) => [s._id, s.avgRisk])
        );
        setRiskScores(scores);
        
        // Mark initial load as complete
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err);
        setError(err.response?.data?.error || 'Failed to load sessions');
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    fetchSessions();
    // Poll every 5 seconds for updates (reduced frequency to minimize flickering)
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    const score = riskScores[s._id] || 0;
    if (filter === 'high') return score >= 70;
    if (filter === 'medium') return score >= 40 && score < 70;
    return score < 40;
  });

  const highRiskCount = sessions.filter(s => (riskScores[s._id] || 0) >= 70).length;
  const mediumRiskCount = sessions.filter(s => { const sc = riskScores[s._id] || 0; return sc >= 40 && sc < 70; }).length;
  const avgRisk = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (riskScores[s._id] || 0), 0) / sessions.length) : 0;

  if (error) {
    return (
      <AdminLayout
        title="Live Monitoring"
        subtitle="Error loading sessions"
        actions={null}
      >
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Live Monitoring"
      subtitle={`${sessions.length} active session${sessions.length !== 1 ? 's' : ''}`}
      actions={
        <div className="flex items-center gap-3">
          {/* Alert bell with badge */}
          <div className="relative">
            <button
              onClick={() => { setShowAlertPanel(p => !p); if (unreadCount > 0) markAllRead(); }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                unreadCount > 0
                  ? `${isBadgeFlashing ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-red-500/15 border-red-500/40 text-red-400'}`
                  : 'bg-[#111318] border-[#1e2330] text-[#6b7280] hover:text-white'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${unreadCount > 0 ? 'ri-alarm-warning-fill' : 'ri-notification-3-line'} text-sm`} />
              </div>
              {unreadCount > 0 ? `${unreadCount} Alert${unreadCount > 1 ? 's' : ''}` : 'Alerts'}
            </button>

            {/* Alert dropdown panel */}
            {showAlertPanel && (
              <div className="absolute right-0 top-10 w-80 bg-[#111318] border border-[#1e2330] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1e2330] flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Risk Threshold Alerts</span>
                  <button
                    onClick={() => setShowAlertPanel(false)}
                    className="w-5 h-5 flex items-center justify-center text-[#4b5563] hover:text-white cursor-pointer"
                  >
                    <i className="ri-close-line text-sm" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#1a1d24]">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <i className="ri-shield-check-line text-emerald-500/40 text-2xl block mb-2" />
                      <span className="text-[#4b5563] text-sm">No high-risk alerts yet</span>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markOneRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#15181f] ${!n.read ? 'bg-red-500/5' : ''}`}
                      >
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/15 flex-shrink-0 mt-0.5">
                          <i className="ri-alert-line text-red-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-xs font-semibold truncate">{n.studentName}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
                          </div>
                          <div className="text-red-300 text-xs mt-0.5">Risk → {n.riskScore}/100 (HIGH)</div>
                          <div className="text-[#4b5563] text-xs">{n.timestamp}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5">
            <i className="ri-stop-circle-line" /> Emergency Stop
          </button>
        </div>
      }
    >
      {/* ── High-risk alert toast ── */}
      {toastVisible && toastAlert && (
        <div className="fixed top-6 right-6 z-50 w-80 bg-[#111318] border-2 border-red-500/70 rounded-2xl shadow-2xl overflow-hidden">
          {/* Accent strip */}
          <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/15 flex-shrink-0 border border-red-500/30 animate-pulse">
                <i className="ri-alarm-warning-line text-red-400 text-lg" />
              </div>
              <div className="flex-1">
                <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-0.5">⚠ High Risk Alert</div>
                <div className="text-white text-sm font-bold">{toastAlert.studentName}</div>
                <div className="text-[#9ca3af] text-xs mt-0.5 leading-relaxed">
                  Risk score reached <strong className="text-red-400">{toastAlert.riskScore}/100</strong> — immediate review recommended
                </div>
                <div className="text-[#4b5563] text-xs mt-1">{toastAlert.timestamp}</div>
              </div>
              <button
                onClick={dismissToast}
                className="w-6 h-6 flex items-center justify-center text-[#4b5563] hover:text-white cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setSelectedStudent(toastAlert.studentId); dismissToast(); }}
                className="flex-1 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-semibold py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
              >
                View Student
              </button>
              <button
                onClick={dismissToast}
                className="flex-1 bg-[#1a1d24] border border-[#2d3139] text-[#6b7280] hover:text-white text-xs font-semibold py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Sessions', value: sessions.length, icon: 'ri-user-line', color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { label: 'High Risk', value: highRiskCount, icon: 'ri-alert-line', color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Medium Risk', value: mediumRiskCount, icon: 'ri-error-warning-line', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Risk Score', value: avgRisk, icon: 'ri-radar-line', color: 'text-white', bg: 'bg-[#1a1d24]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111318] border border-[#1e2330] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${stat.bg} flex-shrink-0`}>
              <i className={`${stat.icon} ${stat.color} text-lg`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[#6b7280] text-xs">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <i className="ri-loader-4-line text-teal-400 text-2xl" />
          </div>
          <p className="text-[#6b7280] mt-2">Loading sessions...</p>
        </div>
      )}

      {!loading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main monitoring grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              {(['all', 'high', 'medium', 'low'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filter === f ? 'bg-teal-500 text-white' : 'bg-[#111318] border border-[#1e2330] text-[#6b7280] hover:text-white'}`}
                >
                  {f === 'all' ? `All (${sessions.length})` : f === 'high' ? `High Risk (${highRiskCount})` : f === 'medium' ? `Medium (${mediumRiskCount})` : 'Low Risk'}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredSessions.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-[#6b7280]">
                  No sessions found with selected filter
                </div>
              ) : (
                filteredSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => setSelectedStudent(selectedStudent === session._id ? null : session._id)}
                    className={`bg-[#111318] border transition-all cursor-pointer rounded-xl p-4 ${
                      selectedStudent === session._id ? 'border-teal-500/50' : 'border-[#1e2330] hover:border-[#2d3139]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">{session.student?.firstName} {session.student?.lastName}</div>
                        <div className="text-[#6b7280] text-xs">{session.student?.email}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.avgRisk >= 70 ? 'bg-red-500/20 text-red-400' : 
                        session.avgRisk >= 40 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {session.avgRisk}%
                      </div>
                    </div>
                    {/* Exam info */}
                    <div className="mb-3 pb-3 border-b border-[#1e2330]">
                      <div className="text-xs font-semibold text-teal-400 mb-1">📚 Exam</div>
                      <div className="text-white text-xs font-medium">
                        {typeof session.exam === 'object' ? (session.exam.title || session.exam.name || 'N/A') : session.exam || 'N/A'}
                      </div>
                    </div>
                    {/* Session metrics */}
                    <div className="text-xs text-[#6b7280] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <span className={`font-semibold ${
                          session.status === 'submitted' ? 'text-emerald-400' :
                          session.status === 'in_progress' ? 'text-teal-400' :
                          session.status === 'completed' ? 'text-blue-400' :
                          'text-[#6b7280]'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      {session.startTime && (
                        <div className="flex items-center justify-between">
                          <span>Started:</span>
                          <span className="text-white text-xs">
                            {new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {session.duration && (
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <span className="text-white text-xs">{session.duration} mins</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Alerts:</span>
                        <span className="text-white font-semibold">{session.alertsCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>High Risk Events:</span>
                        <span className="text-red-400 font-semibold">{session.highRiskCount}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-1 flex gap-1">
              {([
                { key: 'leaderboard', label: 'Leaderboard', icon: 'ri-bar-chart-grouped-line' },
                { key: 'trend', label: 'Trend', icon: 'ri-line-chart-line' },
                { key: 'events', label: 'Events', icon: 'ri-alarm-warning-line' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setRightTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${rightTab === tab.key ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-white'}`}
                >
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <i className={`${tab.icon} text-xs`} />
                  </div>
                  {tab.label}
                </button>
              ))}
            </div>

            {rightTab === 'leaderboard' && (
              <RiskLeaderboard
                sessions={sessions}
                riskScores={riskScores}
                onSelect={(id) => setSelectedStudent(selectedStudent === id ? null : id)}
                selectedId={selectedStudent}
              />
            )}
            {rightTab === 'trend' && <RiskTrendChart riskScores={riskScores} students={sessions} />}
            {rightTab === 'events' && <EventTimeline alerts={notifications.slice(0, 8)} />}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
