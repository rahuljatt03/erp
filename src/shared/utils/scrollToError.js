/**
 * After a form's validation marks invalid controls with `.has-error` (and/or
 * renders a `.banner` error message), call this to smoothly scroll the first
 * problem into view and focus it.
 *
 * Pass the form element (e.g. a ref's `.current`); falls back to searching the
 * whole document if none is given. The lookup is deferred one frame so it runs
 * after React has painted the error styles.
 *
 * @param {HTMLElement|null} [root] - container to search within (usually the <form>).
 */
export function scrollToFirstError(root) {
  requestAnimationFrame(() => {
    const scope = root ?? document;
    const target =
      scope.querySelector('.has-error') ?? scope.querySelector('.banner--error');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') target.focus({ preventScroll: true });
  });
}
