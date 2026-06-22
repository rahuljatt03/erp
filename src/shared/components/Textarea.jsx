/**
 * Multi-line input styled to match <Input> (replaces the old `.textarea` class).
 * Vertically resizable with a sensible min height. Pass `invalid` for the error
 * border; other props pass through.
 */
import { cn } from '@/lib/utils';
import { controlClass } from './Input';

export default function Textarea({ invalid = false, className = '', ...rest }) {
  return (
    <textarea
      className={cn(controlClass, 'min-h-[76px] resize-y', invalid && 'border-red-600', className)}
      {...rest}
    />
  );
}
