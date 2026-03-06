import './PastelTabs.css';

export default function PastelTabs({
  tabs = [],
  activeId,
  onChange,
  variant = 'underline',
  className = '',
}) {
  return (
    <div className={`pastel-tabs pastel-tabs--${variant} ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`pastel-tab ${activeId === tab.id ? 'pastel-tab--active' : ''}`}
          onClick={() => onChange?.(tab.id)}
          role="tab"
          aria-selected={activeId === tab.id}
        >
          {tab.icon && <span className="pastel-tab__icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
