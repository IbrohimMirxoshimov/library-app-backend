import { InlineKeyboard } from 'grammy';

/**
 * Main menu keyboard shown after /start.
 * Provides quick access to all main bot features.
 */
export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .switchInlineCurrent('🔎 Kitob qidirish', '')
    .row()
    .text('📚 Kitob ijaraga olish tartibi', 'g_rent')
    .row()
    .text('🏛 Kutubxonani o\'zgartirish', 'chl')
    .row()
    .text('🚪 Profilim', 'my_profile')
    .text('📊 Statistika', 'stats');
}

/**
 * Keyboard for book detail view.
 * Includes "when free" button, search, and navigation.
 */
export function bookDetailKeyboard(bookId: number, hasStatuses: boolean): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (hasStatuses) {
    keyboard.text('⏳ Bo\'shash vaqtlari', `wf_${bookId}`);
  }
  keyboard.switchInlineCurrent('🔎 Kitob qidirish', '');
  keyboard.row()
    .text('📚 Kitob ijaraga olish tartibi', 'g_rent');
  keyboard.row()
    .text('◀️ Orqaga', 'back')
    .text('🔄 Yangilash', `b_${bookId}`);

  return keyboard;
}

/**
 * Profile keyboard with inline switches for reading/read books.
 */
export function profileKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .switchInlineCurrent("📖 O'qiyapman", 'my_0')
    .row()
    .switchInlineCurrent("📘 O'qigan kitoblarim", 'my_1')
    .row()
    .text('◀️ Orqaga', 'back');
}
