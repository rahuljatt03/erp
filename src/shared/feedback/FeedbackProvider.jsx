import { createContext, useContext, useMemo, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';

/**
 * App-wide feedback layer.
 *
 * Mounts the single PrimeReact <Toast> (driven through a ref) and the single
 * groupless <ConfirmDialog> that the imperative `confirmDialog()` API targets —
 * both render through portals to <body>, so they sit above the app shell and
 * are unaffected by page layout/CSS.
 *
 * Components raise toasts with `const toast = useToast()` and ask for
 * confirmation with the `confirm()` helpers in ./confirm.js.
 */
const ToastContext = createContext(null);

export function FeedbackProvider({ children }) {
  const ref = useRef(null);

  const toast = useMemo(
    () => ({
      show: (options) => ref.current?.show(options),
      success: (summary, detail) =>
        ref.current?.show({ severity: 'success', summary, detail, life: 3000 }),
      info: (summary, detail) =>
        ref.current?.show({ severity: 'info', summary, detail, life: 3000 }),
      warn: (summary, detail) =>
        ref.current?.show({ severity: 'warn', summary, detail, life: 4000 }),
      error: (summary, detail) =>
        ref.current?.show({ severity: 'error', summary, detail, life: 5000 }),
      clear: () => ref.current?.clear(),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={toast}>
      <Toast ref={ref} position="bottom-right" />
      <ConfirmDialog />
      {children}
    </ToastContext.Provider>
  );
}

/** Access the app toast: `toast.success(summary, detail)`, `.error(...)`, etc. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <FeedbackProvider>');
  }
  return ctx;
}
