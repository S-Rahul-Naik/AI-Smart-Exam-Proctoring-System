import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

type NavItem = {
  path: string;
  icon: string;
  label: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { path: '/admin/dashboard', icon: 'ri-dashboard-3-line', label: 'Dashboard' },
  { path: '/admin/exams', icon: 'ri-file-list-3-line', label: 'Exam Management' },
  { path: '/admin/students', icon: 'ri-team-line', label: 'Student Management' },
  { path: '/admin/sessions', icon: 'ri-camera-line', label: 'Session Review' },
  { path: '/admin/results', icon: 'ri-award-line', label: 'Results & Evaluation' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0d0f14] border-r border-[#1e2330] flex flex-col z-50">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-full flex items-center gap-3 px-5 py-5 border-b border-[#1e2330] text-left cursor-pointer hover:bg-[#1a1d24] transition-colors"
      >
        <img
          src="https://public.readdy.ai/ai/img_res/bf8ee180-749c-43bb-8a55-d2dd1e2b7747.png"
          alt="ProctorAI Logo"
          className="w-8 h-8 object-contain"
        />
        <div>
          <div className="text-white font-bold text-sm tracking-wide">ProctorAI</div>
          <div className="text-[#4b5563] text-xs">Admin Console</div>
        </div>
      </button>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'text-[#6b7280] hover:text-[#d1d5db] hover:bg-[#1a1d24]'
              }`
            }
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className={`${item.icon} text-base`} />
            </div>
            <span className="text-sm font-medium flex-1 whitespace-nowrap">{item.label}</span>
            {item.badge && (
              <span className="bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1e2330]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1d24]">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <i className="ri-user-line text-teal-400 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">Admin</div>
            <div className="text-[#4b5563] text-xs truncate">System Administrator</div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login?role=admin', { replace: true });
            }}
            className="w-6 h-6 flex items-center justify-center text-[#4b5563] hover:text-red-400 transition-colors cursor-pointer"
          >
            <i className="ri-logout-box-line text-sm" />
          </button>
        </div>
      </div>
    </aside>
  );
}
