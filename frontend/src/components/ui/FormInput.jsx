export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  options = [],
  placeholder,
  disabled = false,
  className = '',
}) {
  const baseClass =
    'w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const errorClass = error
    ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-slate-300 dark:border-slate-600';

  const inputId = `field-${name}`;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${baseClass} ${errorClass} ${className}`}
          >
            <option value="">Select {label?.toLowerCase() || 'option'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            className={`${baseClass} ${errorClass} ${className}`}
          />
        );

      default:
        return (
          <input
            id={inputId}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            className={`${baseClass} ${errorClass} ${className}`}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
