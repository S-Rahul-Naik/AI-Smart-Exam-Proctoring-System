import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import RiskBadge from '../../../components/base/RiskBadge';
import StatusBadge from '../../../components/base/StatusBadge';
import { adminAPI } from '../../../services/api';
import SessionPDFExport from './components/SessionPDFExport';
import SessionReplay from './components/SessionReplay';
import BatchReviewPanel, { BulkDecision } from './components/BatchReviewPanel';

type DetailTab = 'timeline' | 'replay';
type SessionStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const ADMIN_SESSIONS_UPDATED_EVENT = 'admin:sessions-updated';

interface SessionDecision {
  id: string;
  status: SessionStatus;
  note?: string;
}

interface UISession {
  id: string;
  student: string;
  exam: string;
  date: string;
  examScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: SessionStatus;
}

interface UIAlert {
  id: string;
  timestamp: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskContribution: number;
  snapshot?: string;
}

function isLipMovementEvent(event: { type?: string; label?: string; description?: string }): boolean {
  const raw = `${event?.type || ''} ${event?.label || ''} ${event?.description || ''}`.toLowerCase();
  return raw.includes('lip_movement') || raw.includes('lip movement');
}

const severityRiskMap = {
  low: 3,
  medium: 8,
  high: 15,
  critical: 20,
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

function isMongoObjectId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}

function normalizeSnapshotUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;
  // Legacy placeholder URLs from older sessions are not real files.
  if (trimmed.startsWith('local-')) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
  return `${API_ORIGIN}/${trimmed}`;
}

function normalizeRiskLevel(level: unknown, score: number): RiskLevel {
  if (level === 'critical' || score >= 85) return 'critical';
  if (level === 'high' || score >= 70) return 'high';
  if (level === 'medium' || score >= 40) return 'medium';
  return 'low';
}

function toUiStatus(session: any): SessionStatus {
  if (session?.adminReview?.reviewed) {
    const decision = session?.adminReview?.decision;
    if (decision === 'approved') return 'approved';
    if (decision === 'rejected') return 'rejected';
    if (decision === 'needs_manual_review' || session?.flagged) return 'flagged';
  }

  if (session?.flagged) return 'pending';
  if (session?.status === 'flagged') return 'pending';
  return 'pending';
}

function mapSessionToUi(session: any): UISession {
  const fullName = `${session?.student?.firstName || ''} ${session?.student?.lastName || ''}`.trim();
  const email = String(session?.student?.email || '').trim();
  const emailLocal = email.includes('@') ? email.split('@')[0] : email;
  const studentName = fullName || emailLocal || 'Student';

  const examRaw = String(session?.exam?.title || session?.exam?.subject || session?.exam || '').trim();
  const examName = !examRaw || isMongoObjectId(examRaw) ? 'Exam Session' : examRaw;
  const riskScore = Number(session?.riskScore || 0);
  const examScore = Number(session?.examScore?.percentage ?? session?.score ?? 0);
  const date = new Date(session?.createdAt || session?.startTime || Date.now()).toLocaleDateString();

  return {
    id: String(session?._id),
    student: studentName,
    exam: examName,
    date,
    examScore,
    riskScore,
    riskLevel: normalizeRiskLevel(session?.riskLevel, riskScore),
    status: toUiStatus(session),
  };
}

function mapResultSessionToUi(row: any): UISession {
  const riskScore = Number(row?.riskScore || 0);
  const rawStatus = String(row?.status || 'pending') as SessionStatus;
  const status: SessionStatus = ['pending', 'approved', 'rejected', 'flagged'].includes(rawStatus)
    ? rawStatus
    : 'pending';

  let date = 'N/A';
  if (row?.date) {
    const parsed = new Date(row.date);
    date = Number.isNaN(parsed.getTime()) ? String(row.date) : parsed.toLocaleDateString();
  }

  return {
    id: String(row?.id || row?._id || ''),
    student: String(row?.student || 'Student'),
    exam: String(row?.exam || 'Exam Session'),
    date,
    examScore: Number(row?.examScore || 0),
    riskScore,
    riskLevel: normalizeRiskLevel(row?.riskLevel, riskScore),
    status,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0)?.toUpperCase() || 'S';
  const last = parts[1]?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<UISession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('timeline');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<Record<string, SessionDecision>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warn' | 'error' } | null>(null);
  const [studentAlerts, setStudentAlerts] = useState<UIAlert[]>([]);

  const selected = useMemo(
    () => sessions.find((session) => session.id === selectedId) || sessions[0] || null,
    [sessions, selectedId]
  );

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resultRes = await adminAPI.getResultSessions();
      const allRows = resultRes?.data?.sessions || [];

      const nextSessions = allRows
        .map((row: any) => mapResultSessionToUi(row))
        .sort((a: UISession, b: UISession) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();
          if (!Number.isNaN(aDate) && !Number.isNaN(bDate) && aDate !== bDate) {
            return bDate - aDate;
          }
          return b.riskScore - a.riskScore;
        });

      setSessions(nextSessions);
      setSelectedId((prev) => (prev && nextSessions.some((session) => session.id === prev) ? prev : nextSessions[0]?.id || null));
    } catch (fetchError: any) {
      setError(fetchError?.response?.data?.error || 'Failed to load sessions');
      setSessions([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const fetchSelectedDetails = async () => {
      if (!selected?.id) {
        setStudentAlerts([]);
        return;
      }

      try {
        setDetailLoading(true);
        const [reportRes, analysisRes] = await Promise.all([
          adminAPI.getMalpracticeReport(selected.id),
          adminAPI.getSessionAnalysis(selected.id),
        ]);

        const reportEvents = reportRes?.data?.report?.eventLog || [];
        const snapshots = analysisRes?.data?.analysis?.evidence?.snapshots || [];

        const mappedAlerts = reportEvents
          .filter((event: any) => !isLipMovementEvent(event))
          .map((event: any, index: number) => {
          const severity = ['low', 'medium', 'high', 'critical'].includes(event?.severity)
            ? (event.severity as UIAlert['severity'])
            : 'medium';
          const eventTime = event?.timestamp ? new Date(event.timestamp) : null;
          const snapshot = snapshots.find((s: any) => {
            if (!eventTime || !s?.timestamp) return false;
            const diff = Math.abs(new Date(s.timestamp).getTime() - eventTime.getTime());
            return diff <= 120000;
          });

          const snapshotUrl = normalizeSnapshotUrl(event?.snapshotUrl || snapshot?.url);

          return {
            id: `${selected.id}-${index}`,
            timestamp: eventTime ? eventTime.toLocaleTimeString() : 'N/A',
            description: event?.label || event?.type || 'Suspicious event',
            severity,
            riskContribution: severityRiskMap[severity] || 8,
            snapshot: snapshotUrl,
          };
        });

        setStudentAlerts(mappedAlerts);
      } catch {
        setStudentAlerts([]);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchSelectedDetails();
  }, [selected?.id]);

  function showToast(msg: string, type: 'success' | 'warn' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getEffectiveStatus(session: UISession): SessionStatus {
    return (decisions[session.id]?.status as SessionStatus) ?? (session.status as SessionStatus);
  }

  function toggleCheck(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setCheckedIds(new Set(sessions.map(s => s.id)));
  }

  function clearAll() {
    setCheckedIds(new Set());
  }

  function applyDecision(id: string, status: SessionStatus, note?: string) {
    setDecisions(prev => ({ ...prev, [id]: { id, status, note } }));
  }

  async function handleBulkDecision(decision: BulkDecision, note: string) {
    const statusMap: Record<BulkDecision, SessionStatus> = { approve: 'approved', reject: 'rejected', flag: 'flagged' };
    const status = statusMap[decision];

    const targets = sessions.filter((session) => checkedIds.has(session.id));
    const results = await Promise.allSettled(
      targets.map((session) => {
        if (decision === 'flag') {
          return adminAPI.flagSessionForReview(session.id, {
            reason: 'Bulk admin review flag',
            severity: 'high',
            notes: note,
          });
        }

        return adminAPI.reviewSession(session.id, {
          sessionId: session.id,
          decision: decision === 'approve' ? 'approved' : 'rejected',
          notes: note,
        } as any);
      })
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    targets.forEach((session) => applyDecision(session.id, status, note || undefined));

    await fetchSessions();
    window.dispatchEvent(new Event(ADMIN_SESSIONS_UPDATED_EVENT));

    const label = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'flagged';
    const toastType = decision === 'approve' ? 'success' : decision === 'reject' ? 'error' : 'warn';
    showToast(`${successCount} session${successCount > 1 ? 's' : ''} ${label}`, toastType);
    setCheckedIds(new Set());
  }

  async function handleSingleDecision(status: SessionStatus) {
    if (!selected) return;

    try {
      if (status === 'flagged') {
        await adminAPI.flagSessionForReview(selected.id, {
          reason: 'Manual admin review flag',
          severity: 'high',
          notes: '',
        });
      } else {
        await adminAPI.reviewSession(selected.id, {
          sessionId: selected.id,
          decision: status === 'approved' ? 'approved' : 'rejected',
          notes: '',
        } as any);
      }

      await fetchSessions();
      window.dispatchEvent(new Event(ADMIN_SESSIONS_UPDATED_EVENT));
    } catch {
      showToast('Failed to save decision', 'error');
      return;
    }

    applyDecision(selected.id, status);
    const label = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'flagged for review';
    const toastType = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warn';
    showToast(`Session ${label}`, toastType);
  }

  const pendingCount = sessions.filter(s => getEffectiveStatus(s) === 'pending').length;

  return (
    <AdminLayout title="Session Review & Evidence" subtitle="Review behavioral evidence and exam sessions">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
          'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <div className="w-4 h-4 flex items-center justify-center">
            <i className={`${toast.type === 'success' ? 'ri-checkbox-circle-line' : toast.type === 'error' ? 'ri-close-circle-line' : 'ri-flag-line'} text-base`} />
          </div>
          {toast.msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Session list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide">Recent Sessions</h3>
            {pendingCount > 0 && (
              <span className="bg-amber-500/15 text-amber-400 text-xs px-2 py-0.5 rounded-full font-semibold">{pendingCount} pending</span>
            )}
          </div>

          {/* Batch review panel */}
          <BatchReviewPanel
            selectedIds={Array.from(checkedIds)}
            total={sessions.length}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            onBulkDecision={handleBulkDecision}
          />

          {loading && (
            <div className="p-4 bg-[#111318] border border-[#1e2330] rounded-xl text-sm text-[#6b7280]">Loading sessions...</div>
          )}

          {!loading && error && (
            <div className="p-4 bg-[#111318] border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="p-4 bg-[#111318] border border-[#1e2330] rounded-xl text-sm text-[#6b7280]">No sessions available for review.</div>
          )}

          {sessions.map(session => {
            const effectiveStatus = getEffectiveStatus(session);
            const isChecked = checkedIds.has(session.id);
            return (
              <div
                key={session.id}
                onClick={() => { setSelectedId(session.id); setDetailTab('timeline'); }}
                className={`p-4 bg-[#111318] border rounded-xl cursor-pointer transition-all ${
                  selected?.id === session.id ? 'border-teal-500/50 bg-teal-500/5' :
                  isChecked ? 'border-teal-500/30 bg-teal-500/3' :
                  'border-[#1e2330] hover:border-[#2d3139]'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  {/* Checkbox */}
                  <div
                    onClick={(e) => toggleCheck(session.id, e)}
                    className={`mt-0.5 w-4 h-4 flex-shrink-0 flex items-center justify-center rounded border transition-all cursor-pointer ${
                      isChecked ? 'bg-teal-500 border-teal-500' : 'border-[#374151] hover:border-teal-500/50'
                    }`}
                  >
                    {isChecked && <i className="ri-check-line text-white text-xs leading-none" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="text-white text-sm font-semibold">{session.student}</div>
                        <div className="text-[#4b5563] text-xs">{session.exam}</div>
                      </div>
                      <StatusBadge status={effectiveStatus} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#6b7280]">Score: <strong className="text-white">{session.examScore}%</strong></span>
                      <RiskBadge score={session.riskScore} level={session.riskLevel} />
                    </div>
                  </div>
                </div>

                {/* Decision override badge */}
                {decisions[session.id] && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                      <i className={`${decisions[session.id].status === 'approved' ? 'ri-checkbox-circle-line text-emerald-400' : decisions[session.id].status === 'rejected' ? 'ri-close-circle-line text-red-400' : 'ri-flag-line text-amber-400'} text-xs`} />
                    </div>
                    <span className={`font-semibold ${decisions[session.id].status === 'approved' ? 'text-emerald-400' : decisions[session.id].status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                      Decision recorded
                    </span>
                    {decisions[session.id].note && (
                      <span className="text-[#374151] truncate">— {decisions[session.id].note?.slice(0, 30)}…</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-5">
          {!selected && !loading && (
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6 text-[#6b7280] text-sm">
              Select a session to view evidence and review details.
            </div>
          )}

          {selected && (
            <>
          {/* Student summary */}
          <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xl font-bold flex items-center justify-center">
                {getInitials(selected.student)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-white font-bold text-lg">{selected.student}</h2>
                    <p className="text-[#6b7280] text-sm">{selected.exam} · {selected.date}</p>
                  </div>
                  <SessionPDFExport session={selected} alerts={studentAlerts} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-black text-emerald-400">{selected.examScore}%</div>
                    <div className="text-xs text-[#6b7280]">Exam Score</div>
                  </div>
                  <div className={`${selected.riskLevel === 'high' || selected.riskLevel === 'critical' ? 'bg-red-500/10 border-red-500/20' : selected.riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-lg p-3 text-center`}>
                    <div className={`text-2xl font-black ${selected.riskLevel === 'high' || selected.riskLevel === 'critical' ? 'text-red-400' : selected.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{selected.riskScore}</div>
                    <div className="text-xs text-[#6b7280]">Risk Score</div>
                  </div>
                  <div className="bg-[#1a1d24] border border-[#2d3139] rounded-lg p-3 text-center">
                    <div className="text-2xl font-black text-white">{detailLoading ? '...' : studentAlerts.length}</div>
                    <div className="text-xs text-[#6b7280]">Events</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-[#111318] border border-[#1e2330] rounded-xl p-1 gap-1">
            {([
              { id: 'timeline', label: 'Event Timeline', icon: 'ri-list-check' },
              { id: 'replay',   label: 'Session Replay', icon: 'ri-play-circle-line' },
            ] as { id: DetailTab; label: string; icon: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap transition-all ${detailTab === tab.id ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-[#9ca3af]'}`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${tab.icon} text-sm`} />
                </div>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Event timeline tab */}
          {detailTab === 'timeline' && (
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Event Timeline</h3>
              {detailLoading && (
                <div className="text-center py-8 text-[#4b5563]">
                  <span className="text-sm">Loading event evidence...</span>
                </div>
              )}
              {!detailLoading && studentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {studentAlerts.map((alert, i) => (
                    <div key={alert.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${alert.severity === 'high' || alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                          <i className={`ri-alert-line text-sm ${alert.severity === 'high' || alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                        </div>
                        {i < studentAlerts.length - 1 && <div className="w-px flex-1 bg-[#1e2330] mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-white text-sm font-semibold">{alert.description}</div>
                            <div className="text-[#4b5563] text-xs mt-0.5">{alert.timestamp} · +{alert.riskContribution} risk</div>
                          </div>
                          {alert.snapshot && (
                            <img
                              src={alert.snapshot}
                              alt="evidence"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="56"><rect width="100%" height="100%" fill="%23111a24"/><text x="50%" y="50%" fill="%236b7280" font-size="10" text-anchor="middle" dominant-baseline="middle">no image</text></svg>';
                              }}
                              className="w-24 h-14 object-cover object-top rounded-lg flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !detailLoading ? (
                <div className="text-center py-8 text-[#4b5563]">
                  <i className="ri-checkbox-circle-line text-2xl mb-2 block text-emerald-500/40" />
                  <span className="text-sm">No behavioral events recorded</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Session replay tab */}
          {detailTab === 'replay' && (
            <SessionReplay session={selected} alerts={studentAlerts} />
          )}

          {/* Decision buttons */}
          {getEffectiveStatus(selected) === 'pending' && (
            <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3">Admin Decision</h3>
              <p className="text-[#6b7280] text-xs mb-4">Review the session evidence and make a final decision on this candidate&apos;s results.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSingleDecision('approved')}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-semibold py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-checkbox-circle-line mr-1.5" />Approve
                </button>
                <button
                  onClick={() => handleSingleDecision('flagged')}
                  className="flex-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-semibold py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-flag-line mr-1.5" />Flag for Review
                </button>
                <button
                  onClick={() => handleSingleDecision('rejected')}
                  className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-close-circle-line mr-1.5" />Reject
                </button>
              </div>
            </div>
          )}

          {/* Already decided state */}
          {getEffectiveStatus(selected) !== 'pending' && decisions[selected.id] && (
            <div className={`border rounded-xl p-4 flex items-center gap-3 ${
              decisions[selected.id].status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' :
              decisions[selected.id].status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
              'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${
                decisions[selected.id].status === 'approved' ? 'bg-emerald-500/15' :
                decisions[selected.id].status === 'rejected' ? 'bg-red-500/15' : 'bg-amber-500/15'
              }`}>
                <i className={`text-sm ${
                  decisions[selected.id].status === 'approved' ? 'ri-checkbox-circle-fill text-emerald-400' :
                  decisions[selected.id].status === 'rejected' ? 'ri-close-circle-fill text-red-400' :
                  'ri-flag-fill text-amber-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-bold capitalize ${
                  decisions[selected.id].status === 'approved' ? 'text-emerald-400' :
                  decisions[selected.id].status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  Session {decisions[selected.id].status}
                </div>
                {decisions[selected.id].note && (
                  <div className="text-[#6b7280] text-xs mt-0.5">{decisions[selected.id].note}</div>
                )}
              </div>
              <button
                onClick={() => { setDecisions(prev => { const n = { ...prev }; delete n[selected.id]; return n; }); }}
                className="text-xs text-[#4b5563] hover:text-[#9ca3af] cursor-pointer whitespace-nowrap underline underline-offset-2"
              >
                Undo
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
