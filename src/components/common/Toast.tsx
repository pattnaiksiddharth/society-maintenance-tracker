import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyle = 
    toast.type === 'success' 
      ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300' 
      : toast.type === 'error' 
      ? 'bg-slate-900/90 border-red-500/40 text-red-300' 
      : 'bg-slate-900/90 border-blue-500/40 text-blue-300';

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl backdrop-blur-xl border shadow-2xl shadow-black/50 transition-all transform translate-y-0 ${bgStyle}`}>
      {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
      {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
