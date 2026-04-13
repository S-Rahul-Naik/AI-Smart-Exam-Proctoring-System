import { useState } from 'react';
import { mockAnalytics } from '../../../../mocks/analytics';

interface QuestionFlag {
  qNum: number;
  reason: string;
  flaggedAt: string;
}

const VIOLATION_TYPES = [
  { key: 'gazeViolations',  label: 'Gaze',   icon: 'ri-eye-off-line',       color: '#f59e0b' },
  { key: 'faceViolations',  label: 'Face',   icon: 'ri-user-unfollow-line', color: '#ef4444' },
  { key: 'focusViolations', label: 'Focus',  icon: 'ri-focus-mode',         color: '#f97316' },
  { key: 'phoneViolations', label: 'Phone',  icon: 'ri-smartphone-line',    color: '#dc2626' },
] as const;

type SortKey = 'qNum' | 'totalViolations' | 'avgRisk';
type FilterMode = 'all' | 'flagged' | 'high';

interface Props {
  examName: string;
  onClose: () => void;
}

export default function QuestionIntegrityList({ examName, onClose }: Props) {
  const data = mockAnalytics.questionHeatmap;
  const [flags, setFlags] = useState<Record<number, QuestionFlag>>({});
  const [flagging, setFlagging] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('qNum');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [flagSaved, setFlagSaved] = useState<number | null>(null);

  const maxTotal = Math.max(...data.map(q => q.totalViolations));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  function handleFlag(qNum: number) {
    if (!flagReason.trim()) return;
    const flag: QuestionFlag = {
      qNum,
      reason: flagReason.trim(),
      flaggedAt: new Date().toLocaleTimeString(),
    };
    setFlags(prev => ({ ...prev, [qNum]: flag }));
    setFlagging(null);
    setFlagReason('');
    setFlagSaved(qNum);
    setTimeout(() => setFlagSaved(null), 2000);
  }

  function removeFlag(qNum: number) {
    setFlags(prev => { const next = { ...prev }; delete next[qNum]; return next; });
  }

  const filtered = data.filter(q => {
    if (filter === 'flagged') return !!flags[q.qNum];
    if (filter === 'high') return q.avgRisk >= 60;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    return sortAsc ? va - vb : vb - va;
  });

  function getBarColor(pct: number) {
    if (pct > 0.75) return '#ef4444';
    if (pct > 0.5) return '#f97316';
    if (pct > 0.25) return '#f59e0b';
    return '#10b981';
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#0d0f14] border border-[#1e2330] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2330] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-teal-500/10">
              <i className="ri-list-check-3 text-teal-400 text-base" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Question Integrity Review</h2>
              <p className="text-[#4b5563] text-xs">{examName} · {data.length} questions · {Object.keys(flags).length} flagged</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4b5563] hover:text-white cursor-pointer">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1e2330] flex-shrink-0 flex-wrap">
          {/* Filter */}
          <div className="flex items-center gap-1 bg-[#111318] rounded-lg p-1">
            {(['all', 'high', 'flagged'] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${filter === f ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-[#9ca3af]'}`}
              >
                {f === 'all' ? `All (${data.length})` : f === 'high' ? `High Risk (${data.filter(q => q.avgRisk >= 60).length})` : `Flagged (${Object.keys(flags).length})`}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-[#6b7280]">
            <span>Sort by:</span>
            {([['qNum', 'Question #'], ['totalViolations', 'Violations'], ['avgRisk', 'Risk Score']] as [SortKey, string][]).map(([k, l]) => (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-all border ${sortKey === k ? 'border-teal-500/40 text-teal-400 bg-teal-500/5' : 'border-[#2d3139] text-[#6b7280] hover:text-[#9ca3af]'}`}
              >
                {l}
                {sortKey === k && <i className={`${sortAsc ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {sorted.map(q => {
            const isFlagged = !!flags[q.qNum];
            const isExpanded = expanded === q.qNum;
            const pct = q.totalViolations / maxTotal;
            const barColor = getBarColor(pct);
            const highRisk = q.avgRisk >= 60;

            return (
              <div key={q.qNum}
                className={`border rounded-xl transition-all ${
                  isFlagged ? 'border-amber-500/40 bg-amber-500/5' :
                  highRisk ? 'border-red-500/20 bg-red-500/5' :
                  'border-[#1e2330] bg-[#111318]'
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : q.qNum)}>
                  {/* Q number */}
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-sm border ${
                    isFlagged ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                    highRisk ? 'bg-red-500/15 border-red-500/30 text-red-400' :
                    'bg-[#1a1d24] border-[#2d3139] text-[#6b7280]'
                  }`}>
                    {q.qNum}
                  </div>

                  {/* Topic & time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-semibold truncate">{q.topic}</span>
                      {isFlagged && (
                        <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <i className="ri-flag-fill text-xs" />Flagged
                        </span>
                      )}
                      {highRisk && !isFlagged && (
                        <span className="flex items-center gap-1 bg-red-500/15 text-red-400 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <i className="ri-alarm-warning-line text-xs" />High Risk
                        </span>
                      )}
                      {flagSaved === q.qNum && (
                        <span className="text-emerald-400 text-xs">
                          <i className="ri-checkbox-circle-line mr-0.5" />Flagged!
                        </span>
                      )}
                    </div>
                    <div className="text-[#4b5563] text-xs">Minutes {q.minuteStart}–{q.minuteEnd} · {q.minuteEnd - q.minuteStart} min window</div>
                  </div>

                  {/* Violation spike bar */}
                  <div className="w-32 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#4b5563] text-xs">{q.totalViolations} violations</span>
                    </div>
                    <div className="h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(pct * 100).toFixed(0)}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>

                  {/* Risk score */}
                  <div className="w-14 text-right flex-shrink-0">
                    <div className={`text-xl font-black ${q.avgRisk >= 60 ? 'text-red-400' : q.avgRisk >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {q.avgRisk}
                    </div>
                    <div className="text-[#4b5563] text-xs">risk</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {!isFlagged ? (
                      <button
                        onClick={() => { setFlagging(q.qNum); setFlagReason(''); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 px-2.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-flag-line text-sm" />
                        </div>
                        Flag
                      </button>
                    ) : (
                      <button
                        onClick={() => removeFlag(q.qNum)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] border border-[#2d3139] hover:border-red-500/30 hover:text-red-400 px-2.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-flag-fill text-sm" />
                        </div>
                        Unflag
                      </button>
                    )}
                    <div className="w-5 h-5 flex items-center justify-center text-[#4b5563]">
                      <i className={`${isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-base`} />
                    </div>
                  </div>
                </div>

                {/* Expanded breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#1e2330]">
                    <div className="pt-4 grid grid-cols-4 gap-3">
                      {VIOLATION_TYPES.map(vt => {
                        const val = q[vt.key];
                        return (
                          <div key={vt.key} className="rounded-xl p-3 text-center" style={{ backgroundColor: `${vt.color}12`, border: `1px solid ${vt.color}20` }}>
                            <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1.5">
                              <i className={`${vt.icon} text-sm`} style={{ color: vt.color }} />
                            </div>
                            <div className="text-xl font-black" style={{ color: vt.color }}>{val}</div>
                            <div className="text-[#6b7280] text-xs">{vt.label}</div>
                          </div>
                        );
                      })}
                    </div>
                    {isFlagged && flags[q.qNum] && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-flag-fill text-amber-400 text-sm" />
                        </div>
                        <div>
                          <div className="text-amber-300 text-xs font-semibold">Flagged at {flags[q.qNum].flaggedAt}</div>
                          <div className="text-[#9ca3af] text-xs mt-0.5">{flags[q.qNum].reason}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Flag reason input */}
                {flagging === q.qNum && (
                  <div className="px-4 pb-4 border-t border-[#1e2330]" onClick={e => e.stopPropagation()}>
                    <div className="pt-4">
                      <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                        Flag reason for Q{q.qNum} — {q.topic}
                      </label>
                      <textarea
                        rows={2}
                        value={flagReason}
                        onChange={e => setFlagReason(e.target.value)}
                        placeholder="e.g., Unusually high phone detection rate — possible unauthorized resource access during this window..."
                        maxLength={500}
                        autoFocus
                        className="w-full bg-[#0a0c10] border border-amber-500/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-amber-500/50 resize-none"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => { setFlagging(null); setFlagReason(''); }}
                          className="text-xs text-[#6b7280] hover:text-white cursor-pointer whitespace-nowrap"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleFlag(q.qNum)}
                          disabled={!flagReason.trim()}
                          className="ml-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                        >
                          <i className="ri-flag-fill mr-1" />Submit Flag
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        <div className="flex items-center gap-4 px-6 py-4 border-t border-[#1e2330] flex-shrink-0">
          <div className="flex items-center gap-4 text-xs text-[#6b7280]">
            <span><strong className="text-white">{data.length}</strong> questions total</span>
            <span><strong className="text-red-400">{data.filter(q => q.avgRisk >= 60).length}</strong> high risk</span>
            <span><strong className="text-amber-400">{Object.keys(flags).length}</strong> flagged for review</span>
          </div>
          <button onClick={onClose} className="ml-auto bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
