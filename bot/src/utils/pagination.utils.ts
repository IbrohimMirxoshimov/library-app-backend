/**
 * Telegram message pagination utilities.
 * Used for paginating inline query results and long message lists.
 */

/** Maximum Telegram message length (HTML mode) */
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Truncate a numbered list of items to fit within Telegram's message limit.
 * Cuts at the last complete line that fits.
 */
export function truncateList(lines: string[], maxLength: number = MAX_MESSAGE_LENGTH): string {
  let result = '';

  for (const line of lines) {
    const candidate = result ? result + '\n' + line : line;
    if (candidate.length > maxLength) break;
    result = candidate;
  }

  return result;
}

/**
 * Parse offset string from inline query into a page number.
 * Returns 1 for empty/invalid offset.
 */
export function parseInlineOffset(offset: string): number {
  const parsed = parseInt(offset, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}
