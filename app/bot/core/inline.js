const { Telegraf, Context } = require("telegraf");
const { NO_IMAGE_URL } = require("../../constants/mix");
const texts = require("../../constants/texts");
const { getBookStatuses } = require("../../services/app/BookServices");
const { cryllic2latin } = require("../../utils/cryllic2latin");
const { getLocation } = require("../cache");
const { getBooksWithStocks, getBook } = require("../fetch");
const { getBookMarkup, searchAndRentMarkup } = require("../utils/keyboards");
const {
	isMyBooksQuery,
	answerMyBooksQuery,
} = require("./inline/profile_inline");
const { deleteMessageWithCatch } = require("../../utils/telegrafUtils");

const emptyQuery = {
	id: 1,
	type: "article",
	title: "Ma'lumot topilmadi",
	description: "Boshqa yozuv bilan urinib ko'ring",
	input_message_content: {
		message_text: texts.definition_search,
		parse_mode: "HTML",
	},
	// reply_markup: searchMarkup().reply_markup,
};

const needReg = {
	id: 121212,
	type: "article",
	title: "Iltimos botga kiring va startni bosing",
	description:
		"Siz botdan ro'yxatdan o'tmagansiz. Botga kiring va startni bosing",
	input_message_content: { message_text: texts.need_reg },
};

function getDefinition(stocks) {
	if (!stocks || !stocks.length) {
		return "Kutubxonada mavjud emas";
	}

	let libraryNameLine = "Kutubxona: " + getLocation(stocks[0].locationId)?.name;

	if (stocks.some((s) => !s.busy)) {
		let free = stocks.filter((s) => !s.busy).length;
		return `${libraryNameLine}\nBo'sh: ${free}. Umumiy: ${stocks.length}`;
	}

	return libraryNameLine + "\nBarchasi band. Umumiy: " + stocks.length;
}

function getBookInfo(stocks) {
	if (!stocks || !stocks.length) return;

	let library = getLocation(stocks[0].locationId);

	if (!library) {
		throw new Error(
			"Uzr siz tanlagan kutubxona bu botda to'xtatilgan. Boshqa kutubxonani tanlang yoki @kutubxonachi_1 ga yozing."
		);
	}

	let free = 0;

	if (stocks.some((s) => !s.busy)) free = stocks.filter((s) => !s.busy).length;

	return {
		free: free,
		total: stocks.length,
		library: library,
	};
}

const defaultLocation = 1;

function getUserLocation(user) {
	return user.tempLocationId || user.locationId || defaultLocation;
}
function getTitle(book) {
	if (book.author) {
		return book.name + " - " + book.author.name;
	}

	return book.name;
}

/**
 * @param {Telegraf<Context>} bot
 */
function inlineQuery(bot) {
	bot
		.on("inline_query", async (ctx) => {
			if (!ctx.session?.auth) return ctx.answerInlineQuery([needReg]);

			let query = ctx.inlineQuery.query;

			// my books query
			if (isMyBooksQuery(query)) {
				return answerMyBooksQuery(ctx);
			}

			// define page index
			let pageIndex = parseInt(ctx.inlineQuery.offset) || 1;

			// fetch data from db
			let page = await getBooksWithStocks({
				name: cryllic2latin(query),
				size: 15,
				page: pageIndex,
				locationId: getUserLocation(ctx.session.user),
			});

			// no result
			if (page.length === 0) {
				if (pageIndex > 1) return;

				return ctx.answerInlineQuery([emptyQuery]);
			}

			// map inline result
			page = page.map((book, i) => ({
				id: book.id,
				type: "article",
				title: getTitle(book),
				description: getDefinition(book.stocks),
				input_message_content: { message_text: "b_" + book.id },
				thumb_url: book.image || NO_IMAGE_URL,
			}));

			return ctx
				.answerInlineQuery(page, {
					cache_time: 10,
					next_offset: pageIndex + 1,
					switch_pm_parameter: "h",
					switch_pm_text: "Pastga suring yoki kitob nomini yozing",
				})

				.catch((err) => {
					console.log("err", JSON.stringify(err, null, 2));
					throw err;
				});
		})
		.hears(/b_(\d+)/, async (ctx) => {
			try {
				if (ctx.chat && ctx.chat.type !== "private") return;

				let [, bookId] = ctx.match;
				let book = await getBook(
					parseInt(bookId),
					getUserLocation(ctx.session.user)
				);

				deleteMessageWithCatch(ctx);

				if (book) {
					return ctx.replyWithPhoto(book.image || NO_IMAGE_URL, {
						caption: getExtendedCaptionBook(book),
						parse_mode: "HTML",
						reply_markup: getBookMarkup(
							bookId,
							book.stocks && book.stocks[0]?.locationId
						).reply_markup,
					});
				}
			} catch (error) {
				console.error(error);
				return ctx.reply(error.message);
			}
		})
		.action(/b_(\d+)/, async (ctx) => {
			try {
				if (ctx.chat && ctx.chat.type !== "private") return;
				let [, bookId] = ctx.match;
				let book = await getBook(
					parseInt(bookId),
					getUserLocation(ctx.session.user)
				);

				if (book) {
					deleteMessageWithCatch(ctx);
					return ctx.replyWithPhoto(book.image || NO_IMAGE_URL, {
						caption: getExtendedCaptionBook(book),
						parse_mode: "HTML",
						reply_markup: getBookMarkup(
							bookId,
							book.stocks && book.stocks[0]?.locationId
						).reply_markup,
					});
				}
			} catch (error) {
				console.error(error);
				return ctx.reply(error.message);
			}
		})
		.action(/wf_(\d+)_(\d+)/, async (ctx) => {
			let [, bookId, locationId] = ctx.match;

			let rents = await getBookStatuses(bookId, locationId);
			return ctx.editMessageCaption(
				(ctx.callbackQuery.message.caption + getBookStatusesText(rents)).slice(
					0,
					1000
				),
				{
					caption_entities: ctx.callbackQuery.message.caption_entities,
					reply_markup: searchAndRentMarkup(bookId).reply_markup,
				}
			);
		});
}

function expiredText(date) {
	if (date < Date.now()) {
		return "🔘";
	}
	return "🟢";
}

function getBookStatusesText(rents) {
	return `\n\nKitob bo'shash sanalari:\n${rents
		.map((rent) => new Date(rent.returningDate))
		.sort((a, b) => a - b)
		.map((date, i) => `${expiredText(date)} - ${date.toLocaleDateString("ru")}`)
		.join("\n")}`;
}

function getStatusText(bookInfo) {
	if (bookInfo) {
		let status_full =
			"\n<b>Bo'sh kitoblar: </b>" +
			bookInfo.free +
			" ta. <b>Umumiy: </b>" +
			bookInfo.total;
		if (bookInfo.free) return "✅ bo'sh" + status_full;
		return "🚫 band" + status_full;
	}

	return "Kutubxonada mavjud emas";
}

function getExtendedCaptionBook(book) {
	// console.log(book);
	const bookInfo = getBookInfo(book.stocks);
	const author = book.author ? "\n<b>Muallif: </b>" + book.author.name : "";
	const library = "<b>Kutubxona: </b>" + bookInfo.library?.name;
	const status = "<b>Holati: </b>" + getStatusText(bookInfo);

	const contact = `👉 <a href="${bookInfo.library.link}">Kutubxonachi bilan bog'lanish</a>`;

	return `<b>${book.name}</b>\n\n${library}\n${status}\n${author}\nID:${book.id}\n\n${contact}\n\n@mehr_kutubxonasi`;
}

module.exports = {
	inlineQuery: inlineQuery,
};
