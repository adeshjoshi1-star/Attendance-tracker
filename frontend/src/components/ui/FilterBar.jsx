import { useState } from 'react';

export default function FilterBar({ filters = [], onFilter }) {
  const [values, setValues] = useState(() => {
    const initial = {};
    filters.forEach((f) => {
      initial[f.key] = '';
    });
    return initial;
  });

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    const cleaned = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== '' && v != null) cleaned[k] = v;
    });
    onFilter?.(cleaned);
  };

  const handleReset = () => {
    const reset = {};
    filters.forEach((f) => {
      reset[f.key] = '';
    });
    setValues(reset);
    onFilter?.({});
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex flex-wrap items-end gap-3">
        {filters.map((filter) => (
          <div key={filter.key} className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {filter.label}
            </label>
            {filter.type === 'select' ? (
              <select
                value={values[filter.key] || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              >
                <option value="">All</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : filter.type === 'date' ? (
              <input
                type="date"
                value={values[filter.key] || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              />
            ) : (
              <input
                type="text"
                placeholder={`Filter ${filter.label.toLowerCase()}...`}
                value={values[filter.key] || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              />
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
