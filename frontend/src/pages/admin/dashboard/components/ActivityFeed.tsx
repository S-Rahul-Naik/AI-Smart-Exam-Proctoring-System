interface FeedItem {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  text: string;
  time: string;
}

interface ActivityFeedProps {
  items?: FeedItem[];
}

export default function ActivityFeed({ items = [] }: ActivityFeedProps) {
  return (
    <div className="bg-[#12151c] border border-[#1e2330] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e2330]">
        <div className="w-5 h-5 flex items-center justify-center">
          <i className="ri-history-line text-teal-400 text-base" />
        </div>
        <h2 className="text-white font-semibold text-sm">Activity Feed</h2>
      </div>

      <div className="divide-y divide-[#1e2330]">
        {items.length === 0 && (
          <div className="px-4 py-4 text-[#6b7280] text-sm">No recent activity found.</div>
        )}
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3 flex items-start gap-3">
            <div className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${item.iconBg}`}>
              <i className={`${item.icon} text-sm ${item.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#d1d5db] text-xs leading-snug">{item.text}</p>
              <span className="text-[#4b5563] text-xs">{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[#1e2330]">
        <button className="text-xs text-[#6b7280] hover:text-teal-400 transition-colors cursor-pointer">
          View full activity log <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
}
