import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import RiskBadge from '../../../components/base/RiskBadge';
import StatusBadge from '../../../components/base/StatusBadge';
import { mockAnalytics } from '../../../mocks/analytics';

export default function AdminResultsPage() {
  const [decision, setDecision] = useState<Record<string, string>>({});

  const handleDecision = (id: string, type: string) => {
    setDecision(prev => ({ ...prev, [id]: type }));
  };

  return (
    <AdminLayout title="Results & Risk-Based Evaluation" subtitle="Approve, flag, or reject results based on exam score and risk analysis">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', val: mockAnalytics.recentSessions.length, color: 'text-white', bg: 'bg-[#1a1d24]', icon: 'ri-file-list-line' },
          { label: 'Pending Review', val: mockAnalytics.recentSessions.filter(s => s.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: 'ri-time-line' },
          { label: 'Approved', val: mockAnalytics.recentSessions.filter(s => s.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'ri-checkbox-circle-line' },
          { label: 'Flagged/Rejected', val: 0, color: 'text-red-400', bg: 'bg-red-500/10', icon: 'ri-flag-line' },
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

      <div className="bg-[#111318] border border-[#1e2330] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2330] flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Session Results</h3>
          <button className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap hover:bg-teal-500/20 transition-colors">
            <i className="ri-mail-send-line mr-1" />Release All Approved
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2330]">
                {['Student', 'Exam', 'Date', 'Exam Score', 'Risk Score', 'Risk Level', 'Status', 'Decision'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-[#4b5563] uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockAnalytics.recentSessions.map(session => {
                const currentDecision = decision[session.id] || session.status;
                return (
                  <tr key={session.id} className="border-b border-[#1e2330] hover:bg-[#1a1d24] transition-colors">
                    <td className="px-5 py-4 text-white text-sm font-medium whitespace-nowrap">{session.student}</td>
                    <td className="px-5 py-4 text-[#9ca3af] text-sm whitespace-nowrap">{session.exam.slice(0, 20)}...</td>
                    <td className="px-5 py-4 text-[#6b7280] text-sm whitespace-nowrap">{session.date}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${session.examScore >= 80 ? 'text-emerald-400' : session.examScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{session.examScore}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${session.riskScore >= 70 ? 'text-red-400' : session.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{session.riskScore}</span>
                    </td>
                    <td className="px-5 py-4">
                      <RiskBadge score={session.riskScore} level={session.riskLevel as 'low' | 'medium' | 'high'} showScore={false} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={currentDecision} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      {currentDecision === 'pending' ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleDecision(session.id, 'approved')} className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors" title="Approve">
                            <i className="ri-check-line text-xs" />
                          </button>
                          <button onClick={() => handleDecision(session.id, 'flagged')} className="w-7 h-7 flex items-center justify-center rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-colors" title="Flag">
                            <i className="ri-flag-line text-xs" />
                          </button>
                          <button onClick={() => handleDecision(session.id, 'rejected')} className="w-7 h-7 flex items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors" title="Reject">
                            <i className="ri-close-line text-xs" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleDecision(session.id, 'pending')} className="text-xs text-[#4b5563] hover:text-[#9ca3af] cursor-pointer whitespace-nowrap">Undo</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
