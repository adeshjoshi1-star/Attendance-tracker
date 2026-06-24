import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getDailyReport, getMonthlyReport, getDepartmentReport, getExportUrl } from '../../services/reportService';

const tabs = [
  { key: 'daily', label: 'Daily Report' },
  { key: 'monthly', label: 'Monthly Report' },
  { key: 'department', label: 'Department Report' },
];

const departments = [
  { value: '', label: 'All' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Quality', label: 'Quality' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Other', label: 'Other' },
];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getMonthYear() {
  const d = new Date();
  return { month: String(d.getMonth() + 1).padStart(2, '0'), year: d.getFullYear() };
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');

  // Daily state
  const [dailyDate, setDailyDate] = useState(getTodayString());
  const [dailyDept, setDailyDept] = useState('');
  const [dailyStatus, setDailyStatus] = useState('');
  const [dailyData, setDailyData] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Monthly state
  const [monthVal, setMonthVal] = useState(getMonthYear().month);
  const [yearVal, setYearVal] = useState(getMonthYear().year);
  const [monthlyDept, setMonthlyDept] = useState('');
  const [monthlyEmployee, setMonthlyEmployee] = useState('');
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Department state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deptData, setDeptData] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const fetchDaily = useCallback(async () => {
    setDailyLoading(true);
    try {
      const params = { date: dailyDate };
      if (dailyDept) params.department = dailyDept;
      if (dailyStatus) params.status = dailyStatus;
      const res = await getDailyReport(params);
      setDailyData(res.data || res.records || res.report || []);
    } catch (err) {
      toast.error('Failed to load daily report');
    } finally {
      setDailyLoading(false);
    }
  }, [dailyDate, dailyDept, dailyStatus]);

  const fetchMonthly = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const params = { month: monthVal, year: yearVal };
      if (monthlyDept) params.department = monthlyDept;
      if (monthlyEmployee.trim()) params.employee_name = monthlyEmployee.trim();
      const res = await getMonthlyReport(params);
      setMonthlyData(res.data || res.records || res.report || []);
    } catch (err) {
      toast.error('Failed to load monthly report');
    } finally {
      setMonthlyLoading(false);
    }
  }, [monthVal, yearVal, monthlyDept, monthlyEmployee]);

  const fetchDept = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    setDeptLoading(true);
    try {
      const res = await getDepartmentReport({ start_date: startDate, end_date: endDate });
      setDeptData(res.data || res.records || res.report || []);
    } catch (err) {
      toast.error('Failed to load department report');
    } finally {
      setDeptLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'daily') fetchDaily();
  }, [activeTab, fetchDaily]);

  const handleExport = (type, format) => {
    let params = {};
    if (type === 'daily') {
      params = { date: dailyDate };
      if (dailyDept) params.department = dailyDept;
      if (dailyStatus) params.status = dailyStatus;
    } else if (type === 'monthly') {
      params = { month: monthVal, year: yearVal };
      if (monthlyDept) params.department = monthlyDept;
      if (monthlyEmployee.trim()) params.employee_name = monthlyEmployee.trim();
    } else if (type === 'department') {
      params = { start_date: startDate, end_date: endDate };
    }
    const url = getExportUrl(type, format, params);
    window.open(url, '_blank');
  };

  const dailyColumns = [
    {
      key: 'employee_name',
      label: 'Employee Name',
      render: (val, row) => val || row.employee?.name || row.name || 'N/A',
    },
    { key: 'department', label: 'Department', render: (val, row) => val || row.employee?.department || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => <StatusBadge status={val || row.attendance_status || row.status} />,
    },
  ];

  const monthlyColumns = [
    {
      key: 'employee_name',
      label: 'Employee Name',
      render: (val, row) => val || row.employee?.name || row.name || 'N/A',
    },
    {
      key: 'present',
      label: 'Present',
      render: (val) => val ?? 0,
    },
    {
      key: 'absent',
      label: 'Absent',
      render: (val) => val ?? 0,
    },
    {
      key: 'half_day',
      label: 'Half Day',
      render: (val) => val ?? 0,
    },
    {
      key: 'wfh',
      label: 'WFH',
      render: (val, row) => val ?? row.work_from_home ?? 0,
    },
    {
      key: 'casual_leave',
      label: 'Casual Leave',
      render: (val, row) => val ?? row.cl ?? 0,
    },
    {
      key: 'sick_leave',
      label: 'Sick Leave',
      render: (val, row) => val ?? row.sl ?? 0,
    },
    {
      key: 'attendance_percentage',
      label: 'Attendance %',
      render: (val, row) => {
        const pct = val ?? row.percentage ?? row.attendance_pct;
        return pct != null ? `${Number(pct).toFixed(1)}%` : '-';
      },
    },
  ];

  const deptColumns = [
    { key: 'department', label: 'Department' },
    { key: 'total_employees', label: 'Total Employees', render: (val) => val ?? 0 },
    { key: 'present', label: 'Present', render: (val) => val ?? 0 },
    { key: 'absent', label: 'Absent', render: (val) => val ?? 0 },
    { key: 'half_day', label: 'Half Day', render: (val) => val ?? 0 },
    { key: 'wfh', label: 'WFH', render: (val) => val ?? 0 },
    {
      key: 'attendance_percentage',
      label: 'Attendance %',
      render: (val, row) => {
        const pct = val ?? row.percentage ?? row.attendance_pct;
        return pct != null ? `${Number(pct).toFixed(1)}%` : '-';
      },
    },
  ];

  const renderExportBtns = (type) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport(type, 'xlsx')}
        className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
      >
        Export Excel
      </button>
      <button
        onClick={() => handleExport(type, 'csv')}
        className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        Export CSV
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and export attendance reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Report */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Department</label>
                <select
                  value={dailyDept}
                  onChange={(e) => setDailyDept(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={dailyStatus}
                  onChange={(e) => setDailyStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="work_from_home">Work From Home</option>
                  <option value="on_leave">On Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <button
                onClick={fetchDaily}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Load
              </button>
              {renderExportBtns('daily')}
            </div>
          </div>
          <DataTable
            columns={dailyColumns}
            data={dailyData}
            loading={dailyLoading}
            emptyMessage="No attendance data found for the selected date."
            searchable={false}
          />
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Month</label>
                <select
                  value={monthVal}
                  onChange={(e) => setMonthVal(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    return (
                      <option key={m} value={m}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Year</label>
                <input
                  type="number"
                  value={yearVal}
                  onChange={(e) => setYearVal(e.target.value)}
                  min="2020"
                  max="2030"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-24"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Department</label>
                <select
                  value={monthlyDept}
                  onChange={(e) => setMonthlyDept(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Employee</label>
                <input
                  type="text"
                  value={monthlyEmployee}
                  onChange={(e) => setMonthlyEmployee(e.target.value)}
                  placeholder="Search employee..."
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <button
                onClick={fetchMonthly}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Load
              </button>
              {renderExportBtns('monthly')}
            </div>
          </div>
          <DataTable
            columns={monthlyColumns}
            data={monthlyData}
            loading={monthlyLoading}
            emptyMessage="No data found for the selected month."
            searchable={false}
          />
        </div>
      )}

      {/* Department Report */}
      {activeTab === 'department' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <button
                onClick={fetchDept}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Load
              </button>
              {startDate && endDate && renderExportBtns('department')}
            </div>
          </div>
          <DataTable
            columns={deptColumns}
            data={deptData}
            loading={deptLoading}
            emptyMessage="No department report data found for the selected date range."
            searchable={false}
          />
        </div>
      )}
    </div>
  );
}
