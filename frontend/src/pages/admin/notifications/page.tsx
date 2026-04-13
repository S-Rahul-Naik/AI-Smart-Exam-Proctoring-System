import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { mockNotifications } from '../../../mocks/analytics';
import BulkInvitationModal from './components/BulkInvitationModal';

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<'all' | 'invitation' | 'result' | 'alert'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ count: number; exam: string } | null>(null);

  const filtered = mockNotifications.filter(n => tab === 'all' || n.type === tab);

  const typeConfig = {
    invitation: { icon: 'ri-mail-send-line', color: 'text-teal-400', bg: 'bg-teal-500/10', label: 'Invitation' },
    result: { icon: 'ri-award-line', color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Result' },
    alert: { icon: 'ri-alert-line', color: 'text-red-400', bg: 'bg-red-500/10', label: 'Alert' },
  };

  const handleSent = (count: number, exam: string) => {
    setModalOpen(false);
    setToast({ count, exam });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <AdminLayout
      title="Notifications & Email System"
      subtitle="Manage exam invitations, result releases, and system alerts"
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5"
        >
          <i className="ri-mail-send-line" /> Send Bulk Invitation
        </button>
      }
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-40 flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/20 flex-shrink-0">
            <i className="ri-check-double-line text-base" />
          </div>
          <div>
            <div className="font-semibold">Invitations sent successfully!</div>
            <div className="text-emerald-300/70 text-xs">{toast.count} students invited to {toast.exam}</div>
          </div>
          <button onClick={() => setToast(null)} className="ml-2 text-emerald-400/60 hover:text-emerald-400 cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Invitations Sent', val: mockNotifications.filter(n => n.type === 'invitation').length, icon: 'ri-mail-send-line', color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { label: 'Results Released', val: mockNotifications.filter(n => n.type === 'result').length, icon: 'ri-award-line', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Failed Deliveries', val: mockNotifications.filter(n => n.status === 'failed').length, icon: 'ri-error-warning-line', color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#1e2330] rounded-xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#111318] flex-shrink-0">
              <i className={`${s.icon} ${s.color} text-lg`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[#6b7280] text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-[#111318] border border-[#1e2330] rounded-xl p-1 mb-5 w-fit">
        {(['all', 'invitation', 'result', 'alert'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${tab === t ? 'bg-teal-500 text-white' : 'text-[#6b7280] hover:text-white'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t !== 'all' && <span className="ml-1.5 text-xs opacity-60">({mockNotifications.filter(n => n.type === t).length})</span>}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
        {filtered.map((notif, i) => {
          const config = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.alert;
          return (
            <div key={notif.id} className={`flex items-center gap-4 px-5 py-4 ${i < filtered.length - 1 ? 'border-b border-[#1e2330]' : ''} hover:bg-[#1a1d24] transition-colors`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${config.bg} flex-shrink-0`}>
                <i className={`${config.icon} ${config.color} text-base`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{notif.subject}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[#6b7280] text-xs">{notif.to}</span>
                  <span className="text-[#2d3139] text-xs">·</span>
                  <span className="text-[#4b5563] text-xs">{notif.sentAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${notif.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {notif.status === 'delivered' ? 'Delivered' : 'Failed'}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                {notif.status === 'failed' && (
                  <button className="text-teal-400 hover:text-teal-300 text-xs cursor-pointer whitespace-nowrap">Retry</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Email template section */}
      <div className="mt-6 grid md:grid-cols-2 gap-5">
        {[
          { title: 'Exam Invitation Template', icon: 'ri-mail-send-line', desc: 'Sent with unique secure access token and exam details', color: 'text-teal-400' },
          { title: 'Result Release Template', icon: 'ri-award-line', desc: 'Sent only after admin approval with final score and status', color: 'text-emerald-400' },
        ].map(tmpl => (
          <div key={tmpl.title} className="bg-[#111318] border border-[#1e2330] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1d24]">
                <i className={`${tmpl.icon} ${tmpl.color} text-base`} />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{tmpl.title}</div>
                <div className="text-[#4b5563] text-xs">{tmpl.desc}</div>
              </div>
            </div>
            <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-3 font-mono text-xs text-[#6b7280] leading-relaxed">
              <div className="text-[#9ca3af]">Subject: {tmpl.title.includes('Invitation') ? 'Exam Invitation: {exam_title}' : 'Your Exam Results: {exam_title}'}</div>
              <div className="mt-2">Dear {'{student_name}'},</div>
              <div className="mt-1 text-[#4b5563]">{tmpl.title.includes('Invitation') ? 'You have been scheduled for {exam_title} on {date}. Access your secure exam link below:' : 'Your results for {exam_title} have been released. Final status: {status}'}</div>
            </div>
            <button className="mt-3 text-teal-400 hover:text-teal-300 text-xs cursor-pointer whitespace-nowrap">Edit Template →</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <BulkInvitationModal
          onClose={() => setModalOpen(false)}
          onSent={handleSent}
        />
      )}
    </AdminLayout>
  );
}
