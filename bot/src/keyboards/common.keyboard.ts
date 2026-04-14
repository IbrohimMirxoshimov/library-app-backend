import { InlineKeyboard } from 'grammy';

/**
 * Back button that navigates to the main menu.
 * Callback data: "back"
 */
export function backKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('◀️ Orqaga', 'back');
}

/**
 * Inline switch button for book search.
 * Opens inline mode in the current chat with empty query.
 */
export function searchButton(): InlineKeyboard {
  return new InlineKeyboard().switchInlineCurrent('🔎 Kitob qidirish', '');
}

/**
 * Search and back combined keyboard.
 */
export function searchAndBackKeyboard(bookId: number): InlineKeyboard {
  return new InlineKeyboard()
    .switchInlineCurrent('🔎 Kitob qidirish', '')
    .row()
    .text('◀️ Orqaga', 'back')
    .text('🔄 Yangilash', `b_${bookId}`);
}
