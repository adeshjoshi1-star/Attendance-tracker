import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import {
  getEmployee,
  deactivateEmployee,
  activateEmployee,
  resetPassword,
} from '../../services/employeeService';
import { getMyAttendance } from '../../services/attendanceService';
import {
  getMyLeaveBalance,
  getLeaveAdjustmentLogs,
  adjustLeaveBalance,
} from '../../services/leaveService';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [adjustmentLogs, setAdjustmentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    leave_type: 'Casual Leave',
    days: 1,
    type: 'add',
    reason: '',
  });
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, balanceRes, logsRes] = await Promise.allSettled([
        getEmployee(id),
        getMyAttendance({ employee_id: id, pageSize: 10 }),
        getMyLeaveBalance(),
        getLeaveAdjustmentLogs({ employee_id: id }),
      ]);

      const emp = empRes.value?.data || empRes.value?.employee || empRes.value;
      setEmployee(emp);

      setAttendance(attRes.value?.data || attRes.value?.attendance || []);
      setLeaveBalance(balanceRes.value?.data || balanceRes.value?.balance || balanceRes.value || null);
      setAdjustmentLogs(logsRes.value?.data || logsRes.value?.logs || []);
    } catch (err) {
      toast.error('Failed to load employee data');
      navigate('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      if (employee.status === 'active') {
        await deactivateEmployee(id);
        toast.success('Employee deactivated');
      } else {
        await activateEmployee(id);
        toast.success('Employee activated');
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
    setConfirmDialog(null);
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(id);
      toast.success('Password reset successfully. New password sent to employee email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
    setConfirmDialog(null);
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!adjustForm.reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setAdjustSubmitting(true);
    try {
      await adjustLeaveBalance({
        employee_id: id,
        leave_type: adjustForm.leave_type,
        adjustment_days: adjustForm.type === 'deduct' ? -Math.abs(adjustForm.days) : Math.abs(adjustForm.days),
        reason: adjustForm.reason,
      });
      toast.success('Leave balance adjusted');
      setShowAdjustModal(false);
      setAdjustForm({ leave_type: 'CL', days: 1, type: 'add', reason: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading employee details..." />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Employee not found.</p>
        <Link to="/admin/employees" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Employees
        </Link>
      </div>
    );
  }

  const attendanceColumns = [
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    { key: 'remarks', label: 'Remarks' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/employees" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-1 inline-block">
            &larr; Back to Employees
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{employee.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {employee.employee_id} &middot; {employee.department} &middot; <StatusBadge status={employee.role} /> &middot; <StatusBadge status={employee.status} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/employees/${id}`}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() =>
              setConfirmDialog({
                title: employee.status === 'active' ? 'Deactivate Employee' : 'Activate Employee',
                message: `Are you sure you want to ${employee.status === 'active' ? 'deactivate' : 'activate'} ${employee.name}?`,
                type: employee.status === 'active' ? 'danger' : 'warning',
                onConfirm: handleToggleStatus,
              })
            }
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              employee.status === 'active'
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50'
            }`}
          >
            {employee.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() =>
              setConfirmDialog({
                title: 'Reset Password',
                message: `Are you sure you want to reset the password for ${employee.name}? A new password will be sent to their email.`,
                type: 'warning',
                confirmText: 'Reset',
                onConfirm: handleResetPassword,
              })
            }
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* Employee info card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Name</span>
            <p className="text-slate-900 dark:text-white font-medium">{employee.name}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <p className="text-slate-900 dark:text-white font-medium">{employee.email}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Phone</span>
            <p className="text-slate-900 dark:text-white font-medium">{employee.phone || '-'}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Department</span>
            <p className="text-slate-900 dark:text-white font-medium">{employee.department}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Role</span>
            <p className="text-slate-900 dark:text-white font-medium">
              <StatusBadge status={employee.role} />
            </p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <p className="text-slate-900 dark:text-white font-medium">
              <StatusBadge status={employee.status} />
            </p>
          </div>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Leave Balances</h2>
        {leaveBalance ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['CL', 'SL'].map((type) => {
              const bal = leaveBalance[type.toLowerCase()] || leaveBalance[type] || {};
              const allocated = bal.allocated || bal.total || 0;
              const used = bal.used || 0;
              const remaining = bal.remaining || allocated - used;
              return (
                <div key={type} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{type} Leave</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Allocated:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{allocated}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Used:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{used}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Remaining:</span>
                      <span className="font-medium text-primary-600 dark:text-primary-400">{remaining}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No leave balance data available.</p>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Recent Attendance</h2>
        <DataTable
          columns={attendanceColumns}
          data={attendance}
          loading={false}
          emptyMessage="No attendance records found."
          searchable={false}
          sortable={false}
        />
      </div>

      {/* Leave Adjustment */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Leave Adjustment</h2>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Adjust Balance
          </button>
        </div>

        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recent Adjustment Logs</h3>
        {adjustmentLogs.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No adjustment logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Days</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Reason</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {adjustmentLogs.map((log, i) => (
                  <tr key={log.id || log._id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      <StatusBadge status={log.leave_type || log.type} />
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{log.days}</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">{log.reason || '-'}</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">{log.created_at || log.date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText || 'Confirm'}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Adjust Balance Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust Leave Balance" size="md">
        <form onSubmit={handleAdjustBalance} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Leave Type</label>
            <select
              value={adjustForm.leave_type}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, leave_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Adjustment Type</label>
            <select
              value={adjustForm.type}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="add">Add Days</option>
              <option value="deduct">Deduct Days</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Days</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={adjustForm.days}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, days: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reason <span className="text-red-500">*</span></label>
            <textarea
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
              rows={3}
              placeholder="Enter reason for adjustment"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={adjustSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {adjustSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {adjustSubmitting ? 'Saving...' : 'Save Adjustment'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
