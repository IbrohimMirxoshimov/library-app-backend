/**
 * Session data persisted in Redis per Telegram user.
 * Minimal — only store what's needed between messages.
 */
export interface SessionData {
  /** Database user ID (set after first API lookup) */
  userId?: number;

  /** Currently selected library ID for book searches */
  libraryId?: number;

  /** Whether the user has been found in the DB */
  isAuthenticated: boolean;
}

/**
 * Returns default (empty) session data for new users.
 */
export function createInitialSessionData(): SessionData {
  return {
    isAuthenticated: false,
  };
}
