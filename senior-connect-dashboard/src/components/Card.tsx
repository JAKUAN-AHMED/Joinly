import type { CSSProperties, PropsWithChildren } from 'react';

export default function Card({
  className = '',
  style,
  children,
}: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return (
    <div style={style} className={`rounded-2xl border border-line bg-card ${className}`}>
      {children}
    </div>
  );
}
