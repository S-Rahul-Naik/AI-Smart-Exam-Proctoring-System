import { useState } from 'react';

export interface QuestionViolationData {
  qNum: number;
  topic: string;
  minuteStart: number;
  minuteEnd: number;
  gazeViolations: number;
  faceViolations: number;
  focusViolations: number;
  phoneViolations: number;
  avgRisk: number;
  totalViolations: number;
}

const VIOLATION_TYPES = [
  { key: 'gazeViolations',  label: 'Gaze Deviation', color: '#f59e0b', icon: 'ri-eye-off-line' },
  { key: 'faceViolations',  label: 'Face Absent',    color: '#ef4444', icon: 'ri-user-unfollow-line' },
  { key: 'focusViolations', label: 'Focus / Tab',    color: '#f97316', icon: 'ri-focus-mode' },
  { key: 'phoneViolations', label: 'Phone / Device', color: '#dc2626', icon: 'ri-smartphone-line' },
] as const;

type ViolationKey = (typeof VIOLATION_TYPES)[number]['key'];

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return '#1a1d24';
  const pct = value / max;
  if (pct > 0.75) return '#dc2626';
  if (pct > 0.5)  return '#ea580c';
  if (pct > 0.25) return '#d97706';
  return '#ca8a04';
}

function getTextColor(bg: string): string {
  return bg === '#1a1d24' ? '#374151' : '#ffffff';
}

interface Props {
  data: QuestionViolationData[];
}

export default function QuestionHeatmap({ data }: Props) {
  const [hoveredCell, setHoveredCell] = useState<{ q: QuestionViolationData; type: ViolationKey } | null>(null);
  const [activeType, setActiveType] = useState<ViolationKey | 'total'>('total');

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-white font-semibold text-sm">Question Violation Heatmap</h3>
            <p className="text-[#4b5563] text-xs mt-0.5">Which questions triggered the most behavioral violations</p>
          </div>
        </div>
        <div className="text-[#6b7280] text-sm py-6">No live question-level violation data available yet.</div>
      </div>
    );
  }

  const maxValues = VIOLATION_TYPES.reduce((acc, vt) => {
    acc[vt.key] = Math.max(...data.map(q => q[vt.key]));
    return acc;
  }, {} as Record<ViolationKey, number>);
  const maxTotal = Math.max(...data.map(q => q.totalViolations));

  const getCellValue = (q: QuestionViolationData, type: ViolationKey | 'total') =>
    type === 'total' ? q.totalViolations : q[type];

  const getCellMax = (type: ViolationKey | 'total') =>
    type === 'total' ? maxTotal : maxValues[type as ViolationKey];

  return (
    <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-white font-semibold text-sm">Question Violation Heatmap</h3>
          <p className="text-[#4b5563] text-xs mt-0.5">Which questions triggered the most behavioral violations</p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#0a0c10] rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => setActiveType('total')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${activeType === 'total' ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-[#9ca3af]'}`}
          >
            All
          </button>
          {VIOLATION_TYPES.map(vt => (
            <button
              key={vt.key}
              onClick={() => setActiveType(vt.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${activeType === vt.key ? 'text-white' : 'text-[#6b7280] hover:text-[#9ca3af]'}`}
              style={activeType === vt.key ? { backgroundColor: vt.color } : {}}
              title={vt.label}
            >
              <i className={`${vt.icon}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap grid — rows = violation types, cols = questions */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${data.length * 62 + 100}px` }}>
          {/* Column headers (question labels) */}
          <div className="flex ml-24 mb-1 gap-1">
            {data.map(q => (
              <div key={q.qNum} className="w-14 flex-shrink-0 text-center">
                <div className="text-[#6b7280] text-xs font-semibold">Q{q.qNum}</div>
                <div className="text-[#374151] text-[9px] leading-tight truncate" title={q.topic}>{q.topic.split(' ')[0]}</div>
              </div>
            ))}
          </div>

          {/* Rows per violation type */}
          {activeType === 'total' ? (
            VIOLATION_TYPES.map(vt => (
              <div key={vt.key} className="flex items-center gap-1 mb-1.5">
                {/* Row label */}
                <div className="w-24 flex-shrink-0 flex items-center gap-1.5 pr-2">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <i className={`${vt.icon} text-xs`} style={{ color: vt.color }} />
                  </div>
                  <span className="text-[#6b7280] text-xs truncate">{vt.label.split(' ')[0]}</span>
                </div>
                {/* Cells */}
                {data.map(q => {
                  const val = q[vt.key];
                  const maxV = maxValues[vt.key];
                  const bg = getHeatColor(val, maxV);
                  const tc = getTextColor(bg);
                  return (
                    <div
                      key={q.qNum}
                      className="w-14 h-10 flex-shrink-0 flex items-center justify-center rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-white/20 relative"
                      style={{ backgroundColor: bg }}
                      onMouseEnter={() => setHoveredCell({ q, type: vt.key })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <span className="text-xs font-bold" style={{ color: tc }}>{val > 0 ? val : ''}</span>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-24 flex-shrink-0 flex items-center gap-1.5 pr-2">
                {(() => {
                  const vt = VIOLATION_TYPES.find(v => v.key === activeType);
                  if (!vt) return null;
                  return (
                    <>
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <i className={`${vt.icon} text-xs`} style={{ color: vt.color }} />
                      </div>
                      <span className="text-[#6b7280] text-xs truncate">{vt.label}</span>
                    </>
                  );
                })()}
              </div>
              {data.map(q => {
                const val = getCellValue(q, activeType);
                const maxV = getCellMax(activeType);
                const bg = getHeatColor(val, maxV);
                const tc = getTextColor(bg);
                return (
                  <div
                    key={q.qNum}
                    className="w-14 h-10 flex-shrink-0 flex items-center justify-center rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-white/20"
                    style={{ backgroundColor: bg }}
                    onMouseEnter={() => setHoveredCell({ q, type: activeType as ViolationKey })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span className="text-xs font-bold" style={{ color: tc }}>{val > 0 ? val : ''}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total row */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#1e2330]">
            <div className="w-24 flex-shrink-0 text-xs font-bold text-[#9ca3af] pr-2">Total</div>
            {data.map(q => (
              <div
                key={q.qNum}
                className="w-14 h-9 flex-shrink-0 flex flex-col items-center justify-center rounded-lg"
                style={{ backgroundColor: getHeatColor(q.totalViolations, maxTotal) }}
              >
                <span className="text-xs font-black" style={{ color: getTextColor(getHeatColor(q.totalViolations, maxTotal)) }}>
                  {q.totalViolations}
                </span>
              </div>
            ))}
          </div>

          {/* Time row */}
          <div className="flex items-center gap-1 mt-1.5">
            <div className="w-24 flex-shrink-0 text-xs text-[#374151] pr-2">Time</div>
            {data.map(q => (
              <div key={q.qNum} className="w-14 flex-shrink-0 text-center">
                <span className="text-[#374151] text-[10px]">{q.minuteStart}–{q.minuteEnd}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip panel */}
      {hoveredCell && (
        <div className="mt-4 p-4 bg-[#0a0c10] border border-[#2d3139] rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-white font-bold text-sm">Q{hoveredCell.q.qNum} — {hoveredCell.q.topic}</div>
              <div className="text-[#4b5563] text-xs mt-0.5">Minutes {hoveredCell.q.minuteStart}–{hoveredCell.q.minuteEnd} of exam</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-amber-400 font-black text-xl">{hoveredCell.q.avgRisk}</div>
              <div className="text-[#4b5563] text-xs">Avg Risk</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {VIOLATION_TYPES.map(vt => (
              <div
                key={vt.key}
                className={`rounded-lg p-2.5 text-center border ${hoveredCell.type === vt.key ? 'border-white/20' : 'border-transparent'}`}
                style={{ backgroundColor: `${vt.color}15` }}
              >
                <div className="text-lg font-black" style={{ color: vt.color }}>{hoveredCell.q[vt.key]}</div>
                <div className="text-[#6b7280] text-xs leading-tight">{vt.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color scale legend */}
      <div className="mt-4 pt-3 border-t border-[#1e2330] flex items-center justify-between">
        <span className="text-[#4b5563] text-xs">Intensity scale</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[#4b5563] text-xs">Low</span>
          {['#ca8a04', '#d97706', '#ea580c', '#dc2626'].map((c, i) => (
            <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[#4b5563] text-xs">High</span>
        </div>
      </div>
    </div>
  );
}
