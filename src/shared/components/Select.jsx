/**
 * Native <select> styled to match <Input> (replaces the old `.select` class).
 * Pass `invalid` for the error border; other props pass through.
 */
import { cn } from '@/lib/utils';
import { controlClass } from './Input';

export default function Select({ invalid = false, className = '', children, ...rest }) {
  return (
    <select className={cn(controlClass, invalid && 'border-red-600', className)} {...rest}>
      {children}
    </select>
  );
}
