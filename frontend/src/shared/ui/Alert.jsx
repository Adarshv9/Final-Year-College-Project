import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const configs = {
  info: { icon: Info, classes: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' },
  success: { icon: CheckCircle, classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  error: { icon: XCircle, classes: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
};

export function Alert({ type = 'info', children, className = '' }) {
  const { icon: Icon, classes } = configs[type] || configs.info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${classes} ${className}`}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default Alert;
