import './PastelAvatar.css';

const BG_COLORS = [
  'var(--pastel-lavender, #e8d5f5)',
  'var(--pastel-mint, #d5f0e0)',
  'var(--pastel-blush, #f5d5d5)',
  'var(--pastel-peach, #f5e0d0)',
  'var(--pastel-sky, #d5e8f5)',
  'var(--pastel-lemon, #f5f0d0)',
];

function hashName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
  }
  return Math.abs(hash);
}

export default function PastelAvatar({
  name = '',
  emoji,
  size = 'md',
  className = '',
  ...props
}) {
  const bgColor = BG_COLORS[hashName(name) % BG_COLORS.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={`pastel-avatar pastel-avatar--${size} ${className}`}
      style={{ background: bgColor }}
      title={name}
      {...props}
    >
      {emoji || initials || '?'}
    </div>
  );
}
