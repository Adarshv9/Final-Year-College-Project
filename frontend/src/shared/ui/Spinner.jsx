// Spinner utilities for inline loading states and full-page loaders.
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
  };
  return (
    <div
      className={[
        'rounded-full border-[#243047] border-t-indigo-500 animate-spin',
        sizes[size] || sizes.md,
        className,
      ].join(' ')}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0f1a]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-[#64748b]">Loading…</p>
      </div>
    </div>
  );
}

export default Spinner;
