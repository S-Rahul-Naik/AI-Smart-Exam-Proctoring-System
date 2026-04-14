import { AlertEvent } from '../../../../mocks/alerts';

interface EventTimelineProps {
  alerts: any[];  // Accept both AlertEvent and AdminAlertNotification
}

const typeConfig: Record<string, any> = {
  gaze_deviation: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: 'ri-eye-off-line', label: 'Gaze' },
  face_missing: { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', icon: 'ri-user-unfollow-line', label: 'Face' },
  face_absent: { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', icon: 'ri-user-unfollow-line', label: 'Face' },
  multiple_faces: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: 'ri-group-line', label: 'Multi' },
  phone_detected: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: 'ri-smartphone-line', label: 'Phone' },
  // Risk threshold alerts
  risk_threshold: { color: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: 'ri-alert-line', label: 'Risk' },
};

export default function EventTimeline({ alerts }: EventTimelineProps) {
  return (
    <div className="bg-[#111318] border border-[#1e2330] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold">Live Events</h3>
        <span className="text-xs text-[#4b5563]">Last 30 min</span>
      </div>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-[#4b5563] text-xs">
            No events recorded
          </div>
        ) : (
          alerts.map((alert) => {
            // Determine alert type - handle both AlertEvent and AdminAlertNotification
            const alertType = (alert.type || 'risk_threshold') as string;
            const config = typeConfig[alertType] || typeConfig.risk_threshold;
            const description = alert.description || alert.message || 'Risk threshold exceeded';
            const timestamp = alert.timestamp || new Date().toISOString();
            
            return (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-lg bg-[#0a0c10] flex-shrink-0`}>
                  <i className={`${config.icon} ${config.color} text-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                    <span className="text-[#4b5563] text-xs">·</span>
                    <span className="text-[#6b7280] text-xs truncate">
                      {alert.studentName || 'Unknown Student'}
                    </span>
                  </div>
                  <p className="text-[#9ca3af] text-xs leading-relaxed truncate">{description}</p>
                  <span className="text-[#4b5563] text-xs">
                    {typeof timestamp === 'string' ? timestamp.split('T')[1]?.split('.')[0] || timestamp : new Date(timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
