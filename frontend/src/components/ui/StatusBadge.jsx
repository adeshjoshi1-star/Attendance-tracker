const statusColorMap = {
  present: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
  'work from home': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  wfh: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  holiday: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
  on_leave: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
  onleave: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  late: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
  half_day: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400',
};

export default function StatusBadge({ status }) {
  const normalized = status?.toString().toLowerCase().trim() || '';
  const colorClass =
    statusColorMap[normalized] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';

  const displayText = normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {displayText}
    </span>
  );
}
