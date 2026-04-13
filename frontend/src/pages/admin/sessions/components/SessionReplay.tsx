import { useState, useRef, useCallback, useEffect } from 'react';

interface Alert {
  id: string;
  timestamp: string;
  description: string;
  severity: string;
  riskContribution: number;
  snapshot?: string;
}

interface Session {
  student: string;
  exam: string;
  date: string;
  riskScore: number;
  riskLevel: string;
  examScore: number;
}

interface ReplayEvent {
  id: string;
  minuteOffset: number;
  label: string;
  severity: string;
  riskContrib: number;
  snapshot?: string;
  type: 'gaze' | 'face' | 'focus' | 'phone' | 'multi';
}

interface Props {
  session: Session;
  alerts: Alert[];
}

const EXAM_DURATION_MIN = 90;

function timestampToMinutes(ts: string, baseMin: number): number {
  try {
    const parts = ts.replace(/\s*(AM|PM)/i, '').split(':');
    if (parts.length < 2) return baseMin;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const isPM = /PM/i.test(ts);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  } catch {
    return baseMin;
  }
}

function inferEventType(desc: string): ReplayEvent['type'] {
  const d = desc.toLowerCase();
  if (d.includes('gaze') || d.includes('looking')) return 'gaze';
  if (d.includes('face') || d.includes('absent') || d.includes('visible')) return 'face';
  if (d.includes('tab') || d.includes('window') || d.includes('focus')) return 'focus';
  if (d.includes('phone') || d.includes('device')) return 'phone';
  if (d.includes('multiple') || d.includes('person')) return 'multi';
  return 'gaze';
}

const TYPE_CONFIG = {
  gaze:  { color: '#f59e0b', icon: 'ri-eye-off-line',     label: 'Gaze' },
  face:  { color: '#ef4444', icon: 'ri-user-unfollow-line', label: 'Face' },
  focus: { color: '#f97316', icon: 'ri-focus-mode',        label: 'Focus' },
  phone: { color: '#dc2626', icon: 'ri-smartphone-line',   label: 'Phone' },
  multi: { color: '#8b5cf6', icon: 'ri-group-line',        label: 'Multi' },
};

export default function SessionReplay({ session, alerts }: Props) {
  const [currentMin, setCurrentMin] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<ReplayEvent | null>(null);
  const [activeEvent, setActiveEvent] = useState<ReplayEvent | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDraggingRef = useRef(false);

  // Convert alerts into replay events with minute offsets
  const events: ReplayEvent[] = (() => {
    if (!alerts.length) return [];
    const firstTs = alerts[0]?.timestamp ?? '09:00:00';
    const baseMin = timestampToMinutes(firstTs, 0);
    const baseHour = Math.floor(baseMin / 60);
    const sessionStartMin = baseHour * 60;

    return alerts.map(a => {
      const absMin = timestampToMinutes(a.timestamp, sessionStartMin);
      const offsetMin = Math.max(0, Math.min(EXAM_DURATION_MIN - 1, absMin - sessionStartMin));
      return {
        id: a.id,
        minuteOffset: offsetMin,
        label: a.description,
        severity: a.severity,
        riskContrib: a.riskContribution,
        snapshot: a.snapshot,
        type: inferEventType(a.description),
      };
    }).sort((a, b) => a.minuteOffset - b.minuteOffset);
  })();

  // Synthetic risk curve: risk at each minute
  const riskAtMinute = useCallback((min: number): number => {
    const eventsUpTo = events.filter(e => e.minuteOffset <= min);
    const raw = eventsUpTo.reduce((acc, e) => acc + e.riskContrib, 0);
    return Math.min(100, Math.round(raw * 1.4));
  }, [events]);

  const currentRisk = riskAtMinute(currentMin);
  const currentRiskLevel = currentRisk >= 65 ? 'high' : currentRisk >= 35 ? 'medium' : 'low';

  // Find events at/near current time
  const nearbyEvents = events.filter(e => Math.abs(e.minuteOffset - currentMin) <= 2);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setCurrentMin(prev => {
          if (prev >= EXAM_DURATION_MIN) {
            setIsPlaying(false);
            return EXAM_DURATION_MIN;
          }
          return prev + 1;
        });
      }, 120); // 1 min per 120ms = 90s total playback
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying]);

  // Click/drag on scrubber
  const seekTo = useCallback((clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCurrentMin(Math.round(pct * EXAM_DURATION_MIN));
  }, []);

  const handleBarMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    seekTo(e.clientX);
  };
  const handleBarMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) seekTo(e.clientX);
  };
  const handleBarMouseUp = () => { isDraggingRef.current = false; };

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  // Waveform-style risk bars (sampled every 3 min)
  const wavePoints: { min: number; risk: number }[] = [];
  for (let m = 0; m <= EXAM_DURATION_MIN; m += 3) {
    wavePoints.push({ min: m, risk: riskAtMinute(m) });
  }

  return (
    <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-sm">Session Replay</h3>
          <p className="text-[#4b5563] text-xs mt-0.5">Scrub through the exam violation timeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentMin(0); setIsPlaying(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d24] text-[#9ca3af] hover:text-white cursor-pointer transition-colors"
            title="Reset"
          >
            <i className="ri-skip-back-line text-sm" />
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs cursor-pointer whitespace-nowrap transition-all ${isPlaying ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-teal-500/15 border border-teal-500/30 text-teal-400'}`}
          >
            <div className="w-3 h-3 flex items-center justify-center">
              <i className={isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} />
            </div>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-1.5 text-teal-400 text-xs font-mono font-bold">
            {formatMin(currentMin)} / {formatMin(EXAM_DURATION_MIN)}
          </div>
        </div>
      </div>

      {/* Risk waveform + scrubber */}
      <div className="relative mb-1">
        {/* Waveform bars */}
        <div className="flex items-end gap-px h-14 mb-1 px-0.5">
          {wavePoints.map((pt) => {
            const isCurrent = Math.abs(pt.min - currentMin) <= 1.5;
            const barColor = pt.risk >= 65 ? '#ef4444' : pt.risk >= 35 ? '#f59e0b' : '#10b981';
            const heightPct = Math.max(4, pt.risk);
            return (
              <div
                key={pt.min}
                className="flex-1 rounded-t transition-all duration-200"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isCurrent ? '#2dd4bf' : barColor,
                  opacity: isCurrent ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>

        {/* Scrubber bar */}
        <div
          ref={barRef}
          className="relative h-3 bg-[#1a1d24] rounded-full cursor-pointer select-none"
          onMouseDown={handleBarMouseDown}
          onMouseMove={handleBarMouseMove}
          onMouseUp={handleBarMouseUp}
          onMouseLeave={handleBarMouseUp}
        >
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-none"
            style={{ width: `${(currentMin / EXAM_DURATION_MIN) * 100}%` }}
          />
          {/* Event markers */}
          {events.map(ev => {
            const cfg = TYPE_CONFIG[ev.type];
            const leftPct = (ev.minuteOffset / EXAM_DURATION_MIN) * 100;
            return (
              <div
                key={ev.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#111318] cursor-pointer z-10 transition-transform hover:scale-150"
                style={{ left: `${leftPct}%`, backgroundColor: cfg.color }}
                title={ev.label}
                onMouseEnter={() => setHoveredEvent(ev)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={(e) => { e.stopPropagation(); setCurrentMin(ev.minuteOffset); setActiveEvent(ev); }}
              />
            );
          })}
          {/* Playhead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-teal-500 z-20 pointer-events-none shadow-lg shadow-teal-500/40"
            style={{ left: `${(currentMin / EXAM_DURATION_MIN) * 100}%` }}
          />
        </div>

        {/* Tick marks */}
        <div className="flex justify-between text-[#2d3139] text-xs mt-1 px-0.5">
          {[0, 15, 30, 45, 60, 75, 90].map(m => (
            <span key={m} className="text-[10px]">{m}m</span>
          ))}
        </div>
      </div>

      {/* Current state panel */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {/* Risk at current time */}
        <div className={`rounded-xl p-3 border text-center ${currentRiskLevel === 'high' ? 'bg-red-500/10 border-red-500/20' : currentRiskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <div className={`text-2xl font-black ${currentRiskLevel === 'high' ? 'text-red-400' : currentRiskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentRisk}
          </div>
          <div className="text-[#4b5563] text-xs">Risk @ {formatMin(currentMin)}</div>
        </div>
        {/* Events before cursor */}
        <div className="bg-[#1a1d24] border border-[#2d3139] rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-white">
            {events.filter(e => e.minuteOffset <= currentMin).length}
          </div>
          <div className="text-[#4b5563] text-xs">Events So Far</div>
        </div>
        {/* Remaining events */}
        <div className="bg-[#1a1d24] border border-[#2d3139] rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-[#6b7280]">
            {events.filter(e => e.minuteOffset > currentMin).length}
          </div>
          <div className="text-[#4b5563] text-xs">Remaining</div>
        </div>
      </div>

      {/* Hovered event tooltip */}
      {hoveredEvent && (
        <div className="mt-3 p-3 bg-[#0a0c10] border border-[#2d3139] rounded-xl flex items-start gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${TYPE_CONFIG[hoveredEvent.type].color}20` }}
          >
            <i className={`${TYPE_CONFIG[hoveredEvent.type].icon} text-sm`} style={{ color: TYPE_CONFIG[hoveredEvent.type].color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold">{hoveredEvent.label}</div>
            <div className="text-[#4b5563] text-xs mt-0.5">@ {formatMin(hoveredEvent.minuteOffset)} · +{hoveredEvent.riskContrib} risk</div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${hoveredEvent.severity === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
            {hoveredEvent.severity}
          </span>
        </div>
      )}

      {/* Nearby events at current scrub position */}
      {nearbyEvents.length > 0 && !hoveredEvent && (
        <div className="mt-3 space-y-2">
          <div className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide">Events near {formatMin(currentMin)}</div>
          {nearbyEvents.map(ev => (
            <div key={ev.id} className="flex items-start gap-2.5 p-2.5 bg-[#0a0c10] border border-[#1e2330] rounded-lg">
              <div
                className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${TYPE_CONFIG[ev.type].color}20` }}
              >
                <i className={`${TYPE_CONFIG[ev.type].icon} text-xs`} style={{ color: TYPE_CONFIG[ev.type].color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#d1d5db] text-xs leading-tight">{ev.label}</div>
                <div className="text-[#4b5563] text-xs mt-0.5">@{formatMin(ev.minuteOffset)} · +{ev.riskContrib}</div>
              </div>
              {ev.snapshot && (
                <img src={ev.snapshot} alt="evidence" className="w-16 h-10 object-cover rounded flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="mt-4 text-center py-6">
          <i className="ri-checkbox-circle-line text-emerald-500/30 text-2xl block mb-1" />
          <span className="text-[#4b5563] text-xs">No violations recorded — clean session</span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-[#1e2330] flex flex-wrap gap-3">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-[#6b7280]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
