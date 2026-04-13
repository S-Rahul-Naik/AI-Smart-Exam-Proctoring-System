import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/feature/AdminLayout';

export default function SettingsPage() {
  const navigate = useNavigate();
  return (
    <AdminLayout title="Settings" subtitle="Personal preferences and account settings">
      <div className="max-w-2xl space-y-5">
        {[
          { title: 'Profile', icon: 'ri-user-line', fields: [{ label: 'Full Name', val: 'Dr. Sarah Mitchell' }, { label: 'Email', val: 'admin@uni.edu' }, { label: 'Role', val: 'System Administrator' }] },
          { title: 'Appearance', icon: 'ri-palette-line', fields: [{ label: 'Theme', val: 'Dark (Default)' }, { label: 'Language', val: 'English' }] },
          { title: 'Notifications', icon: 'ri-notification-3-line', fields: [{ label: 'Email Alerts', val: 'Enabled' }, { label: 'High Risk Threshold Alert', val: 'Enabled' }] },
        ].map(s => (
          <div key={s.title} className="bg-[#111318] border border-[#1e2330] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-teal-500/10">
                <i className={`${s.icon} text-teal-400`} />
              </div>
              <h3 className="text-white font-bold text-sm">{s.title}</h3>
            </div>
            <div className="space-y-4">
              {s.fields.map(f => (
                <div key={f.label} className="flex items-center gap-4">
                  <label className="text-[#9ca3af] text-sm w-48 flex-shrink-0">{f.label}</label>
                  <input defaultValue={f.val} className="flex-1 bg-[#0a0c10] border border-[#2d3139] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500/50" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3">
          <button className="text-[#6b7280] hover:text-white text-sm cursor-pointer whitespace-nowrap">Discard</button>
          <button className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors">Save Changes</button>
        </div>
      </div>
    </AdminLayout>
  );
}
