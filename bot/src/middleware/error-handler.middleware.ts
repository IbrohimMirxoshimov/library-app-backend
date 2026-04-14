import { BotError, GrammyError, HttpError } from 'grammy';
import { CustomContext } from '../context/custom-context';

/**
 * Global error handler for the bot.
 * Catches ALL errors — the bot must never crash.
 * Sends a user-friendly message and logs the error for debugging.
 */
export async function errorHandler(err: BotError<CustomContext>): Promise<void> {
  const ctx = err.ctx;
  const error = err.error;

  // Log the error with context for debugging
  console.error(`Error while handling update ${ctx.update.update_id}:`);

  if (error instanceof GrammyError) {
    console.error('GrammyError:', error.description);
  } else if (error instanceof HttpError) {
    console.error('HttpError:', error.message);
  } else if (error instanceof Error) {
    console.error('Error:', error.message, error.stack);
  } else {
    console.error('Unknown error:', error);
  }

  // Try to send a user-friendly error message — but don't crash if that fails too
  try {
    if (ctx.chat) {
      await ctx.reply('Uzr, xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  } catch (replyError) {
    console.error('Failed to send error reply:', replyError);
  }
}
