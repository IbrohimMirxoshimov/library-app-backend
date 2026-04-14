import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Returns all app configuration from environment variables.
 * Called once at startup and imported where needed.
 */
export function getConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // Redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRATION || '12d',
    },

    // Bot service token (non-expiring, used by bot to call API)
    botServiceToken: process.env.BOT_SERVICE_TOKEN!,

    // Telegram
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      devId: process.env.TELEGRAM_DEV_ID!,
      attachmentsChannelId: process.env.TELEGRAM_ATTACHMENTS_CHANNEL_ID!,
      mainGroupChatId: process.env.TELEGRAM_MAIN_GROUP_CHAT_ID!,
      mainChannelChatId: process.env.TELEGRAM_MAIN_CHANNEL_CHAT_ID!,
      donationChannelChatId: process.env.TELEGRAM_DONATION_CHANNEL_CHAT_ID!,
      mainBotUsername: process.env.TELEGRAM_MAIN_BOT_USERNAME!,
      libraryGroupId: process.env.TELEGRAM_LIBRARY_GROUP_ID!,
    },

    // SMS - Eskiz
    eskiz: {
      email: process.env.ESKIZ_EMAIL!,
      password: process.env.ESKIZ_PASSWORD!,
    },

    // Firebase
    firebaseServiceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json',

    // File uploads
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),

    // Gateway
    gatewaySmsDaily: parseInt(process.env.GATEWAY_SMS_DAILY_LIMIT || '220', 10),
  } as const;
}

export type AppConfig = ReturnType<typeof getConfig>;

/**
 * Validates that all required environment variables are present.
 * Throws and prevents app from starting if any required var is missing.
 */
export function validateConfig(): void {
  const config = getConfig();

  const missing: string[] = [];

  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.jwt.secret) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}
