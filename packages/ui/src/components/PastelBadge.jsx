import './PastelBadge.css';

const VARIANT_MAP = {
  mint: 'pastel-badge--mint',
  lavender: 'pastel-badge--lavender',
  blush: 'pastel-badge--blush',
  peach: 'pastel-badge--peach',
  sky: 'pastel-badge--sky',
  lemon: 'pastel-badge--lemon',
};

export default function PastelBadge({
  children,
  variant = 'lavender',
  icon,
  size = 'md',
  className = '',
  ...props
}) {
  const cls = [
    'pastel-badge',
    VARIANT_MAP[variant] || VARIANT_MAP.lavender,
    `pastel-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} {...props}>
      {icon && <span className="pastel-badge__icon">{icon}</span>}
      {children}
    </span>
  );
}
