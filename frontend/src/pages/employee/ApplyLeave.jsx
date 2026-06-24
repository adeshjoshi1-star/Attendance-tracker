import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { differenceInDays, parseISO, isBefore, startOfToday } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getMyLeaveBalance } from '../../services/leaveService';
import { applyLeave } from '../../services/leaveService';

export default function ApplyLeave() {
  const navigate = useNavigate();

  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  const fetchLeaveBalance = async () => {
    setLoading(true);
    try {
      const res = await getMyLeaveBalance();
      setLeaveBalance(res?.balance || res?.data || res || null);
    } catch {
      toast.error('Failed to load leave balance');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = parseISO(form.start_date);
    const end = parseISO(form.end_date);
    if (isBefore(end, start)) return 0;
    return differenceInDays(end, start) + 1;
  };

  const validate = () => {
    const newErrors = {};
    const today = startOfToday();

    if (!form.leave_type) {
      newErrors.leave_type = 'Please select leave type';
    }

    if (!form.start_date) {
      newErrors.start_date = 'Start date is required';
    } else if (isBefore(parseISO(form.start_date), today)) {
      newErrors.start_date = 'Start date must be today or a future date';
    }

    if (!form.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (form.start_date && isBefore(parseISO(form.end_date), parseISO(form.start_date))) {
      newErrors.end_date = 'End date must be on or after start date';
    }

    if (!form.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (form.reason.trim().length < 10) {
      newErrors.reason = 'Please provide a detailed reason (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirm(false);
    try {
      await applyLeave({
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
      });
      toast.success('Leave applied successfully!');
      setForm({ leave_type: '', start_date: '', end_date: '', reason: '' });
      setTimeout(() => navigate('/employee/my-leaves'), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to apply leave');
    } finally {
      setSubmitting(false);
    }
  };

  const daysCount = calculateDays();

  const casualLeave = leaveBalance?.casual ?? { allocated: 0, remaining: 0 };
  const sickLeave = leaveBalance?.sick ?? { allocated: 0, remaining: 0 };

  const insufficientBalance =
    form.leave_type === 'Casual Leave' && daysCount > (casualLeave.remaining ?? 0) ||
    form.leave_type === 'Sick Leave' && daysCount > (sickLeave.remaining ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Apply for Leave</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Submit a leave request</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Casual Leave</p>
          <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">
            {casualLeave.remaining ?? 0}
            <span className="text-sm font-normal text-blue-600 dark:text-blue-400"> / {casualLeave.allocated ?? 0}</span>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {casualLeave.used ?? 0} used
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Sick Leave</p>
          <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-200">
            {sickLeave.remaining ?? 0}
            <span className="text-sm font-normal text-red-600 dark:text-red-400"> / {sickLeave.allocated ?? 0}</span>
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {sickLeave.used ?? 0} used
          </p>
        </div>
      </div>

      {insufficientBalance && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ You are applying for {daysCount} day(s) but only have{' '}
            {form.leave_type === 'casual_leave' ? casualLeave.remaining : sickLeave.remaining} leave(s) remaining.
            Your request may be subject to approval.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.leave_type}
            onChange={(e) => handleChange('leave_type', e.target.value)}
            disabled={submitting}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50 ${
              errors.leave_type ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Select leave type</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
          </select>
          {errors.leave_type && (
            <p className="mt-1 text-xs text-red-500">{errors.leave_type}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              disabled={submitting}
              min={formatToday()}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50 ${
                errors.start_date ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {errors.start_date && (
              <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              disabled={submitting}
              min={form.start_date || formatToday()}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50 ${
                errors.end_date ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {errors.end_date && (
              <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>
            )}
          </div>
        </div>

        {daysCount > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Duration: <span className="font-semibold text-slate-900 dark:text-white">{daysCount} day(s)</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            disabled={submitting}
            rows={4}
            placeholder="Please provide a detailed reason for your leave..."
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50 ${
              errors.reason ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitting && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Submit Leave Request
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Confirm Leave Request"
          message={`You are applying for ${daysCount} day(s) of ${form.leave_type} from ${form.start_date} to ${form.end_date}.`}
          confirmText="Submit"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirm(false)}
          type="warning"
        />
      )}
    </div>
  );
}

function formatToday() {
  return new Date().toISOString().split('T')[0];
}
