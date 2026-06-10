import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, LogOut, UserX, AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: 'trash' | 'logout' | 'kick' | 'warning' | 'info';
  safetyInputMatch?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon = 'warning',
  safetyInputMatch
}: ConfirmDialogProps) {
  const [typedMatch, setTypedMatch] = useState('');

  // Reset text on open state change
  useEffect(() => {
    if (!isOpen) {
      setTypedMatch('');
    }
  }, [isOpen]);

  let iconColor = 'bg-[#EC9A29]/20 text-[#EC9A29]';
  let IconComponent = AlertTriangle;

  if (icon === 'trash') {
    iconColor = 'bg-[#A8201A]/20 text-[#A8201A]';
    IconComponent = Trash2;
  } else if (icon === 'logout') {
    iconColor = 'bg-[#A8201A]/20 text-[#A8201A]';
    IconComponent = LogOut;
  } else if (icon === 'kick') {
    iconColor = 'bg-[#A8201A]/20 text-[#A8201A]';
    IconComponent = UserX;
  } else if (icon === 'info') {
    iconColor = 'bg-[#0F8B8D]/20 text-[#0F8B8D]';
    IconComponent = Info;
  }

  const isConfirmedDisabled = safetyInputMatch ? typedMatch !== safetyInputMatch : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="confirm-modal-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#143642]/65 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10"
            id="confirm-modal-card"
          >
            {/* Upper Right Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 flex flex-col items-center text-center">
              {/* Highlight Circle */}
              <div className={`w-16 h-16 rounded-full ${iconColor} flex items-center justify-center mb-5`}>
                <IconComponent className="w-8 h-8" />
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">
                {title}
              </h3>

              {/* Description */}
              <p className="text-sm font-sans text-brand-dark/70 leading-relaxed mb-6">
                {description}
              </p>

              {/* Extra Safety Input */}
              {safetyInputMatch && (
                <div className="w-full text-left mb-6">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-2 uppercase tracking-wide">
                    Type <code className="px-1.5 py-0.5 bg-gray-100 rounded text-brand-danger font-mono font-medium">{safetyInputMatch}</code> to confirm:
                  </label>
                  <input
                    type="text"
                    value={typedMatch}
                    onChange={(e) => setTypedMatch(e.target.value)}
                    placeholder={safetyInputMatch}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-sans focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-brand-dark hover:bg-gray-50 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  disabled={isConfirmedDisabled}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 rounded-xl px-5 py-3 text-sm font-medium text-white transition-all shadow-md ${
                    isConfirmedDisabled
                      ? 'bg-gray-300 cursor-not-allowed shadow-none'
                      : icon === 'trash' || icon === 'kick' || icon === 'logout'
                      ? 'bg-[#A8201A] hover:bg-[#861914]'
                      : 'bg-[#0F8B8D] hover:bg-[#0a7173]'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
