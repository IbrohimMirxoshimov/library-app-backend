import { apiClient } from './client';

/** User data as returned by the Telegram ID lookup endpoint */
export interface TelegramUser {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  verified: boolean;
  status: string;
  libraries: Array<{
    library: { id: number; name: string };
  }>;
}

/** Response when user is not found */
interface UserNotFound {
  found: false;
}

type FindByTelegramResponse = TelegramUser | UserNotFound;

/**
 * Look up a user by their Telegram ID.
 * Returns the user object if found, or { found: false } if not.
 * Calls GET /app/users/telegram/:telegramId
 */
export async function findByTelegram(
  telegramId: string,
): Promise<FindByTelegramResponse | null> {
  return apiClient.get<FindByTelegramResponse>(`/app/users/telegram/${telegramId}`);
}

/**
 * Type guard to check if the response is an actual user (not "not found").
 */
export function isUser(response: FindByTelegramResponse): response is TelegramUser {
  return !('found' in response && response.found === false);
}
