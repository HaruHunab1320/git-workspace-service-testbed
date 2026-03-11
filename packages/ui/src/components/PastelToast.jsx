import { useEffect } from 'react';
import './PastelToast.css';

const VARIANT_MAP = {
  info: 'pastel-toast--info',
  success: 'pastel-toast--success',
  warning: 'pastel-toast--warning',
  error: 'pastel-toast--error',
};

export default function PastelToast({
  message,
  variant = 'info',
  icon,
  duration = 3000,
  onDismiss,
  visible = true,
}) {
  useEffect(() => {
    if (visible && duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div className={`pastel-toast ${VARIANT_MAP[variant] || VARIANT_MAP.info}`}>
      {icon && <span className="pastel-toast__icon">{icon}</span>}
      <span className="pastel-toast__message">{message}</span>
      {onDismiss && (
        <button
          className="pastel-toast__close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          x
        </button>
      )}
    </div>
  );
}
