import './PastelInput.css';

export default function PastelInput({
  label,
  icon,
  error,
  hint,
  className = '',
  ...props
}) {
  return (
    <div className={`pastel-input-group ${error ? 'pastel-input-group--error' : ''} ${className}`}>
      {label && <label className="pastel-input__label">{label}</label>}
      <div className="pastel-input__wrapper">
        {icon && <span className="pastel-input__icon">{icon}</span>}
        <input
          className={`pastel-input ${icon ? 'pastel-input--with-icon' : ''}`}
          {...props}
        />
      </div>
      {hint && !error && <span className="pastel-input__hint">{hint}</span>}
      {error && <span className="pastel-input__error">{error}</span>}
    </div>
  );
}
