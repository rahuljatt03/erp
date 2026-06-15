/**
 * Current user — mocked for now. When auth is added, this is the single place
 * that changes (read from a token / context instead of a constant). Modules that
 * stamp "created by" read from here, so they won't need to change.
 */
export const currentUser = {
  name: 'Operations User',
  initials: 'OU',
  role: 'Sales / Inquiry Desk',
};
