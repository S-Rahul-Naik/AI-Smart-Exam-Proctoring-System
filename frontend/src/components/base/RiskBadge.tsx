interface RiskBadgeProps {
  score: number;
  level: 'low' | 'medium' | 'high';
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colors = {
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  high: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
};

export default function RiskBadge({ score, level, showScore = true, size = 'md' }: RiskBadgeProps) {
  const c = colors[level];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${c.bg} ${c.text} ${c.border} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${level === 'high' ? 'animate-pulse' : ''} flex-shrink-0`} />
      {showScore ? `${score} · ${level.charAt(0).toUpperCase() + level.slice(1)}` : level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

interface RiskMeterProps {
  score: number;
  className?: string;
}

export function RiskMeter({ score, className = '' }: RiskMeterProps) {
  const color = score >= 70 ? 'from-red-500 to-red-600' : score >= 40 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600';
  return (
    <div className={`h-1.5 bg-[#2d3139] rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}
