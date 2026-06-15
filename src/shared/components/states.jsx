/** Shared loading / empty / error placeholders so every list page behaves alike. */

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state">
      <div className="spinner" />
      <p className="state__text" style={{ marginTop: 14 }}>
        {label}
      </p>
    </div>
  );
}

export function EmptyState({ icon = '📋', title = 'Nothing here yet', text, action }) {
  return (
    <div className="state">
      <div className="state__icon">{icon}</div>
      <div className="state__title">{title}</div>
      {text ? <p className="state__text">{text}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ text = 'Something went wrong.', onRetry }) {
  return (
    <div className="state">
      <div className="state__icon">⚠️</div>
      <div className="state__title">Couldn’t load data</div>
      <p className="state__text">{text}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
