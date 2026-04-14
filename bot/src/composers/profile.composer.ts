import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { findByTelegram, isUser } from '../api/users.api';
import { bold, escapeHtml, spoiler } from '../utils/format.utils';
import { profileKeyboard } from '../keyboards/main-menu.keyboard';
import { backKeyboard } from '../keyboards/common.keyboard';

const composer = new Composer<CustomContext>();

/** "my_profile" callback — show user's profile with reading stats */
composer.callbackQuery('my_profile', async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  // Look up user for fresh data
  const result = await findByTelegram(ctx.from.id.toString());

  if (!result || !isUser(result)) {
    return ctx.editMessageText(
      "Siz hali ro'yxatdan o'tmagansiz. Kutubxonaga tashrif buyurib ro'yxatdan o'ting.",
      { reply_markup: backKeyboard() },
    );
  }

  const genderIcon = '📚'; // Neutral icon — gender not in the lookup response
  const fullName = [result.firstName, result.lastName].filter(Boolean).join(' ');
  const phone = result.phone
    ? spoiler(result.phone)
    : "ko'rsatilmagan";
  const status = result.status === 'ACTIVE' ? 'Faol' : 'Bloklangan';

  const text = `${genderIcon} Kitobxon: ${bold(escapeHtml(fullName))}
☎️ Telefon raqam: ${bold(phone)}
📋 Holat: ${bold(status)}
${result.verified ? '✅ Tasdiqlangan' : '⚠️ Tasdiqlanmagan'}`;

  return ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: profileKeyboard(),
  });
});

export { composer as profileComposer };
