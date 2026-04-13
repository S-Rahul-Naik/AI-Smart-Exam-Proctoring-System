import { useState } from 'react';

interface ViolationWeight {
  key: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  defaultWeight: number;
  min: number;
  max: number;
  step: number;
}

const VIOLATION_WEIGHTS: ViolationWeight[] = [
  { key: 'gaze',    label: 'Gaze Deviation',    icon: 'ri-eye-off-line',       color: '#f59e0b', description: 'Student looking away from screen', defaultWeight: 2, min: 1, max: 6, step: 0.5 },
  { key: 'face',    label: 'Face Absent',        icon: 'ri-user-unfollow-line', color: '#ef4444', description: 'No face detected in webcam feed',  defaultWeight: 3, min: 1, max: 8, step: 0.5 },
  { key: 'phone',   label: 'Phone / Device',     icon: 'ri-smartphone-line',    color: '#dc2626', description: 'Secondary device detected',         defaultWeight: 5, min: 1, max: 10, step: 0.5 },
  { key: 'focus',   label: 'Focus / Tab Switch', icon: 'ri-focus-mode',         color: '#f97316', description: 'Tab switch or window blur detected', defaultWeight: 2, min: 1, max: 6, step: 0.5 },
  { key: 'multi',   label: 'Multiple Faces',     icon: 'ri-group-line',         color: '#8b5cf6', description: 'More than one face in frame',        defaultWeight: 4, min: 1, max: 8, step: 0.5 },
];

const PER_EXAM_THRESHOLDS = [
  { id: 'e001', name: 'Advanced Algorithms', courseCode: 'CS401', threshold: 70 },
  { id: 'e002', name: 'Machine Learning Fundamentals', courseCode: 'AI302', threshold: 65 },
  { id: 'e003', name: 'Database Systems & SQL', courseCode: 'CS305', threshold: 75 },
  { id: 'e004', name: 'Network Security & Cryptography', courseCode: 'SEC401', threshold: 60 },
  { id: 'e005', name: 'Statistical Learning & Inference', courseCode: 'DS201', threshold: 70 },
];

export default function RiskThresholdPanel() {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(VIOLATION_WEIGHTS.map(v => [v.key, v.defaultWeight]))
  );
  const [globalThreshold, setGlobalThreshold] = useState(70);
  const [examThresholds, setExamThresholds] = useState<Record<string, number>>(
    Object.fromEntries(PER_EXAM_THRESHOLDS.map(e => [e.id, e.threshold]))
  );
  const [saved, setSaved] = useState(false);
  const [showExamThresholds, setShowExamThresholds] = useState(false);

  function updateWeight(key: string, val: number) {
    setWeights(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function updateExamThreshold(id: string, val: number) {
    setExamThresholds(prev => ({ ...prev, [id]: val }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    setWeights(Object.fromEntries(VIOLATION_WEIGHTS.map(v => [v.key, v.defaultWeight])));
    setGlobalThreshold(70);
    setExamThresholds(Object.fromEntries(PER_EXAM_THRESHOLDS.map(e => [e.id, e.threshold])));
    setSaved(false);
  }

  // Preview: simulated risk score using current weights
  const previewBase = 10;
  const previewGaze = 3;
  const previewFace = 1;
  const previewFocus = 2;
  const previewScore = Math.min(100, Math.round(
    previewBase +
    previewGaze * weights.gaze * 2 +
    previewFace * weights.face * 2 +
    previewFocus * weights.focus * 1.5
  ));
  const previewLevel = previewScore >= globalThreshold ? 'high' : previewScore >= 40 ? 'medium' : 'low';

  return (
    <div className="space-y-5">
      {/* Violation Weight Tuning */}
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-500/10">
            <i className="ri-scales-line text-amber-400 text-base" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Violation Weight Multipliers</h3>
            <p className="text-[#4b5563] text-xs">Adjust how much each violation type contributes to the risk score</p>
          </div>
        </div>

        <div className="space-y-5">
          {VIOLATION_WEIGHTS.map(vw => (
            <div key={vw.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <i className={`${vw.icon} text-sm`} style={{ color: vw.color }} />
                  </div>
                  <span className="text-white text-sm font-semibold">{vw.label}</span>
                  <span className="text-[#4b5563] text-xs">— {vw.description}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-black" style={{ color: vw.color }}>×{weights[vw.key].toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#4b5563] text-xs w-4 text-right flex-shrink-0">×{vw.min}</span>
                <div className="flex-1 relative h-6 flex items-center">
                  <div className="w-full h-1.5 bg-[#1a1d24] rounded-full" />
                  <div
                    className="absolute left-0 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${((weights[vw.key] - vw.min) / (vw.max - vw.min)) * 100}%`,
                      backgroundColor: vw.color,
                    }}
                  />
                  <input
                    type="range"
                    min={vw.min}
                    max={vw.max}
                    step={vw.step}
                    value={weights[vw.key]}
                    onChange={e => updateWeight(vw.key, parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white/80 flex-shrink-0 transition-all"
                    style={{
                      left: `calc(${((weights[vw.key] - vw.min) / (vw.max - vw.min)) * 100}% - 8px)`,
                      backgroundColor: vw.color,
                    }}
                  />
                </div>
                <span className="text-[#4b5563] text-xs w-4 flex-shrink-0">×{vw.max}</span>
                <button
                  onClick={() => updateWeight(vw.key, vw.defaultWeight)}
                  className="text-[#4b5563] hover:text-[#9ca3af] text-xs cursor-pointer whitespace-nowrap underline underline-offset-2"
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global High-Risk Threshold */}
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10">
            <i className="ri-alarm-warning-line text-red-400 text-base" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Global High-Risk Alert Threshold</h3>
            <p className="text-[#4b5563] text-xs">Students exceeding this score trigger admin alerts and leaderboard highlights</p>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#9ca3af] text-xs">Alert fires when risk score &ge;</span>
              <span className={`text-2xl font-black ${globalThreshold >= 80 ? 'text-red-400' : globalThreshold >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {globalThreshold}
              </span>
            </div>
            <div className="relative h-6 flex items-center">
              <div className="w-full h-2 rounded-full overflow-hidden">
                <div className="h-full w-full" style={{ background: 'linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 80%, #dc2626 100%)' }} />
              </div>
              <div
                className="absolute w-5 h-5 bg-white rounded-full border-2 border-[#111318] transition-all"
                style={{ left: `calc(${globalThreshold}% - 10px)` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={globalThreshold}
                onChange={e => { setGlobalThreshold(parseInt(e.target.value)); setSaved(false); }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[#374151] text-xs mt-1">
              <span>0 — Low</span>
              <span>50 — Medium</span>
              <span>100 — Critical</span>
            </div>
          </div>

          <div className="w-px h-20 bg-[#1e2330] flex-shrink-0" />

          {/* Live preview */}
          <div className="w-36 flex-shrink-0">
            <div className="text-[#4b5563] text-xs mb-2 text-center">Live Preview</div>
            <div className={`rounded-xl p-3 text-center border ${
              previewLevel === 'high' ? 'bg-red-500/10 border-red-500/20' :
              previewLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' :
              'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className={`text-3xl font-black ${
                previewLevel === 'high' ? 'text-red-400' :
                previewLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{previewScore}</div>
              <div className={`text-xs font-semibold capitalize mt-0.5 ${
                previewLevel === 'high' ? 'text-red-400' :
                previewLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{previewLevel} Risk</div>
              <div className="text-[#4b5563] text-xs mt-1">Sample scenario</div>
            </div>
            <div className="text-[10px] text-[#374151] text-center mt-1.5">3× gaze · 1× face · 2× focus</div>
          </div>
        </div>
      </div>

      {/* Per-exam threshold overrides */}
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
        <button
          onClick={() => setShowExamThresholds(p => !p)}
          className="w-full flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-teal-500/10">
              <i className="ri-file-settings-line text-teal-400 text-base" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-sm">Per-Exam Threshold Overrides</h3>
              <p className="text-[#4b5563] text-xs">Set custom alert thresholds for individual exams</p>
            </div>
          </div>
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i className={`${showExamThresholds ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-[#6b7280] text-lg`} />
          </div>
        </button>

        {showExamThresholds && (
          <div className="mt-5 space-y-4">
            {PER_EXAM_THRESHOLDS.map(exam => (
              <div key={exam.id} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-teal-500/60 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold truncate">{exam.name}</div>
                  <div className="text-[#4b5563] text-xs font-mono">{exam.courseCode}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={examThresholds[exam.id]}
                    onChange={e => updateExamThreshold(exam.id, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-16 bg-[#0a0c10] border border-[#2d3139] rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-teal-500/50"
                  />
                  <span className="text-[#4b5563] text-xs">/ 100</span>
                  {examThresholds[exam.id] !== exam.threshold && (
                    <span className="text-amber-400 text-xs">override</span>
                  )}
                  {examThresholds[exam.id] === globalThreshold && (
                    <span className="text-teal-400 text-xs">= global</span>
                  )}
                </div>
              </div>
            ))}
            <p className="text-[#374151] text-xs pt-1">Global default: {globalThreshold} · Per-exam overrides take priority during live monitoring</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleReset}
          className="text-[#6b7280] hover:text-white text-sm cursor-pointer whitespace-nowrap border border-[#2d3139] rounded-lg px-4 py-2.5 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          className={`font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-teal-500 hover:bg-teal-400 text-white'
          }`}
        >
          {saved ? <><i className="ri-checkbox-circle-line mr-1.5" />Saved!</> : 'Save Threshold Settings'}
        </button>
      </div>
    </div>
  );
}
