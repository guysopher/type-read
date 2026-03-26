'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/styles/designTokens';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // Start exit animation 300ms before removal

    const removeTimer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, onClose]);

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10b981'; // green
      case 'error':
        return colors.error;
      case 'warning':
        return '#f59e0b'; // orange
      case 'info':
      default:
        return colors.accent;
    }
  };

  return (
    <div
      className={`px-6 py-3 rounded-lg shadow-lg text-white font-bold text-lg transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{
        backgroundColor: getBackgroundColor(),
        transform: isExiting ? 'translateY(8px)' : 'translateY(0)',
      }}
    >
      {toast.message}
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
