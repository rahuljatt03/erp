/**
 * Status pill — wraps the shadcn <Badge> primitive but keeps the app's semantic
 * `tone` API (neutral/info/warning/success/danger). shadcn ships only four
 * variants, so each tone maps to a soft semantic color set applied on top.
 */
import { Badge as UiBadge } from '@/components/ui/badge';

const TONE_CLASSES = {
  neutral: 'bg-muted text-muted-foreground border-transparent',
  info: 'bg-blue-100 text-blue-700 border-transparent',
  warning: 'bg-amber-100 text-amber-700 border-transparent',
  success: 'bg-green-100 text-green-700 border-transparent',
  danger: 'bg-red-100 text-red-700 border-transparent',
};

export default function Badge({ tone = 'neutral', children }) {
  const toneClass = TONE_CLASSES[tone] ?? TONE_CLASSES.neutral;
  return <UiBadge className={toneClass}>{children}</UiBadge>;
}
