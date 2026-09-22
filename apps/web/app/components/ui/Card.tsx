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
      className={`relative rounded-xl border border-[#E7DFF5] bg-white overflow-hidden ${padding ? 'p-5' : ''} ${className}`}
      style={glow ? { boxShadow: '0 0 30px rgba(127,64,232,0.08), 0 0 60px rgba(65,6,134,0.04)' } : undefined}
    >
      {glow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(127,64,232,0.06), transparent 60%)' }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
