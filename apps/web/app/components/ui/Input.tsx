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
          <label className="text-sm font-medium text-[#4B4560]">{label}</label>
        )}
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-3 py-2.5 rounded-lg text-sm text-[#170B2E] placeholder:text-[#9C93AC]
            bg-white border outline-none transition-all
            ${error
              ? 'border-red-500/50 focus:border-red-500/70'
              : 'border-[#D6C4EE] focus:border-[#7F40E8]/60 focus:shadow-[0_0_0_3px_rgba(127,64,232,0.1)]'
            }
            ${className}
          `}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helper && !error && <p className="text-xs text-[#8A8298]">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
