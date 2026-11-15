import React from 'react';
import type { ToastMessage } from '../../types';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon = {
          success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
          error: <AlertCircle size={18} className="text-rose-500 shrink-0" />,
          warning: <TriangleAlert size={18} className="text-amber-500 shrink-0" />,
          info: <Info size={18} className="text-indigo-500 shrink-0" />,
        }[toast.type];

        const bgBorder = {
          success: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/50',
          error: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800/50',
          warning: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/50',
          info: 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/50',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${bgBorder} animate-in slide-in-from-bottom-3 duration-200`}
            role="status"
          >
            {icon}
            <div className="flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug">
              {toast.text}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
