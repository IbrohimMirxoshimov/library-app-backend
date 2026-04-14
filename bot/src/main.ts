import { createBot } from './bot';
import { createSessionMiddleware } from './session/session';
import { privateChatMiddleware } from './middleware/private-chat.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { rootComposer } from './composers';
import { libraryCache } from './cache/library.cache';

/**
 * Telegram bot entry point.
 * Runs as a separate process from the NestJS API.
 * Communicates with the API via HTTP using a service JWT token.
 */
async function main(): Promise<void> {
  console.log('Starting Telegram bot...');

  // Pre-warm the library cache before starting the bot
  try {
    await libraryCache.refresh();
    console.log('Library cache loaded');
  } catch (error) {
    console.warn('Failed to pre-warm library cache:', error);
    // Not fatal — cache will retry on first access
  }

  const bot = createBot();

  // Set global error handler — bot must never crash
  bot.catch(errorHandler);

  // Register middleware in order:
  // 1. Private chat filter — only process private messages (inline/callbacks always pass)
  bot.use(privateChatMiddleware);

  // 2. Session — Redis-backed session per Telegram user
  bot.use(createSessionMiddleware());

  // 3. Auth — look up user in API by Telegram ID, populate session
  bot.use(authMiddleware);

  // 4. All composers (commands, inline, callbacks)
  bot.use(rootComposer);

  // Set bot commands for Telegram menu
  await bot.api.setMyCommands([
    { command: 'start', description: 'Asosiy menyu' },
    { command: 'qidirish', description: 'Kitob qidirish' },
    { command: 'kitob', description: 'Kitob ijaraga olish tartibi' },
    { command: 'natija', description: 'Statistika' },
    { command: 'zarur', description: 'Zarur kitoblar' },
    { command: 'hissa', description: "Kutubxonaga hissa qo'shish" },
    { command: 'haqida', description: 'Kutubxona haqida' },
    { command: 'yordam', description: 'Yordam' },
  ]);

  // Start long polling
  await bot.start({
    onStart: () => {
      console.log('Bot started successfully! Listening for updates...');
    },
  });
}

// Run the bot and handle top-level errors
main().catch((error) => {
  console.error('Fatal error starting bot:', error);
  process.exit(1);
});

// Graceful shutdown on signals
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down bot...');
  process.exit(0);
});
