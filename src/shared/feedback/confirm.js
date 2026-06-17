import { confirmDialog } from 'primereact/confirmdialog';

/**
 * Promise wrapper around PrimeReact's imperative `confirmDialog`, so call sites
 * can write `if (!(await confirm({ message }))) return;` instead of threading
 * accept/reject callbacks through component state.
 *
 * Resolves `true` on accept, `false` on reject or any dismissal (Esc / mask /
 * close). The `settled` guard makes the resolution single-shot, since PrimeReact
 * fires `onHide` after accept/reject too.
 *
 * Targets the groupless <ConfirmDialog> mounted in <FeedbackProvider>.
 */
export function confirm({
  message,
  header = 'Please confirm',
  icon = 'pi pi-exclamation-triangle',
  acceptLabel = 'Confirm',
  rejectLabel = 'Cancel',
  acceptClassName,
  ...rest
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    confirmDialog({
      message,
      header,
      icon,
      acceptLabel,
      rejectLabel,
      acceptClassName,
      ...rest,
      accept: () => done(true),
      reject: () => done(false),
      onHide: () => done(false),
    });
  });
}

/** Destructive-action confirm: red accept button + trash icon. */
export function confirmDelete(message, header = 'Delete?') {
  return confirm({
    message,
    header,
    icon: 'pi pi-trash',
    acceptLabel: 'Delete',
    acceptClassName: 'p-button-danger',
  });
}

/**
 * Statuses that are terminal or hard to undo. Selecting one of these from an
 * inline status dropdown (or a "convert" action) warrants an explicit confirm;
 * routine transitions (draft → sent, etc.) just toast.
 */
export const CONFIRM_STATUSES = new Set([
  'cancelled',
  'rejected',
  'received',
  'fulfilled',
  'completed',
  'converted',
  'expired',
]);

/** True when changing *to* `status` should prompt for confirmation. */
export function statusNeedsConfirm(status) {
  return CONFIRM_STATUSES.has(status);
}
