import { NextFunction } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { findByTelegram, isUser } from '../api/users.api';

/**
 * Authentication middleware.
 * Looks up the Telegram user in the API and populates the session.
 * If the user is already authenticated (session has userId), skips the lookup.
 * If the user is not found, session remains unauthenticated — handlers decide what to do.
 */
export async function authMiddleware(
  ctx: CustomContext,
  next: NextFunction,
): Promise<void> {
  // No user info available (shouldn't happen in practice)
  if (!ctx.from) {
    return next();
  }

  // Already authenticated in this session — proceed
  if (ctx.session.isAuthenticated && ctx.session.userId) {
    return next();
  }

  // Look up user by Telegram ID
  try {
    const result = await findByTelegram(ctx.from.id.toString());

    if (result && isUser(result)) {
      ctx.session.userId = result.id;
      ctx.session.isAuthenticated = true;

      // Set default library from the user's first library if not already set
      if (!ctx.session.libraryId && result.libraries.length > 0) {
        ctx.session.libraryId = result.libraries[0].library.id;
      }
    }
  } catch (error) {
    // API lookup failed — don't block the user, just log and continue
    console.error('Auth middleware: user lookup failed:', error);
  }

  return next();
}
