// Render the card component.

export function Card({ children, className = '', hover = false, padding = true }) {
  return (
    <div
      className={[
      'bg-white border border-slate-200 rounded-xl transition-all duration-200',
      hover ? 'hover:border-slate-300 hover:shadow-lg cursor-pointer hover:-translate-y-0.5' : '',
      padding ? 'p-6' : '',
      className].
      join(' ')}>
      
      {children}
    </div>);

}

// Render the card header component.
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>);

}

// Render the card title component.
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>);

}

export default Card;