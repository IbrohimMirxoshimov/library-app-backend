import { Context, SessionFlavor } from 'grammy';
import { SessionData } from '../session/session.interface';

/**
 * Extended grammyJS context type with session support.
 * All handlers receive this context type.
 *
 * ConversationFlavor can be added later when conversation flows are needed.
 * For now, the bot uses callback queries and inline keyboards instead of
 * multi-step conversations.
 */
export type CustomContext = Context & SessionFlavor<SessionData>;
