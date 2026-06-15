/**
 * Button — supports rendering as a real <button> or, with `to`, a router <Link>
 * styled identically. Keeps every clickable in the app visually consistent.
 */
import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export default function Button({
  children,
  variant = 'secondary',
  size,
  to,
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    VARIANTS[variant] ?? VARIANTS.secondary,
    size === 'sm' ? 'btn-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
