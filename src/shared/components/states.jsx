/** Shared loading / empty / error placeholders so every list page behaves alike. */
import { EmptyIcon, WarningIcon } from './icons';
import Button from './Button';

const STATE = 'px-6 py-[52px] text-center text-slate-500';
const ICON = 'mb-2.5 flex justify-center [&>svg]:size-[34px]';
const TITLE = 'mb-1 text-base font-semibold text-slate-900';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className={STATE}>
      <div className="mx-auto size-[26px] animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
      <p className="mt-3.5 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = EmptyIcon, title = 'Nothing here yet', text, action }) {
  return (
    <div className={STATE}>
      <div className={ICON}>{Icon ? <Icon /> : null}</div>
      <div className={TITLE}>{title}</div>
      {text ? <p className="mb-4 text-sm">{text}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ text = 'Something went wrong.', onRetry }) {
  return (
    <div className={STATE}>
      <div className={ICON}><WarningIcon /></div>
      <div className={TITLE}>Couldn’t load data</div>
      <p className="mb-4 text-sm">{text}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
