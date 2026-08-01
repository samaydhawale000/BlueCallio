import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
  padding?: boolean;
}

export function Card({ children, glow = false, padding = true, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`relative rounded-xl border border-[#1A2642] bg-[#0D1421] overflow-hidden ${padding ? 'p-5' : ''} ${className}`}
      style={glow ? { boxShadow: '0 0 30px rgba(99,102,241,0.08), 0 0 60px rgba(139,92,246,0.04)' } : undefined}
    >
      {glow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.08), transparent 60%)' }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
