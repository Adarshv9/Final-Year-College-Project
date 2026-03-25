import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={[
          'bg-[#131929] border border-[#243047] rounded-2xl w-full shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          sizeClasses[size] || sizeClasses.md,
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2a3d]">
          <h2 className="text-lg font-bold text-[#e2e8f0]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a2236] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex gap-3 justify-end px-6 pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
