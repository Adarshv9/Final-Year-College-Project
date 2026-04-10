// Small badge component for compact status and category labels.
const variants = {
  default: 'bg-[#1a2236] text-[#94a3b8]',
  accent: 'bg-indigo-500/15 text-indigo-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger: 'bg-rose-500/15 text-rose-400',
  pending: 'bg-amber-500/15 text-amber-400',
  accepted: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-rose-500/15 text-rose-400',
};

const statusMap = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
  active: 'success',
  inactive: 'default',
  verified: 'success',
  'full-time': 'accent',
  'part-time': 'accent',
  internship: 'warning',
  contract: 'default',
  remote: 'success',
  onsite: 'accent',
  hybrid: 'warning',
};

export function Badge({ children, variant, className = '' }) {
  const v = variant || statusMap[children?.toString().toLowerCase()] || 'default';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        variants[v] || variants.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export default Badge;
