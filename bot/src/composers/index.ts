import { Composer } from 'grammy';
import { CustomContext } from '../context/custom-context';
import { startComposer } from './start.composer';
import { searchComposer } from './search.composer';
import { rentInfoComposer } from './rent-info.composer';
import { statsComposer } from './stats.composer';
import { aboutComposer } from './about.composer';
import { fewBooksComposer } from './few-books.composer';
import { donationComposer } from './donation.composer';
import { profileComposer } from './profile.composer';
import { locationComposer } from './location.composer';
import { myBooksInline } from '../inline/my-books.inline';
import { bookSearchInline } from '../inline/book-search.inline';

/**
 * Root composer that registers all sub-composers.
 * Order matters: inline handlers first, then commands, then callbacks.
 */
const rootComposer = new Composer<CustomContext>();

// Inline query handlers — must be registered before command handlers
// my-books inline goes first so it can handle "my_0"/"my_1" and pass others to book search
rootComposer.use(myBooksInline);
rootComposer.use(bookSearchInline);

// Command handlers
rootComposer.use(startComposer);
rootComposer.use(searchComposer);
rootComposer.use(rentInfoComposer);
rootComposer.use(statsComposer);
rootComposer.use(aboutComposer);
rootComposer.use(fewBooksComposer);
rootComposer.use(donationComposer);

// Callback query handlers (profile, location selection)
rootComposer.use(profileComposer);
rootComposer.use(locationComposer);

export { rootComposer };
