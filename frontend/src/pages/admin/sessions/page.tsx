import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import RiskBadge from '../../../components/base/RiskBadge';
import StatusBadge from '../../../components/base/StatusBadge';
import { mockAlerts } from '../../../mocks/alerts';
import { mockAnalytics } from '../../../mocks/analytics';
import { mockStudents } from '../../../mocks/students';
import SessionPDFExport from './components/SessionPDFExport';
import SessionReplay from './components/SessionReplay';
import BatchReviewPanel, { BulkDecision } from './components/BatchReviewPanel';

type DetailTab = 'timeline' | 'replay';
type SessionStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

interface SessionDecision {
  id: string;
  status: SessionStatus;
  note?: string;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState(mockAnalytics.recentSessions);
  const [selected, setSelected] = useState(mockAnalytics.recentSessions[0]);
  const [detailTab, setDetailTab] = useState<DetailTab>('timeline');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<Record<string, SessionDecision>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const student = mockStudents.find(s => s.name === selected.student);
  const studentAlerts = mockAlerts.filter(a => {
    if (selected.student === 'Aisha Rahman') return a.studentId === 's001';
    if (selected.student === 'Priya Nair') return a.studentId === 's005';
    if (selected.student === 'Yuki Tanaka') return a.studentId === 's007';
    if (selected.student === 'Omar Al-Farsi') return a.studentId === 's008';
    return false;
  });

  function showToast(msg: string, type: 'success' | 'warn' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getEffectiveStatus(session: typeof sessions[number]): SessionStatus {
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

  function handleBulkDecision(decision: BulkDecision, note: string) {
    const statusMap: Record<BulkDecision, SessionStatus> = { approve: 'approved', reject: 'rejected', flag: 'flagged' };
    const status = statusMap[decision];
    checkedIds.forEach(id => applyDecision(id, status, note || undefined));
    const label = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'flagged';
    const toastType = decision === 'approve' ? 'success' : decision === 'reject' ? 'error' : 'warn';
    showToast(`${checkedIds.size} session${checkedIds.size > 1 ? 's' : ''} ${label}`, toastType);
    setCheckedIds(new Set());
  }

  function handleSingleDecision(status: SessionStatus) {
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

          {sessions.map(session => {
            const effectiveStatus = getEffectiveStatus(session);
            const isChecked = checkedIds.has(session.id);
            return (
              <div
                key={session.id}
                onClick={() => { setSelected(session); setDetailTab('timeline'); }}
                className={`p-4 bg-[#111318] border rounded-xl cursor-pointer transition-all ${
                  selected.id === session.id ? 'border-teal-500/50 bg-teal-500/5' :
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
                      <RiskBadge score={session.riskScore} level={session.riskLevel as 'low' | 'medium' | 'high'} />
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
          {/* Student summary */}
          <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1d24]">
                {student?.avatar && <img src={student.avatar} alt={selected.student} className="w-full h-full object-cover object-top" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-white font-bold text-lg">{selected.student}</h2>
                    <p className="text-[#6b7280] text-sm">{selected.exam} · {selected.date}</p>
                  </div>
                  <SessionPDFExport session={selected} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-black text-emerald-400">{selected.examScore}%</div>
                    <div className="text-xs text-[#6b7280]">Exam Score</div>
                  </div>
                  <div className={`${selected.riskLevel === 'high' ? 'bg-red-500/10 border-red-500/20' : selected.riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-lg p-3 text-center`}>
                    <div className={`text-2xl font-black ${selected.riskLevel === 'high' ? 'text-red-400' : selected.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{selected.riskScore}</div>
                    <div className="text-xs text-[#6b7280]">Risk Score</div>
                  </div>
                  <div className="bg-[#1a1d24] border border-[#2d3139] rounded-lg p-3 text-center">
                    <div className="text-2xl font-black text-white">{studentAlerts.length}</div>
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
              {studentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {studentAlerts.map((alert, i) => (
                    <div key={alert.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${alert.severity === 'high' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                          <i className={`ri-alert-line text-sm ${alert.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
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
                            <img src={alert.snapshot} alt="evidence" className="w-24 h-14 object-cover object-top rounded-lg flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#4b5563]">
                  <i className="ri-checkbox-circle-line text-2xl mb-2 block text-emerald-500/40" />
                  <span className="text-sm">No behavioral events recorded</span>
                </div>
              )}
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
        </div>
      </div>
    </AdminLayout>
  );
}
