import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getEmployees } from '../../services/employeeService';
import { adjustLeaveBalance } from '../../services/leaveService';

export default function LeaveBalances() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState(null);
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    adjustment_type: 'add',
    days: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { includeBalances: true };
      if (search.trim()) params.search = search.trim();
      const res = await getEmployees(params);
      setEmployees(res.data || res.employees || []);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const summary = employees.reduce(
    (acc, emp) => {
      const balances = emp.leave_balances || emp.leaveBalances || {};
      const cl = balances.casual || balances.CL || {};
      const sl = balances.sick || balances.SL || {};
      acc.totalCLAllocated += cl.allocated || cl.alloted || 0;
      acc.totalCLUsed += cl.used || 0;
      acc.totalSLAllocated += sl.allocated || sl.alloted || 0;
      acc.totalSLUsed += sl.used || 0;
      return acc;
    },
    { totalCLAllocated: 0, totalCLUsed: 0, totalSLAllocated: 0, totalSLUsed: 0 }
  );

  const handleAdjust = async () => {
    if (!formData.days || parseFloat(formData.days) <= 0) {
      toast.error('Please enter valid days');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setSubmitting(true);
    try {
      const days =
        formData.adjustment_type === 'add'
          ? parseFloat(formData.days)
          : -parseFloat(formData.days);
      await adjustLeaveBalance({
        employee_id: adjustModal.id || adjustModal._id,
        leave_type: formData.leave_type,
        adjustment_days: days,
        reason: formData.reason,
      });
      toast.success('Leave balance adjusted successfully');
      setAdjustModal(null);
      setFormData({ leave_type: 'casual', adjustment_type: 'add', days: '', reason: '' });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setSubmitting(false);
    }
  };

  const openAdjustModal = (emp) => {
    setAdjustModal(emp);
    setFormData({ leave_type: 'casual', adjustment_type: 'add', days: '', reason: '' });
  };

  const getBalance = (emp, type, field) => {
    const balances = emp.leave_balances || emp.leaveBalances || {};
    const lb = type === 'cl' ? (balances.casual || balances.CL || {}) : (balances.sick || balances.SL || {});
    return lb[field] ?? 0;
  };

  const columns = [
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    {
      key: 'cl_allocated',
      label: 'CL Allocated',
      render: (_, row) => getBalance(row, 'cl', 'allocated') || getBalance(row, 'cl', 'alloted'),
    },
    {
      key: 'cl_used',
      label: 'CL Used',
      render: (_, row) => getBalance(row, 'cl', 'used'),
    },
    {
      key: 'cl_remaining',
      label: 'CL Remaining',
      render: (_, row) => {
        const allocated = getBalance(row, 'cl', 'allocated') || getBalance(row, 'cl', 'alloted');
        const used = getBalance(row, 'cl', 'used');
        return allocated - used;
      },
    },
    {
      key: 'sl_allocated',
      label: 'SL Allocated',
      render: (_, row) => getBalance(row, 'sl', 'allocated') || getBalance(row, 'sl', 'alloted'),
    },
    {
      key: 'sl_used',
      label: 'SL Used',
      render: (_, row) => getBalance(row, 'sl', 'used'),
    },
    {
      key: 'sl_remaining',
      label: 'SL Remaining',
      render: (_, row) => {
        const allocated = getBalance(row, 'sl', 'allocated') || getBalance(row, 'sl', 'alloted');
        const used = getBalance(row, 'sl', 'used');
        return allocated - used;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => openAdjustModal(row)}
          className="px-2 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          Adjust
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Balances</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage employee leave balances</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total CL Allocated" value={summary.totalCLAllocated} icon="📊" color="indigo" />
        <StatsCard title="Total CL Used" value={summary.totalCLUsed} icon="📋" color="yellow" />
        <StatsCard title="Total SL Allocated" value={summary.totalSLAllocated} icon="📊" color="blue" />
        <StatsCard title="Total SL Used" value={summary.totalSLUsed} icon="📋" color="red" />
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
        />
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found."
        searchable={false}
      />

      {/* Adjust Modal */}
      <Modal isOpen={!!adjustModal} onClose={() => setAdjustModal(null)} title="Adjust Leave Balance" size="sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Employee: <span className="text-slate-900 dark:text-white">{adjustModal?.name}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{adjustModal?.employee_id}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData((prev) => ({ ...prev, leave_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Adjustment Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="adjustment_type"
                  value="add"
                  checked={formData.adjustment_type === 'add'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adjustment_type: e.target.value }))}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Add
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="adjustment_type"
                  value="deduct"
                  checked={formData.adjustment_type === 'deduct'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adjustment_type: e.target.value }))}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Deduct
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.days}
              onChange={(e) => setFormData((prev) => ({ ...prev, days: e.target.value }))}
              placeholder="Enter number of days"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              rows={3}
              placeholder="Enter reason for adjustment..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAdjust}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={() => {
                setAdjustModal(null);
                setFormData({ leave_type: 'casual', adjustment_type: 'add', days: '', reason: '' });
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
