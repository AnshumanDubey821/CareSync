import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 icon-emerald',
    error: 'bg-rose-50 text-rose-800 border-rose-200 icon-rose',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 icon-amber',
    info: 'bg-sky-50 text-sky-800 border-sky-200 icon-sky',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 max-w-md ${typeStyles[type] || typeStyles.info}`}>
      {icons[type]}
      <p className="text-sm font-semibold flex-1">{message}</p>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
        <X className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
};

export default Toast;
