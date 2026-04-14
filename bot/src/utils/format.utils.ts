/**
 * Text formatting utilities for Telegram HTML parse mode.
 * All bot messages use HTML formatting (<b>, <i>, <code>, etc.).
 */

/**
 * Escape HTML special characters in user-provided text.
 * Must be called before inserting user input into HTML messages.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Wrap text in <b>bold</b> tags */
export function bold(text: string): string {
  return `<b>${text}</b>`;
}

/** Wrap text in <i>italic</i> tags */
export function italic(text: string): string {
  return `<i>${text}</i>`;
}

/** Wrap text in <code>code</code> tags */
export function code(text: string): string {
  return `<code>${text}</code>`;
}

/** Create an HTML hyperlink */
export function link(text: string, url: string): string {
  return `<a href="${url}">${escapeHtml(text)}</a>`;
}

/** Wrap text in <tg-spoiler>spoiler</tg-spoiler> tags */
export function spoiler(text: string): string {
  return `<tg-spoiler>${text}</tg-spoiler>`;
}

/**
 * Format a date string or Date object to "DD.MM.YYYY" format.
 * Uses Tashkent timezone for consistency with the API.
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' });
}

/**
 * Calculate remaining days from now until a given date.
 * Positive = days remaining, negative = days overdue.
 */
export function getRemainingDays(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get a human-readable remaining time text with emoji indicator.
 * Used in rental info display.
 */
export function getRemainingText(dueDate: string | Date): string {
  const remaining = getRemainingDays(dueDate);

  if (remaining < 0) {
    return `⚫️ ${Math.abs(remaining)} kun muddati o'tib ketdi`;
  }
  if (remaining <= 5) {
    return `🔴 ${remaining} kun qoldi. Vaqtida qaytarish lozim`;
  }
  return `🟢 ${remaining} kun qoldi`;
}

/**
 * Format a rental date range with status indicator.
 * Shows issue date - due date, and return status if returned.
 */
export function formatRentalDateRange(
  issuedAt: string,
  dueDate: string,
  returnedAt: string | null,
): string {
  const range = `${formatDate(issuedAt)} - ${formatDate(dueDate)}`;

  if (returnedAt) {
    const returnedOnTime = new Date(dueDate) >= new Date(returnedAt);
    const statusText = returnedOnTime
      ? "✅ vaqtida qaytarilgan"
      : "☑️ kechiktirilgan";
    return `${range}\n${statusText}`;
  }

  return `${range}\n${getRemainingText(dueDate)}`;
}

/**
 * Get the first author name from a book's author array, or empty string.
 */
export function getAuthorName(
  authors: Array<{ author: { name: string } }>,
): string {
  if (authors.length === 0) return '';
  return authors[0].author.name;
}

/**
 * Get book title with author (if available).
 */
export function getBookTitle(
  bookName: string,
  authors: Array<{ author: { name: string } }>,
): string {
  const authorName = getAuthorName(authors);
  return authorName ? `${bookName} - ${authorName}` : bookName;
}
