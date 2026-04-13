import AdminLayout from '../../../components/feature/AdminLayout';
import RiskThresholdPanel from './components/RiskThresholdPanel';

export default function AdminSettingsPage() {
  return (
    <AdminLayout title="Settings & Configuration" subtitle="System-wide configuration and preferences">
      <div className="max-w-3xl space-y-6">
        {[
          {
            title: 'System Configuration',
            icon: 'ri-settings-3-line',
            fields: [
              { label: 'Institution Name', value: 'University of Technology', type: 'text' },
              { label: 'Admin Email', value: 'admin@uni.edu', type: 'email' },
              { label: 'System Timezone', value: 'UTC+0 (London)', type: 'select' },
            ],
          },
          {
            title: 'Security Settings',
            icon: 'ri-shield-keyhole-line',
            fields: [
              { label: 'Token Expiry Duration', value: '24 hours', type: 'select' },
              { label: 'Max Login Attempts', value: '5', type: 'number' },
              { label: 'Session Auto-Logout', value: '60 minutes', type: 'select' },
            ],
          },
          {
            title: 'Monitoring Defaults',
            icon: 'ri-radar-line',
            fields: [
              { label: 'Default Processing Rate', value: '1.5 FPS', type: 'select' },
              { label: 'Evidence Snapshot Storage', value: '90 days', type: 'select' },
            ],
          },
        ].map(section => (
          <div key={section.title} className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-teal-500/10">
                <i className={`${section.icon} text-teal-400 text-base`} />
              </div>
              <h3 className="text-white font-bold text-sm">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.label} className="flex items-center gap-4">
                  <label className="text-[#9ca3af] text-sm w-48 flex-shrink-0">{field.label}</label>
                  <input
                    type={field.type === 'select' ? 'text' : field.type}
                    defaultValue={field.value}
                    className="flex-1 bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Risk Threshold Configuration */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-[#1e2330]" />
            <span className="text-[#4b5563] text-xs font-semibold uppercase tracking-wide px-2">Risk Engine Configuration</span>
            <div className="flex-1 h-px bg-[#1e2330]" />
          </div>
          <RiskThresholdPanel />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button className="text-[#6b7280] hover:text-white text-sm cursor-pointer whitespace-nowrap">Discard Changes</button>
          <button className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
