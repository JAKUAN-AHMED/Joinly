interface AvatarProps {
  src?: string | null;
  name?: string;
  alt?: string;
  size?: number;
  className?: string;
}

/** Deterministic pastel palette so the same name always gets the same color. */
const PALETTE = [
  { bg: '#dcf1e2', text: '#1f7a4d' }, // green
  { bg: '#dbeafe', text: '#1d4ed8' }, // blue
  { bg: '#fdecd2', text: '#b7791f' }, // amber
  { bg: '#ede9fe', text: '#6d28d9' }, // violet
  { bg: '#fde3e2', text: '#dc2626' }, // red
  { bg: '#e0f2fe', text: '#0369a1' }, // sky
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function paletteFor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Real uploaded photo when available; otherwise a deterministic initials avatar — never a stock placeholder photo. */
export default function Avatar({ src, name = '', alt = '', size = 36, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const { bg, text } = paletteFor(name || alt || '?');
  return (
    <span
      role="img"
      aria-label={alt || name}
      style={{ width: size, height: size, backgroundColor: bg, color: text, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
    >
      {initialsOf(name || alt || '?')}
    </span>
  );
}
