import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { bold } from '../utils/format.utils';
import { backKeyboard } from '../keyboards/common.keyboard';
import { getBotConfig } from '../config';

const composer = new Composer<CustomContext>();

/**
 * /hissa command — donation channel info.
 * The old bot used copyMessage from the main channel (message ID 44).
 * Here we send a static text with a link to the donation channel.
 */
composer.command('hissa', async (ctx) => {
  const config = getBotConfig();
  const donationChannelId = config.donationChannelChatId;

  // If donation channel is configured, try to forward/reference it
  if (donationChannelId) {
    try {
      // Try to copy a pinned/info message from the donation channel
      // Fall back to text if copy fails
      await ctx.api.copyMessage(ctx.chat.id, donationChannelId, 1, {
        reply_markup: backKeyboard(),
      });
      return;
    } catch {
      // If copy fails, fall through to static text
    }
  }

  // Static fallback text about donation
  const text = `${bold('🤝 Kutubxonaga hissa qo\'shing!')}

Kutubxonaga kitob hadya qilish orqali minglab kitobxonlarning ilm olishiga sababchi bo'lishingiz mumkin.

/zarur buyrug'i orqali eng zarur kitoblar ro'yxatini ko'rishingiz mumkin.

${bold('Qanday hissa qo\'shish mumkin?')}
• Kitob hadya qilish
• Moliyaviy yordam ko'rsatish
• Boshqalarga bot haqida aytish

${config.mainBotUsername ? `@${config.mainBotUsername}` : ''}`;

  return ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard(),
  });
});

export { composer as donationComposer };
