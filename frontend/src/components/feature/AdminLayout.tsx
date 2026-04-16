import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
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
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
