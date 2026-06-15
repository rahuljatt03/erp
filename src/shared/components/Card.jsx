/** Surface container with an optional header (title + right-aligned actions). */
export default function Card({ title, actions, children, bodyFlush = false, className = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <header className="card__header">
          {title ? <h3 className="card__title">{title}</h3> : <span />}
          {actions ? <div className="row">{actions}</div> : null}
        </header>
      )}
      <div className={bodyFlush ? 'card__body--flush' : 'card__body'}>{children}</div>
    </section>
  );
}
