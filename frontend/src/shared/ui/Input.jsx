import { forwardRef } from 'react';

export const inputBase = 'w-full bg-[#0b0f1a] border border-[#1e2a3d] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef(function Input(
  { label, error, hint, leftIcon: LeftIcon, rightElement, className = '', id, required, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#e2e8f0]">
          {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none">
            <LeftIcon size={16} />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            inputBase,
            LeftIcon ? 'pl-9' : '',
            rightElement ? 'pr-9' : '',
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
    </div>
  );
});

export default Input;
