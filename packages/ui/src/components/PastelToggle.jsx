import './PastelToggle.css';

export default function PastelToggle({
  checked = false,
  onChange,
  label,
  variant = 'mint',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <label className={`pastel-toggle ${disabled ? 'pastel-toggle--disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        className="pastel-toggle__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <span className={`pastel-toggle__track pastel-toggle__track--${variant}`}>
        <span className="pastel-toggle__thumb" />
      </span>
      {label && <span className="pastel-toggle__label">{label}</span>}
    </label>
  );
}
