import { ReactNode, useState } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const [alertsOpen, setAlertsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0c10] flex">
      <AdminSidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="h-16 bg-[#0d0f14] border-b border-[#1e2330] flex items-center px-6 gap-4 sticky top-0 z-40">
          <div className="flex-1">
            <h1 className="text-white font-semibold text-base">{title}</h1>
            {subtitle && <p className="text-[#4b5563] text-xs">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <div className="relative">
              <button
                onClick={() => setAlertsOpen(!alertsOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1d24] text-[#6b7280] hover:text-white transition-colors relative cursor-pointer"
              >
                <i className="ri-notification-3-line text-base" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">3</span>
              </button>
              {alertsOpen && (
                <div className="absolute right-0 top-11 w-80 bg-[#1a1d24] border border-[#2d3139] rounded-xl shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-[#2d3139] flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Live Alerts</span>
                    <button onClick={() => setAlertsOpen(false)} className="text-[#4b5563] hover:text-white cursor-pointer"><i className="ri-close-line" /></button>
                  </div>
                  {[
                    { student: 'Priya Nair', msg: 'Phone detected in frame', time: '2m ago', color: 'text-red-400' },
                    { student: 'Aisha Rahman', msg: 'Repeated gaze deviation (6x)', time: '5m ago', color: 'text-orange-400' },
                    { student: 'Yuki Tanaka', msg: 'Gaze deviation left detected', time: '9m ago', color: 'text-yellow-400' },
                  ].map((alert, i) => (
                    <div key={i} className="px-4 py-3 border-b border-[#2d3139] last:border-0 hover:bg-[#22252b] cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className={`text-xs font-semibold ${alert.color}`}>{alert.student}</div>
                          <div className="text-[#9ca3af] text-xs">{alert.msg}</div>
                          <div className="text-[#4b5563] text-xs mt-0.5">{alert.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1d24] rounded-lg">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
              <span className="text-[#9ca3af] text-xs">Live</span>
              <span className="text-white text-xs font-mono font-semibold">09:22:14</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
