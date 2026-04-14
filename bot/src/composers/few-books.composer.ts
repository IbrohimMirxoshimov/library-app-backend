import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { getAdminStats } from '../api/stats.api';
import { bold, link } from '../utils/format.utils';
import { truncateList } from '../utils/pagination.utils';
import { getBotConfig } from '../config';

const composer = new Composer<CustomContext>();

/**
 * /zarur command — show books that need donation (few copies available).
 * Uses the admin stats endpoint to get the fewBooks list (SQRT + rarity-based).
 */
composer.command('zarur', async (ctx) => {
  const stats = await getAdminStats();
  const config = getBotConfig();

  if (!stats || !stats.fewBooks || stats.fewBooks.length === 0) {
    return ctx.reply(
      "Hozircha zarur kitoblar ro'yxati bo'sh yoki ma'lumot olishda xatolik yuz berdi.",
    );
  }

  // Build numbered list of book names
  const bookLines = stats.fewBooks.map((book, i) => `${i + 1}) ${book.bookName}`);
  const truncated = truncateList(bookLines, 3000);

  const text = `📚 ${bold("Eng zarur va yetishmayotgan kitoblar")}

${truncated}

${link("📚 To'liq ro'yxat", 'https://www.mehrkutubxonasi.uz/zarur')}

${bold(`Siz ham kutubxonaga hissa qo'shib minglab kitobxonlar ilm olishiga sababchi bo'lishingiz mumkin`)}
${config.mainBotUsername ? `@${config.mainBotUsername}` : ''}`;

  return ctx.reply(text, { parse_mode: 'HTML' });
});

export { composer as fewBooksComposer };
