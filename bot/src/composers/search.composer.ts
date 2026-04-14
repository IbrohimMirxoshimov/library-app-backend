import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { getBook, getBookStatuses } from '../api/books.api';
import { bold, escapeHtml, formatDate } from '../utils/format.utils';
import { bookDetailKeyboard } from '../keyboards/main-menu.keyboard';
import { searchAndBackKeyboard } from '../keyboards/common.keyboard';

const composer = new Composer<CustomContext>();

/** /qidirish command — send help text that explains inline search */
composer.command('qidirish', async (ctx) => {
  return ctx.reply(
    `Kitob qidirmoqchi bo'lsangiz quyidagi <b>Kitob qidirish</b> tugmasini bosing va o'zingizga kerakli kitob nomini yozing.

<b>Maslahat:</b>
x va h harflarini to'g'ri yozishga harakat qiling. Yoki u harflarni qatnashtirmasdan kitob nomi bo'lagidan yozsangiz yaxshiroq.
Masalan: <b>Hadis va hayot</b> emas <b>adis</b> deb yozsangiz ham kitobni topib beradi.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔎 Kitob qidirish', switch_inline_query_current_chat: '' }],
        ],
      },
    },
  );
});

/**
 * Handle "b_{bookId}" message text — when user selects a book from inline results.
 * The inline result sends "b_123" as message text, which we intercept here.
 */
composer.hears(/^b_(\d+)$/, async (ctx) => {
  // Only process in private chat
  if (ctx.chat?.type !== 'private') return;

  const bookId = parseInt(ctx.match[1], 10);
  const book = await getBook(bookId);

  // Delete the "b_123" message the user sent
  try {
    await ctx.deleteMessage();
  } catch {
    // Ignore if we can't delete (e.g. message too old)
  }

  if (!book) {
    return ctx.reply('Kitob topilmadi.');
  }

  const caption = buildBookCaption(book);
  const hasStatuses = book._count.stocks > 0;

  // Send book with photo if images available
  if (book.images.length > 0) {
    return ctx.replyWithPhoto(book.images[0], {
      caption,
      parse_mode: 'HTML',
      reply_markup: bookDetailKeyboard(bookId, hasStatuses),
    });
  }

  return ctx.reply(caption, {
    parse_mode: 'HTML',
    reply_markup: bookDetailKeyboard(bookId, hasStatuses),
  });
});

/**
 * Handle "b_{bookId}" callback query — refresh/update book info.
 */
composer.callbackQuery(/^b_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (ctx.chat?.type !== 'private') return;

  const bookId = parseInt(ctx.match[1], 10);
  const book = await getBook(bookId);

  if (!book) {
    return ctx.reply('Kitob topilmadi.');
  }

  const caption = buildBookCaption(book);
  const hasStatuses = book._count.stocks > 0;

  // Delete old message and send updated one
  try {
    await ctx.deleteMessage();
  } catch {
    // Ignore
  }

  if (book.images.length > 0) {
    return ctx.replyWithPhoto(book.images[0], {
      caption,
      parse_mode: 'HTML',
      reply_markup: bookDetailKeyboard(bookId, hasStatuses),
    });
  }

  return ctx.reply(caption, {
    parse_mode: 'HTML',
    reply_markup: bookDetailKeyboard(bookId, hasStatuses),
  });
});

/**
 * Handle "wf_{bookId}" callback — show when books will be free (due dates).
 */
composer.callbackQuery(/^wf_(\d+)$/, async (ctx) => {
  const bookId = parseInt(ctx.match[1], 10);
  const statuses = await getBookStatuses(bookId);

  if (!statuses || statuses.length === 0) {
    await ctx.answerCallbackQuery({ text: "Ma'lumot topilmadi" });
    return;
  }

  // Build status text showing due dates sorted ascending
  const busyStatuses = statuses
    .filter((s) => s.busy && s.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  let statusText = '\n\nKitob bo\'shash sanalari:';
  for (const status of busyStatuses) {
    const dueDate = new Date(status.dueDate!);
    const indicator = dueDate < new Date() ? '🔘' : '🟢';
    statusText += `\n${indicator} - ${formatDate(dueDate)}`;
  }

  if (busyStatuses.length === 0) {
    statusText += '\nBarcha nusxalar bo\'sh';
  }

  // Try to append to existing caption
  try {
    const currentCaption = (ctx.callbackQuery.message && 'caption' in ctx.callbackQuery.message)
      ? ctx.callbackQuery.message.caption || ''
      : '';
    const newCaption = (currentCaption + statusText).slice(0, 1024);

    await ctx.editMessageCaption({
      caption: newCaption,
      parse_mode: 'HTML',
      reply_markup: searchAndBackKeyboard(bookId),
    });
  } catch {
    // If editing caption fails, send as a separate message
    await ctx.reply(statusText.trim(), { parse_mode: 'HTML' });
  }

  await ctx.answerCallbackQuery();
});

/**
 * Build the HTML caption text for a book detail message.
 */
function buildBookCaption(book: {
  id: number;
  name: string;
  authors: Array<{ author: { id: number; name: string } }>;
  _count: { stocks: number };
  rules: Array<{
    libraryId: number;
    library: { name: string };
    rarity: string;
  }>;
}): string {
  const authorText = book.authors.length > 0
    ? `\n${bold('Muallif: ')}${escapeHtml(book.authors[0].author.name)}`
    : '';

  // Determine availability status from rules (each rule = one library)
  const totalStocks = book._count.stocks;
  const stockStatus = totalStocks > 0
    ? `✅ Kutubxonada mavjud (${totalStocks} nusxa)`
    : '🚫 Kutubxonada mavjud emas';

  // Build library lines from rules
  let libraryLines = '';
  for (const rule of book.rules) {
    libraryLines += `\n${bold('Kutubxona: ')}${escapeHtml(rule.library.name)}`;
  }

  // Contact link — use first library's link if available
  let contactLine = '';
  if (book.rules.length > 0) {
    contactLine = `\n\n👉 Kutubxonachi bilan bog'laning`;
  }

  return `${bold(escapeHtml(book.name))}${authorText}\n\n${bold('Holati: ')}${stockStatus}${libraryLines}\nID:${book.id}${contactLine}`;
}

/** Rent info callback — g_rent */
composer.callbackQuery('g_rent', async (ctx) => {
  await ctx.answerCallbackQuery();
  return ctx.editMessageText(
    `${bold('📚 Kitob ijaraga olish tartibi')}

1. Kutubxonaga tashrif buyuring
2. Kutubxonachiga o'zingizni tanishtiring
3. Kerakli kitobni tanlang
4. Kutubxonachi sizga kitobni beradi

${bold('Muhim:')} Kitob qaytarish muddatiga e'tibor bering!`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔎 Kitob qidirish', switch_inline_query_current_chat: '' }],
          [{ text: '◀️ Orqaga', callback_data: 'back' }],
        ],
      },
    },
  );
});

export { composer as searchComposer };
