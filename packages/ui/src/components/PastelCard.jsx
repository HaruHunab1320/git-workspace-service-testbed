import './PastelCard.css';

const GLOW_MAP = {
  lavender: 'pastel-card--glow-lavender',
  mint: 'pastel-card--glow-mint',
  blush: 'pastel-card--glow-blush',
};

export default function PastelCard({
  children,
  title,
  icon,
  glow,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}) {
  const cls = [
    'pastel-card',
    `pastel-card--pad-${padding}`,
    hoverable && 'pastel-card--hoverable',
    glow && (GLOW_MAP[glow] || ''),
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} {...props}>
      {title && (
        <div className="pastel-card__header">
          {icon && <span className="pastel-card__icon">{icon}</span>}
          <h3 className="pastel-card__title">{title}</h3>
        </div>
      )}
      <div className="pastel-card__body">{children}</div>
    </div>
  );
}
