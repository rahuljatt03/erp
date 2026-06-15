/**
 * Button — thin wrapper over the shadcn <Button> primitive that preserves the
 * app's existing API (variant primary/secondary/ghost/danger, size="sm", and
 * `to` for a router <Link>). Swapping the implementation here re-skins every
 * call site to shadcn without touching the pages that import it.
 */
import { Link } from 'react-router-dom';
import { Button as UiButton } from '@/components/ui/button';

// Map the app's semantic variants onto shadcn's variant names.
const VARIANT_MAP = {
  primary: 'default',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'destructive',
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
  const uiVariant = VARIANT_MAP[variant] ?? 'secondary';
  const uiSize = size === 'sm' ? 'sm' : 'default';

  if (to) {
    // asChild renders the styled button as the router Link.
    return (
      <UiButton asChild variant={uiVariant} size={uiSize} className={className}>
        <Link to={to} {...rest}>
          {children}
        </Link>
      </UiButton>
    );
  }

  return (
    <UiButton type={type} variant={uiVariant} size={uiSize} className={className} {...rest}>
      {children}
    </UiButton>
  );
}
