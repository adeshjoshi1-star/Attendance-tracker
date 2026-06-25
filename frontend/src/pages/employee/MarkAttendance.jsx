import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getTodayStatus, markAttendance } from '../../services/attendanceService';

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present', color: 'bg-green-500 hover:bg-green-600', icon: '✅' },
  { value: 'Work From Home', label: 'Work From Home', color: 'bg-blue-500 hover:bg-blue-600', icon: '🏠' },
  { value: 'Half Day', label: 'Half Day', color: 'bg-yellow-500 hover:bg-yellow-600', icon: '🌗' },
  { value: 'Casual Leave', label: 'Casual Leave', color: 'bg-orange-500 hover:bg-orange-600', icon: '🏖️' },
  { value: 'Sick Leave', label: 'Sick Leave', color: 'bg-red-500 hover:bg-red-600', icon: '🏥' },
  { value: 'Absent', label: 'Absent', color: 'bg-slate-500 hover:bg-slate-600', icon: '❌' },
];

function formatToday() {
  return new Date().toISOString().split('T')[0];
}

const TODAY = formatToday();

export default function MarkAttendance() {
  const navigate = useNavigate();

  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    setLoading(true);
    try {
      const res = await getTodayStatus();
      const data = res?.attendance || res?.data || res || null;
      setTodayStatus(data);
      if (data?.status) {
        setSelectedStatus(data.status);
        setRemarks(data.remarks || '');
      }
    } catch {
      setTodayStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirm(false);
    try {
      await markAttendance(selectedStatus, remarks, TODAY);
      toast.success(todayStatus?.status ? 'Attendance updated successfully!' : 'Attendance marked successfully!');
      setTimeout(() => navigate('/employee/dashboard'), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Checking today's status..." />
      </div>
    );
  }

  const isAlreadyMarked = todayStatus && todayStatus.status;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mark Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAlreadyMarked ? 'Update your attendance for today' : 'Record your attendance for today'}
        </p>
      </div>

      {isAlreadyMarked && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Status</p>
              <div className="mt-1">
                <StatusBadge status={todayStatus.status} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            You have already marked attendance for today. You can update it below.
          </p>
        </div>
      )}

      {!isAlreadyMarked && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Select your status:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                disabled={submitting}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl text-white font-medium transition-all ${
                  opt.color
                } ${
                  selectedStatus === opt.value
                    ? 'ring-4 ring-white dark:ring-slate-900 ring-offset-2 ring-offset-current scale-105'
                    : 'opacity-80 hover:opacity-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(isAlreadyMarked || selectedStatus) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50"
            >
              <option value="">Select status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remarks <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedStatus}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isAlreadyMarked ? 'Update Attendance' : 'Mark Attendance'}
          </button>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          title={isAlreadyMarked ? 'Update Attendance' : 'Confirm Attendance'}
          message={`Are you sure you want to mark today as "${STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label}"?`}
          confirmText={isAlreadyMarked ? 'Update' : 'Confirm'}
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirm(false)}
          type="warning"
        />
      )}
    </div>
  );
}
