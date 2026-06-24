import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { getEmployees } from '../../services/employeeService';
import { getAllAttendance, getPendingAttendance } from '../../services/attendanceService';
import { getPendingLeaves } from '../../services/leaveService';
import { getUnreadCount, getAttendanceReminders, getWfhAlerts } from '../../services/notificationService';

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [wfhAlerts, setWfhAlerts] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = getTodayString();

      const [employeesRes, attendanceRes, pendingAttendanceRes, pendingLeavesRes, unreadRes, remindersRes, wfhRes] =
        await Promise.allSettled([
          getEmployees({ pageSize: 10000 }),
          getAllAttendance({ date: today, pageSize: 10000 }),
          getPendingAttendance(),
          getPendingLeaves(),
          getUnreadCount(),
          getAttendanceReminders(),
          getWfhAlerts(),
        ]);

      const employees = employeesRes.value?.data || employeesRes.value?.employees || [];
      const attendanceRecords = attendanceRes.value?.data || attendanceRes.value?.attendance || [];
      const pendingAtt = pendingAttendanceRes.value?.data || pendingAttendanceRes.value?.attendance || [];
      const leaves = pendingLeavesRes.value?.data || pendingLeavesRes.value?.leaves || [];
      const reminders = remindersRes.value?.data || remindersRes.value?.employees || [];
      const wfh = wfhRes.value?.data || wfhRes.value?.alerts || [];

      setPendingAttendance(pendingAtt);
      setPendingLeaves(leaves);
      setWfhAlerts(wfh);

      const total = employees.length;
      const active = employees.filter((e) => e.status === 'active').length;

      const present = attendanceRecords.filter((a) => a.status === 'present').length;
      const absent = attendanceRecords.filter((a) => a.status === 'absent').length;
      const halfDay = attendanceRecords.filter((a) => a.status === 'half_day').length;
      const wfhCount = attendanceRecords.filter((a) => a.status === 'work_from_home' || a.status === 'wfh').length;

      setStats({
        totalEmployees: total,
        activeEmployees: active,
        presentToday: present,
        absentToday: absent,
        halfDayCount: halfDay,
        wfhCount,
        pendingAttendance: pendingAtt.length,
        pendingLeaves: leaves.length,
        wfhAlertsCount: wfh.length,
        unreadNotifications: unreadRes.value?.count || 0,
        attendanceReminders: reminders.length,
      });

      const deptMap = {};
      employees.forEach((emp) => {
        const dept = emp.department || 'Unknown';
        if (!deptMap[dept]) {
          deptMap[dept] = { department: dept, total: 0, present: 0, absent: 0, halfDay: 0, wfh: 0 };
        }
        deptMap[dept].total++;
        const record = attendanceRecords.find(
          (a) => a.employee_id === emp.id || a.employee?._id === emp._id || a.employee?.id === emp.id
        );
        if (record) {
          if (record.status === 'present') deptMap[dept].present++;
          else if (record.status === 'absent') deptMap[dept].absent++;
          else if (record.status === 'half_day') deptMap[dept].halfDay++;
          else if (record.status === 'work_from_home' || record.status === 'wfh') deptMap[dept].wfh++;
        }
      });

      setDepartmentData(Object.values(deptMap));
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

  const maxDept = Math.max(...departmentData.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of attendance and employee activity</p>
      </div>

      {/* First row: Employee & today stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="Total Employees" value={stats?.totalEmployees || 0} icon="👥" color="indigo" />
        <StatsCard title="Active Employees" value={stats?.activeEmployees || 0} icon="✅" color="green" />
        <StatsCard title="Present Today" value={stats?.presentToday || 0} icon="📌" color="green" />
        <StatsCard title="Absent Today" value={stats?.absentToday || 0} icon="❌" color="red" />
        <StatsCard title="Half Day" value={stats?.halfDayCount || 0} icon="🌗" color="yellow" />
        <StatsCard title="WFH" value={stats?.wfhCount || 0} icon="🏠" color="blue" />
      </div>

      {/* Second row: Pending counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Pending Attendance" value={stats?.pendingAttendance || 0} icon="⏳" color="yellow" />
        <StatsCard title="Pending Leave Requests" value={stats?.pendingLeaves || 0} icon="📋" color="blue" />
        <StatsCard title="WFH Alerts" value={stats?.wfhAlertsCount || 0} icon="⚠️" color="red" />
      </div>

      {/* Department summary & Pending leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise attendance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Department Attendance Today</h2>
          {departmentData.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No department data available.</p>
          ) : (
            <div className="space-y-3">
              {departmentData.map((dept) => (
                <div key={dept.department}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{dept.department}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {dept.present}/{dept.total} present
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${(dept.present / Math.max(dept.total, 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Present: {dept.present}</span>
                    <span>Absent: {dept.absent}</span>
                    <span>Half: {dept.halfDay}</span>
                    <span>WFH: {dept.wfh}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending leave requests */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pending Leave Requests</h2>
            <Link to="/admin/leaves" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
              View All
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No pending leave requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Employee</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Type</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Dates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {pendingLeaves.slice(0, 5).map((leave) => (
                    <tr key={leave.id || leave._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                        {leave.employee?.name || leave.employee_name || 'N/A'}
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={leave.leave_type || leave.type} />
                      </td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                        {leave.start_date || leave.startDate} &mdash; {leave.end_date || leave.endDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pending attendance & WFH alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pending Attendance</h2>
            <Link to="/admin/attendance" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
              View All
            </Link>
          </div>
          {pendingAttendance.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No pending attendance records.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Employee</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Department</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {pendingAttendance.slice(0, 5).map((record) => (
                    <tr key={record.id || record._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                        {record.employee?.name || record.employee_name || 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                        {record.employee?.department || record.department || '-'}
                      </td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400">{record.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">WFH Alerts</h2>
          {wfhAlerts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No WFH alerts at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Employee</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Department</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">WFH Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {wfhAlerts.slice(0, 5).map((alert, i) => (
                    <tr key={alert.id || alert._id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                        {alert.employee?.name || alert.name || 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                        {alert.employee?.department || alert.department || '-'}
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-red-600 dark:text-red-400 font-medium">{alert.count || alert.wfhDays || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
