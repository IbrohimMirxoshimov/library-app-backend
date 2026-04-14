import { Composer } from 'grammy';
import { InlineQueryResultArticle } from 'grammy/types';
import { CustomContext } from '../context/custom-context';
import { searchBooks } from '../api/books.api';
import { getBookTitle } from '../utils/format.utils';
import { parseInlineOffset } from '../utils/pagination.utils';
import { libraryCache } from '../cache/library.cache';

/** Placeholder image URL when book has no cover */
const NO_IMAGE_URL = 'https://via.placeholder.com/100x150.png?text=No+Image';

/** Shown when no search results found */
const EMPTY_RESULT: InlineQueryResultArticle = {
  id: 'empty',
  type: 'article',
  title: "Ma'lumot topilmadi",
  description: "Boshqa yozuv bilan urinib ko'ring",
  input_message_content: {
    message_text: `Kitob qidirmoqchi bo'lsangiz quyidagi <b>Kitob qidirish</b> tugmasini bosing va o'zingizga kerakli kitob nomini yozing.

<b>Maslahat:</b>
x va h harflarini to'g'ri yozishga harakat qiling.`,
    parse_mode: 'HTML',
  },
};

/** Shown when user is not authenticated */
const NEED_REG_RESULT: InlineQueryResultArticle = {
  id: 'needreg',
  type: 'article',
  title: 'Iltimos botga kiring va startni bosing',
  description: "Siz botdan ro'yxatdan o'tmagansiz. Botga kiring va startni bosing",
  input_message_content: {
    message_text: "Siz botdan ro'yxatdan o'tmagansiz. Botga kiring va startni bosing",
  },
};

const composer = new Composer<CustomContext>();

/**
 * Handle book search inline queries.
 * Called when user types the bot's username in any chat and types a query.
 * Does NOT handle "my_0" and "my_1" — those are in my-books.inline.ts.
 */
composer.on('inline_query', async (ctx, next) => {
  const query = ctx.inlineQuery.query.trim();

  // Let my-books handler process "my_" queries
  if (query.match(/^my_\d?$/)) {
    return next();
  }

  // Check if user is authenticated
  if (!ctx.session.isAuthenticated) {
    return ctx.answerInlineQuery([NEED_REG_RESULT]);
  }

  const page = parseInlineOffset(ctx.inlineQuery.offset);

  // Fetch books from API
  const result = await searchBooks(query, page, 15);

  if (!result || result.items.length === 0) {
    // Only show empty result on first page
    if (page > 1) {
      return ctx.answerInlineQuery([]);
    }
    return ctx.answerInlineQuery([EMPTY_RESULT]);
  }

  // Get library name for stock descriptions
  const getStockDescription = async (item: typeof result.items[number]): Promise<string> => {
    const stockCount = item._count.stocks;
    if (stockCount === 0) return 'Kutubxonada mavjud emas';

    // Try to get library name from the session's selected library
    if (ctx.session.libraryId) {
      const lib = await libraryCache.getById(ctx.session.libraryId);
      if (lib) {
        return `Kutubxona: ${lib.name}\nUmumiy: ${stockCount}`;
      }
    }

    return `Umumiy: ${stockCount} nusxa`;
  };

  // Map to inline results
  const results: InlineQueryResultArticle[] = [];
  for (const item of result.items) {
    const description = await getStockDescription(item);
    results.push({
      id: item.id.toString(),
      type: 'article',
      title: getBookTitle(item.name, item.authors),
      description,
      input_message_content: {
        message_text: `b_${item.id}`,
      },
      thumbnail_url: item.images[0] || NO_IMAGE_URL,
    });
  }

  return ctx.answerInlineQuery(results, {
    cache_time: 10,
    next_offset: (page + 1).toString(),
    button: {
      text: "Pastga suring yoki kitob nomini yozing",
      start_parameter: 'h',
    },
  });
});

export { composer as bookSearchInline };
