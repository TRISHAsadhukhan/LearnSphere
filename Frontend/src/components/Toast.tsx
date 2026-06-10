import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" id="global-toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgClass = 'bg-brand-dark';
          let Icon = Info;
          if (toast.type === 'success') {
            bgClass = 'bg-[#0F8B8D]';
            Icon = CheckCircle;
          } else if (toast.type === 'error') {
            bgClass = 'bg-[#A8201A]';
            Icon = XCircle;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-[#EC9A29]';
            Icon = AlertTriangle;
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
              className={`${bgClass} text-white p-4 rounded-xl shadow-xl flex flex-col overflow-hidden pointer-events-auto`}
              id={`toast-${toast.id}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm font-medium tracking-wide">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-white/80 hover:text-white transition-colors p-0.5 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Diminishing Progress Bar */}
              <div className="w-full h-1 bg-white/25 mt-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                  className="h-full bg-white/85"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
