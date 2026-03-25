import { forwardRef } from 'react';
import { inputBase } from './Input';

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', id, required, rows = 4, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#e2e8f0]">
          {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={[
          inputBase,
          'resize-y min-h-[100px]',
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
    </div>
  );
});

export default Textarea;
