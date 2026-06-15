/**
 * Tiny CSV export helper for report tables. Frontend-only: builds a CSV string
 * from a column spec + rows and triggers a browser download via a Blob. When the
 * backend lands this can move server-side, but the call sites won't need to.
 */

/** Quotes a cell only when it contains a comma, quote or newline (RFC 4180). */
function escapeCell(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Serialises rows to CSV text.
 * @param {Array<{ label: string, value: (row: any) => unknown }>} columns
 * @param {any[]} rows
 */
export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(',');
  const body = rows
    .map((row) => columns.map((column) => escapeCell(column.value(row))).join(','))
    .join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

/** Triggers a download of `csv` as `filename`. Prepends a BOM so Excel reads UTF-8. */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
