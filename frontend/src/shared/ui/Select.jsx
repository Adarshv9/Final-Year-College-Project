// Shared select component styled to match the rest of the form system.
import { forwardRef } from 'react';
import { inputBase } from './Input';

export const Select = forwardRef(function Select(
  { label, error, hint, className = '', id, required, children, placeholder, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#e2e8f0]">
          {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={[
          inputBase,
          'cursor-pointer',
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
          className,
        ].join(' ')}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '2rem',
          appearance: 'none',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
    </div>
  );
});

export default Select;
