import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  getNotifications,
  getAttendanceReminders,
  getLeaveNotifications,
  getWfhAlerts,
  markAsRead,
  markAllAsRead,
} from '../../services/notificationService';
import { approveLeave, rejectLeave } from '../../services/leaveService';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'attendance', label: 'Attendance Reminders' },
  { key: 'leaves', label: 'Leave Requests' },
  { key: 'wfh', label: 'WFH Alerts' },
];

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  switch (type?.toLowerCase()) {
    case 'attendance':
    case 'attendance_reminder':
      return '⏰';
    case 'leave':
    case 'leave_request':
    case 'leave_notification':
      return '📋';
    case 'wfh':
    case 'wfh_alert':
      return '🏠';
    default:
      return '🔔';
  }
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');

  // All notifications
  const [allNotifications, setAllNotifications] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allPage, setAllPage] = useState(1);
  const [allTotalPages, setAllTotalPages] = useState(1);

  // Attendance reminders
  const [reminders, setReminders] = useState([]);
  const [remLoading, setRemLoading] = useState(false);

  // Leave notifications
  const [leaveNotifs, setLeaveNotifs] = useState([]);
  const [leaveNotifLoading, setLeaveNotifLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // WFH alerts
  const [wfhAlerts, setWfhAlerts] = useState([]);
  const [wfhLoading, setWfhLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await getNotifications({ page: allPage, pageSize: 10 });
      setAllNotifications(res.data || res.notifications || []);
      if (res.totalPages) setAllTotalPages(res.totalPages);
      if (res.total) setAllTotalPages(Math.ceil(res.total / 10));
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setAllLoading(false);
    }
  }, [allPage]);

  const fetchReminders = useCallback(async () => {
    setRemLoading(true);
    try {
      const res = await getAttendanceReminders();
      setReminders(res.data || res.employees || []);
    } catch (err) {
      toast.error('Failed to load attendance reminders');
    } finally {
      setRemLoading(false);
    }
  }, []);

  const fetchLeaveNotifs = useCallback(async () => {
    setLeaveNotifLoading(true);
    try {
      const res = await getLeaveNotifications();
      setLeaveNotifs(res.data || res.notifications || res.leaves || []);
    } catch (err) {
      toast.error('Failed to load leave notifications');
    } finally {
      setLeaveNotifLoading(false);
    }
  }, []);

  const fetchWfh = useCallback(async () => {
    setWfhLoading(true);
    try {
      const res = await getWfhAlerts();
      setWfhAlerts(res.data || res.alerts || []);
    } catch (err) {
      toast.error('Failed to load WFH alerts');
    } finally {
      setWfhLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'all') fetchAll();
  }, [activeTab, fetchAll]);

  useEffect(() => {
    if (activeTab === 'attendance') fetchReminders();
  }, [activeTab, fetchReminders]);

  useEffect(() => {
    if (activeTab === 'leaves') fetchLeaveNotifs();
  }, [activeTab, fetchLeaveNotifs]);

  useEffect(() => {
    if (activeTab === 'wfh') fetchWfh();
  }, [activeTab, fetchWfh]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true, is_read: true } : n))
      );
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await approveLeave(id);
      toast.success('Leave request approved');
      fetchLeaveNotifs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleRejectLeave = async () => {
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
      fetchLeaveNotifs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject leave');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const remindersColumns = [
    {
      key: 'employee_name',
      label: 'Employee Name',
      render: (val, row) => val || row.employee?.name || row.name || 'N/A',
    },
    {
      key: 'department',
      label: 'Department',
      render: (val, row) => val || row.employee?.department || '-',
    },
  ];

  const leaveNotifsColumns = [
    {
      key: 'employee_name',
      label: 'Employee Name',
      render: (val, row) => val || row.employee?.name || row.name || 'N/A',
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (val, row) => <StatusBadge status={val || row.type || 'pending'} />,
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (_, row) => `${row.start_date || row.startDate || ''} to ${row.end_date || row.endDate || ''}`,
    },
    {
      key: 'days',
      label: 'Days',
      render: (val, row) => val ?? row.total_days ?? row.days ?? 1,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleApproveLeave(row.id || row._id)}
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

  const wfhColumns = [
    {
      key: 'employee_name',
      label: 'Employee Name',
      render: (val, row) => val || row.employee?.name || row.name || 'N/A',
    },
    {
      key: 'department',
      label: 'Department',
      render: (val, row) => val || row.employee?.department || '-',
    },
    {
      key: 'wfh_days',
      label: 'Total WFH Days This Month',
      render: (val, row) => {
        const days = val ?? row.count ?? row.wfhDays ?? row.total_wfh ?? 0;
        const isExceeded = days > (row.limit || 5);
        return (
          <span className={`font-medium ${isExceeded ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {days}
            {isExceeded && <span className="ml-1 text-red-500">(Exceeded)</span>}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage notifications and alerts</p>
        </div>
        {activeTab === 'all' && allNotifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
          >
            Mark All as Read
          </button>
        )}
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

      {/* All Notifications */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {allLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" message="Loading notifications..." />
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No notifications.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allNotifications.map((notif) => {
                const notifId = notif.id || notif._id;
                const isUnread = !(notif.read || notif.is_read);
                return (
                  <div
                    key={notifId}
                    onClick={() => isUnread && handleMarkAsRead(notifId)}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      isUnread
                        ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notif.type || notif.notification_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                          )}
                          <p
                            className={`text-sm ${
                              isUnread
                                ? 'font-semibold text-slate-900 dark:text-white'
                                : 'font-medium text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {notif.title || notif.subject || 'Notification'}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">
                          {getRelativeTime(notif.created_at || notif.createdAt || notif.date)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {notif.message || notif.body || notif.description || ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {allTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                disabled={allPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {allPage} of {allTotalPages}
              </span>
              <button
                onClick={() => setAllPage((p) => Math.min(allTotalPages, p + 1))}
                disabled={allPage === allTotalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attendance Reminders */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={fetchReminders}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              Refresh
            </button>
          </div>
          <DataTable
            columns={remindersColumns}
            data={reminders}
            loading={remLoading}
            emptyMessage="All employees have marked attendance today."
            searchable={false}
          />
        </div>
      )}

      {/* Leave Requests */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <DataTable
            columns={leaveNotifsColumns}
            data={leaveNotifs}
            loading={leaveNotifLoading}
            emptyMessage="No pending leave requests."
            searchable={false}
          />
        </div>
      )}

      {/* WFH Alerts */}
      {activeTab === 'wfh' && (
        <div className="space-y-4">
          <DataTable
            columns={wfhColumns}
            data={wfhAlerts}
            loading={wfhLoading}
            emptyMessage="No WFH alerts at this time."
            searchable={false}
          />
        </div>
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
              onClick={handleRejectLeave}
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
