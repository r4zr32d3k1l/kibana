import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { EuiGlobalToastList, type EuiGlobalToastListToast } from '@elastic/eui';

type ToastInput = Omit<EuiGlobalToastListToast, 'id'>;

interface ToastsApi {
  addToast: (toast: ToastInput) => void;
}

const ToastsContext = createContext<ToastsApi | null>(null);

export const ToastsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);

  const addToast = useCallback((toast: ToastInput) => {
    setToasts((prev) => [...prev, { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }, []);

  const removeToast = useCallback((removed: EuiGlobalToastListToast) => {
    setToasts((prev) => prev.filter((t) => t.id !== removed.id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastsContext.Provider value={value}>
      {children}
      <EuiGlobalToastList toasts={toasts} dismissToast={removeToast} toastLifeTimeMs={4000} />
    </ToastsContext.Provider>
  );
};

export const useToasts = (): ToastsApi => {
  const ctx = useContext(ToastsContext);
  if (!ctx) throw new Error('useToasts must be used inside ToastsProvider');
  return ctx;
};
