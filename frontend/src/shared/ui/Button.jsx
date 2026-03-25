import { forwardRef } from 'react';

const variants = {
  primary: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-[#1a2236] hover:bg-[#243047] text-[#e2e8f0] border border-[#1e2a3d] hover:border-[#243047]',
  ghost: 'bg-transparent hover:bg-[#1a2236] text-[#94a3b8] hover:text-[#e2e8f0]',
  danger: 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-transparent',
  success: 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-transparent',
  outline: 'bg-transparent border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
  'icon-sm': 'h-7 w-7 p-0',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, disabled, loading, full, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center',
        'rounded-lg font-semibold transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'whitespace-nowrap select-none',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          {children}
        </>
      ) : children}
    </button>
  );
});

export default Button;
