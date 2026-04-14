import { NextFunction } from 'grammy';
import { CustomContext } from '../context/custom-context';

/**
 * Middleware that filters messages to only process private chat messages.
 * Inline queries and callback queries are always allowed through.
 * Group/supergroup/channel messages are silently ignored.
 */
export async function privateChatMiddleware(
  ctx: CustomContext,
  next: NextFunction,
): Promise<void> {
  // Always allow inline queries (they don't have a chat type)
  if (ctx.inlineQuery) {
    return next();
  }

  // Always allow callback queries (button clicks)
  if (ctx.callbackQuery) {
    return next();
  }

  // For messages, only process private chats
  if (ctx.chat?.type === 'private') {
    return next();
  }

  // Silently ignore group/supergroup/channel messages
}
