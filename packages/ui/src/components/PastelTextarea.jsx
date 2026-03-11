import './PastelTextarea.css';

export default function PastelTextarea({
  label,
  error,
  hint,
  className = '',
  ...props
}) {
  return (
    <div
      className={`pastel-textarea-group ${error ? 'pastel-textarea-group--error' : ''} ${className}`}
    >
      {label && <label className="pastel-textarea__label">{label}</label>}
      <textarea className="pastel-textarea" {...props} />
      {hint && !error && <span className="pastel-textarea__hint">{hint}</span>}
      {error && <span className="pastel-textarea__error">{error}</span>}
    </div>
  );
}
