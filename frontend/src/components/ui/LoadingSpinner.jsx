const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export default function LoadingSpinner({ size = 'md', message }) {
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClass} rounded-full border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 animate-spin`}
      />
      {message && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
}
