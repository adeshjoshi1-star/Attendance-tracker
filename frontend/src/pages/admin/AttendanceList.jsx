import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import FilterBar from '../../components/ui/FilterBar';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  getAllAttendance,
  getPendingAttendance,
  updateAttendance,
} from '../../services/attendanceService';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export default function AttendanceList() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [filters, setFilters] = useState({ date: getTodayString() });
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', reason: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const res = await getAllAttendance(params);
      setAttendance(res.data || res.attendance || []);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await getPendingAttendance();
      setPending(res.data || res.attendance || []);
    } catch (err) {
      // pending may not exist
      setPending([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchPending();
  }, [fetchAttendance, fetchPending]);

  const handleEdit = (record) => {
    setEditModal(record);
    setEditForm({ status: record.status || '', reason: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.status) {
      toast.error('Please select a status');
      return;
    }
    setEditSubmitting(true);
    try {
      const payload = { status: editForm.status };
      if (editForm.reason.trim()) {
        payload.reason = editForm.reason;
      }
      await updateAttendance(editModal.id || editModal._id, payload);
      toast.success('Attendance updated');
      setEditModal(null);
      fetchAttendance();
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams(filters).toString();
    window.open(`/api/reports/export/daily?${params}`, '_blank');
  };

  const filterConfig = [
    {
      key: 'date',
      label: 'Date',
      type: 'date',
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { value: 'Sales', label: 'Sales' },
        { value: 'Operations', label: 'Operations' },
        { value: 'Quality', label: 'Quality' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'present', label: 'Present' },
        { value: 'absent', label: 'Absent' },
        { value: 'half_day', label: 'Half Day' },
        { value: 'work_from_home', label: 'Work From Home' },
        { value: 'late', label: 'Late' },
        { value: 'on_leave', label: 'On Leave' },
        { value: 'holiday', label: 'Holiday' },
      ],
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text',
    },
  ];

  const columns = [
    {
      key: 'employee_name',
      label: 'Employee',
      render: (_, row) => row.employee?.name || row.employee_name || 'N/A',
    },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) => row.employee?.department || row.department || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleEdit(row)}
          className="px-2 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and manage attendance records</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          Export
        </button>
      </div>

      {/* Pending attendance section */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            Pending Attendance ({pending.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {pending.slice(0, 10).map((rec) => (
              <span
                key={rec.id || rec._id}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded-full"
              >
                {rec.employee?.name || rec.employee_name || 'Unknown'}
              </span>
            ))}
            {pending.length > 10 && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                +{pending.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      <FilterBar filters={filterConfig} onFilter={setFilters} />

      <DataTable
        columns={columns}
        data={attendance}
        loading={loading}
        emptyMessage="No attendance records found."
        searchable={false}
      />

      {/* Edit Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Attendance" size="sm">
        <form onSubmit={handleUpdate} className="space-y-4">
          {editModal && (
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Employee:</span> {editModal.employee?.name || editModal.employee_name}
              </p>
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Date:</span> {editModal.date}
              </p>
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Current Status:</span>{' '}
                <StatusBadge status={editModal.status} />
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="work_from_home">Work From Home</option>
              <option value="late">Late</option>
              <option value="on_leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reason (for edit log)</label>
            <textarea
              value={editForm.reason}
              onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
              rows={3}
              placeholder="Enter reason for change"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {editSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {editSubmitting ? 'Updating...' : 'Update'}
            </button>
            <button
              type="button"
              onClick={() => setEditModal(null)}
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
