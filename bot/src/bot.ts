import { Bot } from 'grammy';
import { CustomContext } from './context/custom-context';
import { getBotConfig } from './config';

/**
 * Create the grammyJS bot instance with the custom context type.
 * The token comes from environment variables.
 */
export function createBot(): Bot<CustomContext> {
  const config = getBotConfig();
  return new Bot<CustomContext>(config.botToken);
}
