import './styles.css';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function Surface({ as: Component = 'section', className, children, ...props }) {
  return (
    <Component className={joinClassNames('af-surface', className)} {...props}>
      {children}
    </Component>
  );
}

export function Button({ variant = 'primary', className, type = 'button', children, ...props }) {
  return (
    <button
      type={type}
      className={joinClassNames('af-button', `af-button--${variant}`, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, htmlFor, hint, error, className, children }) {
  return (
    <div className={joinClassNames('af-field', className)}>
      {label && (htmlFor ? <label className="af-field__label" htmlFor={htmlFor}>{label}</label> : <div className="af-field__label">{label}</div>)}
      {children}
      {error ? <p className="af-field__error">{error}</p> : hint ? <p className="af-field__hint">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({ tone = 'neutral', className, children }) {
  return <span className={joinClassNames('af-status', `af-status--${tone}`, className)}>{children}</span>;
}

export function Alert({ tone = 'danger', className, children }) {
  return (
    <div
      className={joinClassNames('af-alert', `af-alert--${tone}`, className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
