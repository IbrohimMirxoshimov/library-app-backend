import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Bot-specific configuration from environment variables.
 * Validates required vars on access — missing values throw immediately.
 */
export function getBotConfig() {
  const port = process.env.PORT || '3000';

  return {
    /** Telegram bot token from @BotFather */
    botToken: requireEnv('TELEGRAM_BOT_TOKEN'),

    /** Non-expiring JWT used by bot to authenticate with the API */
    botServiceToken: requireEnv('BOT_SERVICE_TOKEN'),

    /** Base URL for internal API calls */
    apiUrl: `http://localhost:${port}/api/v1`,

    /** Telegram main bot username (without @) */
    mainBotUsername: process.env.TELEGRAM_MAIN_BOT_USERNAME || '',

    /** Telegram main channel chat ID — used for /haqida and /hissa commands */
    mainChannelChatId: process.env.TELEGRAM_MAIN_CHANNEL_CHAT_ID || '',

    /** Telegram donation channel chat ID */
    donationChannelChatId: process.env.TELEGRAM_DONATION_CHANNEL_CHAT_ID || '',

    /** Redis connection settings */
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
  } as const;
}

export type BotConfig = ReturnType<typeof getBotConfig>;

/**
 * Throws if the given environment variable is not set.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
