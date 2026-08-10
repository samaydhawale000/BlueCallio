'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface ToastState {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface Props {
  toast: ToastState | null;
  onDismiss: () => void;
}

export function ToastHost({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-2xl"
            style={{
              background: toast.type === 'success' ? '#0D1F1A' : '#1F0D0D',
              borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} style={{ color: '#34D399' }} />
            ) : (
              <XCircle size={16} style={{ color: '#F87171' }} />
            )}
            <p className="text-sm font-medium text-white">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
