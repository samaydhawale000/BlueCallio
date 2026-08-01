import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-300">{label}</label>
        )}
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-3 py-2.5 rounded-lg text-sm text-slate-100 placeholder:text-slate-600
            bg-[#0D1421] border outline-none transition-all
            ${error
              ? 'border-red-500/50 focus:border-red-500/70'
              : 'border-[#1A2642] focus:border-[#6366F1]/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
            }
            ${className}
          `}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
