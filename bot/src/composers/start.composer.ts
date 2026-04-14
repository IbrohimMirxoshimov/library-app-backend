import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { mainMenuKeyboard } from '../keyboards/main-menu.keyboard';

const HELP_TEXT = `Kitob qidirmoqchi bo'lsangiz quyidagi <b>Kitob qidirish</b> tugmasini bosing va o'zingizga kerakli kitob nomini yozing.

<b>Maslahat:</b>
x va h harflarini to'g'ri yozishga harakat qiling. Yoki u harflarni qatnashtirmasdan kitob nomi bo'lagidan yozsangiz yaxshiroq.
Masalan: <b>Hadis va hayot</b> emas <b>adis</b> deb yozsangiz ham kitobni topib beradi.`;

const composer = new Composer<CustomContext>();

/** /start command — show main menu, handle deeplinks */
composer.command('start', async (ctx) => {
  // Check for deeplink parameter
  const args = ctx.match;
  if (args === 'h') {
    return ctx.reply(HELP_TEXT, {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    });
  }

  return ctx.reply('Kerakli buyruqni tanlashingiz mumkin!', {
    reply_markup: mainMenuKeyboard(),
  });
});

/** /yordam command — search help/instructions */
composer.command('yordam', async (ctx) => {
  return ctx.reply(HELP_TEXT, {
    parse_mode: 'HTML',
    reply_markup: mainMenuKeyboard(),
  });
});

/** "back" callback — return to main menu */
composer.callbackQuery('back', async (ctx) => {
  await ctx.answerCallbackQuery();
  return ctx.editMessageText('Kerakli buyruqni tanlashingiz mumkin!', {
    reply_markup: mainMenuKeyboard(),
  });
});

export { composer as startComposer };
