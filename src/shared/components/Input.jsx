/**
 * Text input styled to the ERP design system, in Tailwind utilities. Replaces
 * the old global `.input` class. Pass `invalid` to show the error border; all
 * other props (value, onChange, type, placeholder, disabled…) pass through.
 * `className` is merged last (via cn/twMerge) so call sites can override sizing.
 */
import { cn } from '@/lib/utils';

// Shared control styling, also reused by <Select> and <Textarea>.
export const controlClass =
  'w-full rounded-field border border-slate-300 bg-white px-[11px] py-2 text-sm text-slate-900 ' +
  'outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 ' +
  'focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-100';

export default function Input({ invalid = false, className = '', type = 'text', ...rest }) {
  return (
    <input
      type={type}
      className={cn(controlClass, invalid && 'border-red-600', className)}
      {...rest}
    />
  );
}
