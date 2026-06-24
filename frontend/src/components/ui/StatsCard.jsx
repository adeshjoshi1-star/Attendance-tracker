const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    icon: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

export default function StatsCard({ title, value, icon, color = 'indigo' }) {
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`rounded-xl border p-4 md:p-5 ${theme.bg} ${theme.border} transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <p className="mt-1 text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${theme.bg} ${theme.icon}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
