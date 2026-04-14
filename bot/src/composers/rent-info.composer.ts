import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { bold } from '../utils/format.utils';
import { backKeyboard } from '../keyboards/common.keyboard';

const composer = new Composer<CustomContext>();

/**
 * /kitob command — show information about how to rent a book.
 * The old bot used copyMessage from a channel; here we use a static text.
 */
composer.command('kitob', async (ctx) => {
  return ctx.reply(
    `${bold('📚 Kitob ijaraga olish tartibi')}

1. Kutubxonaga tashrif buyuring
2. Kutubxonachiga o'zingizni tanishtiring
3. Kerakli kitobni tanlang
4. Kutubxonachi sizga kitobni beradi

${bold('Muhim:')} Kitob qaytarish muddatiga e'tibor bering!
Muddatida qaytarmasangiz blokirovka qilinishingiz mumkin.

🔎 Bot orqali kitob qidirish va bo'sh ekanligini tekshirishingiz mumkin.`,
    {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    },
  );
});

export { composer as rentInfoComposer };
