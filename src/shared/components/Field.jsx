/**
 * Form field wrapper: label (+ required marker), the control (children), and an
 * optional hint or error line. Standardises form layout across every module.
 */
import { cn } from '@/lib/utils';

export default function Field({ label, required, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-[13px] font-semibold text-slate-900" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </div>
  );
}
