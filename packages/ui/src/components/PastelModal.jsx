import { useEffect, useCallback } from 'react';
import './PastelModal.css';

export default function PastelModal({
  open,
  onClose,
  title,
  icon,
  children,
  actions,
  size = 'md',
  className = '',
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="pastel-modal__overlay" onClick={onClose}>
      <div
        className={`pastel-modal pastel-modal--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="pastel-modal__header">
            {icon && <span className="pastel-modal__icon">{icon}</span>}
            <h2 className="pastel-modal__title">{title}</h2>
          </div>
        )}
        <div className="pastel-modal__body">{children}</div>
        {actions && <div className="pastel-modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
