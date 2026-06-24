import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getMyLeaves, getMyLeaveBalance } from '../../services/leaveService';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TAB_LEAVE_REQUESTS = 'requests';
const TAB_LEAVE_BALANCE = 'balance';

export default function MyLeaves() {
  const [activeTab, setActiveTab] = useState(TAB_LEAVE_REQUESTS);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 15;

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
      };
      if (statusFilter) params.status = statusFilter;

      const res = await getMyLeaves(params);
      const d = res?.data || res?.leaves || [];
      setLeaves(d);
      const total = res?.total || res?.pagination?.total || 0;
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  const fetchLeaveBalance = useCallback(async () => {
    try {
      const res = await getMyLeaveBalance();
      setLeaveBalance(res?.balance || res?.data || res || null);
    } catch {
      toast.error('Failed to load leave balance');
    }
  }, []);

  useEffect(() => {
    if (activeTab === TAB_LEAVE_REQUESTS) {
      fetchLeaves();
    } else {
      fetchLeaveBalance();
    }
  }, [activeTab, fetchLeaves, fetchLeaveBalance]);

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const columns = [
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (val) => (val ? format(new Date(val), 'MMM dd, yyyy') : 'N/A'),
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (val) => (val ? format(new Date(val), 'MMM dd, yyyy') : 'N/A'),
    },
    {
      key: 'days',
      label: 'Days',
      render: (val) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">{val ?? '-'}</span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => (
        <span className="text-slate-500 dark:text-slate-400 max-w-[200px] truncate block">
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'approved_by',
      label: 'Approved By',
      render: (val) => (
        <span className="text-slate-600 dark:text-slate-400">{val || '-'}</span>
      ),
    },
  ];

  const casualLeave = leaveBalance?.casual_leave ?? leaveBalance?.casualLeave ?? {};
  const sickLeave = leaveBalance?.sick_leave ?? leaveBalance?.sickLeave ?? {};

  const renderLeaveRequests = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by status:</span>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading leave requests..." />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={leaves}
            loading={false}
            searchable={false}
            sortable={false}
            pageSize={leaves.length || 10}
            pageSizeOptions={[leaves.length || 10]}
            emptyMessage={
              statusFilter
                ? `No ${statusFilter} leave requests found.`
                : 'No leave requests found.'
            }
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

  const renderLeaveBalance = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏖️</span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Casual Leave</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Allocated</span>
            <span className="font-medium text-slate-900 dark:text-white">{casualLeave.allocated ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Used</span>
            <span className="font-medium text-slate-900 dark:text-white">{casualLeave.used ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Remaining</span>
            <span className="font-medium text-lg text-primary-600 dark:text-primary-400">{casualLeave.remaining ?? 0}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all"
              style={{
                width: `${casualLeave.allocated ? Math.min(((casualLeave.used ?? 0) / casualLeave.allocated) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏥</span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sick Leave</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Allocated</span>
            <span className="font-medium text-slate-900 dark:text-white">{sickLeave.allocated ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Used</span>
            <span className="font-medium text-slate-900 dark:text-white">{sickLeave.used ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Remaining</span>
            <span className="font-medium text-lg text-red-600 dark:text-red-400">{sickLeave.remaining ?? 0}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all"
              style={{
                width: `${sickLeave.allocated ? Math.min(((sickLeave.used ?? 0) / sickLeave.allocated) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Leaves</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your leave requests and view balance</p>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab(TAB_LEAVE_REQUESTS)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === TAB_LEAVE_REQUESTS
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            My Leave Requests
          </button>
          <button
            onClick={() => setActiveTab(TAB_LEAVE_BALANCE)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === TAB_LEAVE_BALANCE
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Leave Balance
          </button>
        </div>
      </div>

      {activeTab === TAB_LEAVE_REQUESTS ? renderLeaveRequests() : renderLeaveBalance()}
    </div>
  );
}
