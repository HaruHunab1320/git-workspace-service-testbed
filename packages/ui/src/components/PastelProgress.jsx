import './PastelProgress.css';

export default function PastelProgress({
  value = 0,
  max = 100,
  variant = 'mint',
  size = 'md',
  label,
  showValue = false,
  className = '',
  ...props
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`pastel-progress ${className}`} {...props}>
      {(label || showValue) && (
        <div className="pastel-progress__header">
          {label && <span className="pastel-progress__label">{label}</span>}
          {showValue && <span className="pastel-progress__value">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`pastel-progress__track pastel-progress__track--${size}`}>
        <div
          className={`pastel-progress__fill pastel-progress__fill--${variant}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
