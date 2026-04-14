import { Composer, InlineKeyboard } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { libraryCache } from '../cache/library.cache';
import { escapeHtml } from '../utils/format.utils';
import { mainMenuKeyboard } from '../keyboards/main-menu.keyboard';

const composer = new Composer<CustomContext>();

/**
 * "chl" callback — show library selection menu.
 * User can switch their active library for book searches.
 */
composer.callbackQuery('chl', async (ctx) => {
  await ctx.answerCallbackQuery();

  const libraries = await libraryCache.getLibraries();

  if (libraries.length === 0) {
    return ctx.editMessageText(
      "Kutubxonalar ro'yxatini olishda xatolik yuz berdi.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: '◀️ Orqaga', callback_data: 'back' }]],
        },
      },
    );
  }

  // Build library selection keyboard — one button per library
  const keyboard = new InlineKeyboard();
  for (const lib of libraries) {
    const regionName = lib.address?.region?.name || '';
    const label = regionName
      ? `🏛 ${escapeHtml(lib.name)} - ${escapeHtml(regionName)}`
      : `🏛 ${escapeHtml(lib.name)}`;
    keyboard.text(label, `l_${lib.id}`).row();
  }

  return ctx.editMessageText(
    'Kutubxonani tanlang\n\nKutubxona joylashgan tuman so\'ng viloyat yoki shahar ko\'rsatilgan',
    { reply_markup: keyboard },
  );
});

/**
 * Handle library selection callback — "l_{libraryId}"
 * Updates the session with the selected library.
 */
composer.callbackQuery(/^l_(\d+)$/, async (ctx) => {
  const libraryId = parseInt(ctx.match[1], 10);
  ctx.session.libraryId = libraryId;

  await ctx.answerCallbackQuery({ text: "Kutubxona o'zgartirildi!" });

  return ctx.editMessageText('Kerakli buyruqni tanlashingiz mumkin!', {
    reply_markup: mainMenuKeyboard(),
  });
});

export { composer as locationComposer };
