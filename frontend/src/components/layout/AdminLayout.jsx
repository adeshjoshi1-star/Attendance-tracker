import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from '../ui/DarkModeToggle';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { to: '/admin/employees', label: 'Employees', icon: '\u{1F464}' },
  { to: '/admin/attendance', label: 'Attendance', icon: '\u{1F4CB}' },
  { to: '/admin/leaves', label: 'Leaves', icon: '\u{1F4DD}' },
  { to: '/admin/leave-balances', label: 'Leave Balances', icon: '\u2696\uFE0F' },
  { to: '/admin/reports', label: 'Reports', icon: '\u{1F4C8}' },
  { to: '/admin/notifications', label: 'Notifications', icon: '\u{1F514}' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-200 dark:border-slate-700">
          <span className="text-2xl">{'\u{1F4BC}'}</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Attendance
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
                }`
              }
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">
              Admin Panel
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-sm font-medium text-primary-700 dark:text-primary-300">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.department || ''}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              Admin
            </span>
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
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
