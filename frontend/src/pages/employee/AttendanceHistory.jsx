import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getMyAttendance, getMonthlyStats } from '../../services/attendanceService';

const ROW_COLORS = {
  present: 'bg-green-50 dark:bg-green-900/10',
  absent: 'bg-red-50 dark:bg-red-900/10',
  half_day: 'bg-yellow-50 dark:bg-yellow-900/10',
  work_from_home: 'bg-blue-50 dark:bg-blue-900/10',
  casual_leave: 'bg-orange-50 dark:bg-orange-900/10',
  sick_leave: 'bg-red-50 dark:bg-red-900/10',
  wfh: 'bg-blue-50 dark:bg-blue-900/10',
};

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start_date: format(start, 'yyyy-MM-dd'),
    end_date: format(end, 'yyyy-MM-dd'),
  };
}

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(getDefaultRange());

  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit,
      };
      const [attRes, statsRes] = await Promise.allSettled([
        getMyAttendance(params),
        getMonthlyStats(),
      ]);

      if (attRes.status === 'fulfilled') {
        const d = attRes.value;
        setAttendance(d?.data || d?.attendance || []);
        const total = d?.total || d?.pagination?.total || 0;
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      }

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value;
        setMonthlyStats(s?.stats || s?.data || s || null);
      }
    } catch {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleApply = () => {
    setCurrentPage(1);
    fetchData();
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val) => (val ? format(new Date(val), 'MMM dd, yyyy') : 'N/A'),
    },
    {
      key: 'date',
      label: 'Day',
      render: (val) => (val ? format(new Date(val), 'EEEE') : '-'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (val) => (
        <span className="text-slate-500 dark:text-slate-400 max-w-[200px] truncate block">
          {val || '-'}
        </span>
      ),
    },
  ];

  const stats = monthlyStats || {};
  const present = stats.present ?? stats.present_days ?? 0;
  const absent = stats.absent ?? stats.absent_days ?? 0;
  const halfDay = stats.half_day ?? stats.halfDay ?? 0;
  const wfh = stats.work_from_home ?? stats.wfh ?? 0;
  const casualLeave = stats.casual_leave ?? stats.casualLeave ?? 0;
  const sickLeave = stats.sick_leave ?? stats.sickLeave ?? 0;
  const attendancePercent = stats.attendance_percentage ?? stats.percentage ?? 0;

  const statCards = [
    { label: 'Present', value: present, color: 'text-green-600 dark:text-green-400' },
    { label: 'Absent', value: absent, color: 'text-red-600 dark:text-red-400' },
    { label: 'Half Day', value: halfDay, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'WFH', value: wfh, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Casual Leave', value: casualLeave, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Sick Leave', value: sickLeave, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View your attendance records</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Monthly Summary</h2>
        {monthlyStats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-4">
              {statCards.map((card) => (
                <div key={card.label} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
                </div>
              ))}
              <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className={`text-2xl font-bold ${attendancePercent >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.round(attendancePercent)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attendance</p>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  attendancePercent >= 75 ? 'bg-green-500' : attendancePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(attendancePercent, 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No monthly stats available.</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading attendance..." />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={attendance.map((rec) => ({
              ...rec,
              _rowColor: ROW_COLORS[rec.status] || '',
            }))}
            loading={false}
            searchable={false}
            sortable={false}
            pageSize={attendance.length || 10}
            pageSizeOptions={[attendance.length || 10]}
            emptyMessage="No attendance records found for the selected period."
          />
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
