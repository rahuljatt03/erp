/**
 * Form field wrapper: label (+ required marker), the control (children), and an
 * optional hint or error line. Standardises form layout across every module.
 */
export default function Field({ label, required, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
