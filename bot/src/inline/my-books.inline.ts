import { Composer } from 'grammy';
import { InlineQueryResultArticle } from 'grammy/types';
import { CustomContext } from '../context/custom-context';
import { apiClient } from '../api/client';
import { formatRentalDateRange, getBookTitle } from '../utils/format.utils';
import { parseInlineOffset } from '../utils/pagination.utils';

/** Placeholder image for books without a cover */
const NO_IMAGE_URL = 'https://via.placeholder.com/100x150.png?text=No+Image';

/** Shape of a rental returned by the account books endpoint */
interface AccountBookRental {
  id: number;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  stock: {
    id: number;
    book: {
      id: number;
      name: string;
      images: string[];
      authors?: Array<{ author: { name: string } }>;
    };
  };
  library?: {
    id: number;
    name: string;
  };
}

interface AccountBooksResponse {
  items: AccountBookRental[];
  meta: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
}

const composer = new Composer<CustomContext>();

/**
 * Handle "my_0" (currently reading) and "my_1" (already returned) inline queries.
 * These are triggered from the profile keyboard's inline switch buttons.
 */
composer.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim();
  const match = query.match(/^my_(\d?)$/);

  if (!match) return;

  // Check if user is authenticated
  if (!ctx.session.isAuthenticated || !ctx.session.userId) {
    return ctx.answerInlineQuery([
      {
        id: 'needauth',
        type: 'article',
        title: "Ma'lumot topilmadi",
        description: "Botga kiring va startni bosing",
        input_message_content: {
          message_text: "Hech qanday kitoblar topilmadi",
          parse_mode: 'HTML',
        },
      },
    ]);
  }

  // "my_1" = returned books, "my_0" (or "my_") = currently reading
  const returned = match[1] === '1';
  const page = parseInlineOffset(ctx.inlineQuery.offset);

  // Fetch user's books via API
  // Note: we call the API with the userId as a query param since bot uses service token
  const result = await apiClient.get<AccountBooksResponse>(
    `/app/account/books?page=${page}&size=15&returned=${returned ? '1' : '0'}&userId=${ctx.session.userId}`,
  );

  if (!result || result.items.length === 0) {
    if (page > 1) {
      return ctx.answerInlineQuery([]);
    }
    return ctx.answerInlineQuery([
      {
        id: 'empty_books',
        type: 'article',
        title: "Ma'lumot topilmadi",
        input_message_content: {
          message_text: 'Hech qanday kitoblar topilmadi',
          parse_mode: 'HTML',
        },
      },
    ]);
  }

  // Map rentals to inline results
  const results: InlineQueryResultArticle[] = result.items.map((rental) => {
    const book = rental.stock.book;
    const authors = book.authors || [];
    const dateRange = formatRentalDateRange(rental.issuedAt, rental.dueDate, rental.returnedAt);

    return {
      id: rental.id.toString(),
      type: 'article',
      title: getBookTitle(book.name, authors),
      description: dateRange,
      input_message_content: {
        message_text: `b_${book.id}`,
      },
      thumbnail_url: book.images[0] || NO_IMAGE_URL,
    };
  });

  return ctx.answerInlineQuery(results, {
    next_offset: (page + 1).toString(),
    cache_time: 60,
  });
});

export { composer as myBooksInline };
