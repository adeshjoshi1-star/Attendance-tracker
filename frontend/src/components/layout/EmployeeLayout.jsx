import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from '../ui/DarkModeToggle';

const navLinks = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { to: '/employee/mark-attendance', label: 'Mark Attendance', icon: '\u2705' },
  { to: '/employee/attendance-history', label: 'Attendance History', icon: '\u{1F4CB}' },
  { to: '/employee/apply-leave', label: 'Apply Leave', icon: '\u{1F4DD}' },
  { to: '/employee/my-leaves', label: 'My Leaves', icon: '\u{1F4C4}' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\u{1F4BC}'}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
              Attendance
            </span>
          </div>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-sm font-medium text-primary-700 dark:text-primary-300">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.department || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile) / Sidebar (desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:sticky md:border-t-0 md:border-b">
        <div className="flex overflow-x-auto md:justify-center">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-2 text-xs font-medium min-w-[64px] transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              <span className="text-lg">{link.icon}</span>
              <span className="whitespace-nowrap">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
