import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import FilterBar from '../../components/ui/FilterBar';
import {
  getPendingLeaves,
  getAllLeaves,
  getLeaveAdjustmentLogs,
  approveLeave,
  rejectLeave,
} from '../../services/leaveService';

const tabs = [
  { key: 'pending', label: 'Pending Requests' },
  { key: 'all', label: 'All Requests' },
  { key: 'logs', label: 'Adjustment Logs' },
];

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [adjustmentLogs, setAdjustmentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const res = await getPendingLeaves();
        setPendingLeaves(res.data || res.leaves || []);
      } else if (activeTab === 'all') {
        const res = await getAllLeaves(filters);
        setAllLeaves(res.data || res.leaves || []);
      } else {
        const res = await getLeaveAdjustmentLogs(filters);
        setAdjustmentLogs(res.data || res.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      await approveLeave(id);
      toast.success('Leave request approved');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
    setConfirmDialog(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setRejectSubmitting(true);
    try {
      await rejectLeave(rejectModal.id, rejectReason);
      toast.success('Leave request rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const pendingColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => row.employee?.name || row.employee_name || 'N/A',
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (val) => <StatusBadge status={val || row.type} />,
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (_, row) => `${row.start_date || row.startDate} to ${row.end_date || row.endDate}`,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => (
        <span className="max-w-[200px] truncate block" title={val}>
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setConfirmDialog({
                title: 'Approve Leave',
                message: `Are you sure you want to approve this leave request?`,
                type: 'warning',
                confirmText: 'Approve',
                onConfirm: () => handleApprove(row.id || row._id),
              })
            }
            className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => setRejectModal({ id: row.id || row._id })}
            className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  const allColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => row.employee?.name || row.employee_name || 'N/A',
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (val, row) => <StatusBadge status={val || row.type} />,
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (_, row) => `${row.start_date || row.startDate} to ${row.end_date || row.endDate}`,
    },
    { key: 'reason', label: 'Reason' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const logsColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => row.employee?.name || row.employee_name || 'N/A',
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (val, row) => <StatusBadge status={val || row.type} />,
    },
    { key: 'days', label: 'Days' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'admin',
      label: 'Adjusted By',
      render: (_, row) => row.admin?.name || row.admin_name || row.admin || 'N/A',
    },
    { key: 'created_at', label: 'Date', render: (val, row) => val || row.date || '-' },
  ];

  const allFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      key: 'start_date',
      label: 'From Date',
      type: 'date',
    },
    {
      key: 'end_date',
      label: 'To Date',
      type: 'date',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage leave requests and adjustments</p>
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

      {activeTab === 'all' && <FilterBar filters={allFilters} onFilter={setFilters} />}

      {/* Pending tab */}
      {activeTab === 'pending' && (
        <DataTable
          columns={pendingColumns}
          data={pendingLeaves}
          loading={loading}
          emptyMessage="No pending leave requests."
          searchable={false}
        />
      )}

      {/* All tab */}
      {activeTab === 'all' && (
        <DataTable
          columns={allColumns}
          data={allLeaves}
          loading={loading}
          emptyMessage="No leave requests found."
          searchable={false}
        />
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <DataTable
          columns={logsColumns}
          data={adjustmentLogs}
          loading={loading}
          emptyMessage="No adjustment logs found."
          searchable={false}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Leave Request" size="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={rejectSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {rejectSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {rejectSubmitting ? 'Rejecting...' : 'Reject'}
            </button>
            <button
              onClick={() => {
                setRejectModal(null);
                setRejectReason('');
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
