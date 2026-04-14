import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { bold } from '../utils/format.utils';
import { backKeyboard } from '../keyboards/common.keyboard';
import { getBotConfig } from '../config';

const composer = new Composer<CustomContext>();

/**
 * /haqida command — about the library.
 * The old bot used copyMessage from a channel post (message ID 129).
 * Here we send a static about text instead, which is more maintainable.
 */
composer.command('haqida', async (ctx) => {
  return showAbout(ctx);
});

/** Handle "about" callback query if needed */
composer.callbackQuery('about', async (ctx) => {
  await ctx.answerCallbackQuery();
  return showAbout(ctx, true);
});

async function showAbout(ctx: CustomContext, isEdit: boolean = false): Promise<void> {
  const config = getBotConfig();

  const text = `${bold('🏛 Kutubxona haqida')}

Biz — ilm va ehson kutubxonasi. Maqsadimiz — kitob o'qish madaniyatini rivojlantirish va ilm tarqatish.

${bold('Xizmatlar:')}
• Bepul kitob ijaraga olish
• Onlayn kitob qidirish (bot orqali)
• Kutubxona statistikasi

${bold('Bot imkoniyatlari:')}
• 🔎 Kitob qidirish — inline rejimda
• 📊 Statistika — kutubxona ko'rsatkichlari
• 📚 Zarur kitoblar — ehtirojga muhtoj kitoblar
• 🚪 Profil — o'z kitoblaringiz ro'yxati

${config.mainBotUsername ? `\n${bold(`@${config.mainBotUsername}`)}` : ''}`;

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

export { composer as aboutComposer };
