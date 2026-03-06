import './PastelSelect.css';

export default function PastelSelect({
  label,
  options = [],
  error,
  hint,
  className = '',
  ...props
}) {
  return (
    <div className={`pastel-select-group ${error ? 'pastel-select-group--error' : ''} ${className}`}>
      {label && <label className="pastel-select__label">{label}</label>}
      <select className="pastel-select" {...props}>
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const display = typeof opt === 'string' ? opt : opt.label;
          return <option key={value} value={value}>{display}</option>;
        })}
      </select>
      {hint && !error && <span className="pastel-select__hint">{hint}</span>}
      {error && <span className="pastel-select__error">{error}</span>}
    </div>
  );
}
