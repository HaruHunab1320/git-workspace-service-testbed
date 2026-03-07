import './PastelButton.css';

const VARIANT_MAP = {
  mint: 'pastel-btn--mint',
  lavender: 'pastel-btn--lavender',
  blush: 'pastel-btn--blush',
  peach: 'pastel-btn--peach',
  sky: 'pastel-btn--sky',
  ghost: 'pastel-btn--ghost',
};

export default function PastelButton({
  children,
  variant = 'mint',
  size = 'md',
  icon,
  disabled,
  onClick,
  className = '',
  ...props
}) {
  const cls = [
    'pastel-btn',
    VARIANT_MAP[variant] || VARIANT_MAP.mint,
    `pastel-btn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} disabled={disabled} onClick={onClick} {...props}>
      {icon && <span className="pastel-btn__icon">{icon}</span>}
      {children}
    </button>
  );
}
