// Simple card wrapper used to group content with consistent surface styling.
export function Card({ children, className = '', hover = false, padding = true }) {
  return (
    <div
      className={[
        'bg-[#131929] border border-[#1e2a3d] rounded-xl transition-all duration-200',
        hover ? 'hover:border-[#243047] hover:shadow-lg cursor-pointer hover:-translate-y-0.5' : '',
        padding ? 'p-6' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-[#e2e8f0] ${className}`}>
      {children}
    </h3>
  );
}

export default Card;
