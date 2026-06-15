/**
 * Surface container — wraps the shadcn <Card> primitives while preserving the
 * app's API (title, right-aligned `actions`, `bodyFlush`, className). Existing
 * pages keep calling <Card title=... actions=...> and now render shadcn.
 */
import {
  Card as UiCard,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from '@/components/ui/card';

export default function Card({ title, actions, children, bodyFlush = false, className = '' }) {
  return (
    <UiCard className={`gap-0 py-0 ${className}`.trim()}>
      {(title || actions) && (
        <CardHeader className="border-b py-4">
          {title ? <CardTitle className="text-base">{title}</CardTitle> : <span />}
          {actions ? <CardAction className="flex items-center gap-2">{actions}</CardAction> : null}
        </CardHeader>
      )}
      <CardContent className={bodyFlush ? 'px-0 py-0' : 'py-4'}>{children}</CardContent>
    </UiCard>
  );
}
