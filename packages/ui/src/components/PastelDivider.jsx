import './PastelDivider.css';

export default function PastelDivider({ label, className = '' }) {
  return (
    <div className={`pastel-divider ${label ? 'pastel-divider--labeled' : ''} ${className}`}>
      {label && <span className="pastel-divider__label">{label}</span>}
    </div>
  );
}
