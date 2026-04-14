import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { getPublicStats } from '../api/stats.api';
import { bold } from '../utils/format.utils';
import { backKeyboard } from '../keyboards/common.keyboard';
import { getBotConfig } from '../config';

const composer = new Composer<CustomContext>();

/** /natija command — show public statistics */
composer.command('natija', async (ctx) => {
  return showStats(ctx);
});

/** "stats" callback query — show statistics from button click */
composer.callbackQuery('stats', async (ctx) => {
  await ctx.answerCallbackQuery();
  return showStats(ctx, true);
});

/**
 * Fetch stats from API and display them.
 * If isEdit=true, edit existing message instead of sending new one.
 */
async function showStats(ctx: CustomContext, isEdit: boolean = false): Promise<void> {
  const stats = await getPublicStats();
  const config = getBotConfig();

  if (!stats) {
    const errorText = "Uzr, statistika ma'lumotlarini olishda xatolik yuz berdi.";
    if (isEdit) {
      await ctx.editMessageText(errorText, { reply_markup: backKeyboard() });
    } else {
      await ctx.reply(errorText, { reply_markup: backKeyboard() });
    }
    return;
  }

  const text = `${bold('📊 Kutubxona statistikasi')}

${bold('📚 Barcha kitoblar: ')}${stats.totalBooks} ta
${bold('🧑‍🚀 Kitobxonlar: ')}${stats.totalUsers} ta
${bold('📖 Umumiy ijaralar soni: ')}${stats.totalRentals} ta
${bold('📖 Ayni vaqtda o\'qilayotgan kitoblar: ')}${stats.activeRentals} ta

${bold(config.mainBotUsername ? `@${config.mainBotUsername}` : '')}`;

  if (isEdit) {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  }
}

export { composer as statsComposer };
