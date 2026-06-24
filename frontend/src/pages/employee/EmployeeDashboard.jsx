import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getTodayStatus, getMonthlyStats, getMyAttendance } from '../../services/attendanceService';
import { getMyLeaves, getMyLeaveBalance } from '../../services/leaveService';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todayStatus, setTodayStatus] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, statsRes, balanceRes, attendanceRes, leavesRes] = await Promise.allSettled([
        getTodayStatus(),
        getMonthlyStats(),
        getMyLeaveBalance(),
        getMyAttendance({ limit: 7 }),
        getMyLeaves({ limit: 5, status: 'pending' }),
      ]);

      if (todayRes.status === 'fulfilled') {
        const d = todayRes.value;
        setTodayStatus(d?.attendance || d?.data || d || null);
      }

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value;
        setMonthlyStats(s?.stats || s?.data || s || null);
      }

      if (balanceRes.status === 'fulfilled') {
        const b = balanceRes.value;
        setLeaveBalance(b?.balance || b?.data || b || null);
      }

      if (attendanceRes.status === 'fulfilled') {
        const a = attendanceRes.value;
        setRecentAttendance(a?.data || a?.attendance || a || []);
      }

      if (leavesRes.status === 'fulfilled') {
        const l = leavesRes.value;
        setPendingLeaves(l?.data || l?.leaves || l || []);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  const attendancePercent = monthlyStats?.attendance_percentage ?? monthlyStats?.percentage ?? 0;
  const casualLeave = leaveBalance?.casual ?? { allocated: 0, remaining: 0 };
  const sickLeave = leaveBalance?.sick ?? { allocated: 0, remaining: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome, Employee
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
          Employee Code: {user?.employee_id || 'N/A'}
        </div>
      </div>

      {todayStatus && todayStatus.status ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Attendance</p>
              <div className="mt-2">
                <StatusBadge status={todayStatus.status} />
              </div>
              {todayStatus.remarks && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{todayStatus.remarks}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Marked at {todayStatus.marked_at ? format(new Date(todayStatus.marked_at), 'hh:mm a') : 'N/A'}
              </p>
            </div>
            <Link
              to="/employee/mark-attendance"
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              Update
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl p-6 text-white">
          <div>
            <p className="text-sm font-medium text-primary-100">Good morning!</p>
            <p className="text-lg font-semibold mt-1">You haven't marked your attendance yet today</p>
          </div>
          <button
            onClick={() => navigate('/employee/mark-attendance')}
            className="mt-4 px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors shadow-lg"
          >
            Mark Attendance
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Attendance This Month"
          value={attendancePercent != null ? `${Math.round(attendancePercent)}%` : 'N/A'}
          icon="📊"
          color="indigo"
        />
        <StatsCard
          title="Casual Leave Balance"
          value={`${casualLeave.remaining ?? 0} / ${casualLeave.allocated ?? 0}`}
          icon="🏖️"
          color="blue"
        />
        <StatsCard
          title="Sick Leave Balance"
          value={`${sickLeave.remaining ?? 0} / ${sickLeave.allocated ?? 0}`}
          icon="🏥"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Recent Attendance</h2>
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Date</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Day</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {recentAttendance.map((record) => (
                    <tr key={record.id || record._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {record.date ? format(new Date(record.date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                        {record.date ? format(new Date(record.date), 'EEEE') : '-'}
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            to="/employee/attendance-history"
            className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View all attendance →
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Pending Leave Requests</h2>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No pending leave requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Type</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Dates</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {pendingLeaves.map((leave) => (
                    <tr key={leave.id || leave._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-2 py-2">
                        <StatusBadge status={leave.leave_type || leave.type} />
                      </td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {leave.start_date || leave.startDate} — {leave.end_date || leave.endDate}
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={leave.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            to="/employee/my-leaves"
            className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View all leaves →
          </Link>
        </div>
      </div>
    </div>
  );
}
