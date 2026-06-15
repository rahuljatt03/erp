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

/**
 * The company / agency this ERP instance belongs to. Single source of truth for
 * the brand name shown in the sidebar and topbar — change it here once.
 */
export const company = {
  name: 'Manufacturing ERP',
  tagline: 'Operations Suite',
  initials: 'M',
};
