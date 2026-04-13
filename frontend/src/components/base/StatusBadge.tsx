interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-teal-500/15', text: 'text-teal-400', label: 'Active' },
  scheduled: { bg: 'bg-blue-500/15', text: 'text-sky-400', label: 'Scheduled' },
  completed: { bg: 'bg-[#2d3139]', text: 'text-[#9ca3af]', label: 'Completed' },
  pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Pending Review' },
  approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Approved' },
  flagged: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Flagged' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Rejected' },
  delivered: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Delivered' },
  failed: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Failed' },
  inactive: { bg: 'bg-[#2d3139]', text: 'text-[#6b7280]', label: 'Inactive' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-[#2d3139]', text: 'text-[#9ca3af]', label: status };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
