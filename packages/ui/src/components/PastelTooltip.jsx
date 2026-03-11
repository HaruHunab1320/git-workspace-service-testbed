import { useState } from 'react';
import './PastelTooltip.css';

export default function PastelTooltip({
  children,
  text,
  position = 'top',
  className = '',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`pastel-tooltip-wrapper ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div className={`pastel-tooltip pastel-tooltip--${position}`}>
          {text}
        </div>
      )}
    </div>
  );
}
