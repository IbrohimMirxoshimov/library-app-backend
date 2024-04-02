const { Scenes } = require("telegraf");
const texts = require("../../constants/texts");
const StatServices = require("../../services/StatServices");
const { backMarkup } = require("../utils/keyboards");
const { BaseScene } = Scenes;

const stats = new BaseScene("stats");

stats.enter(async (ctx) => {
	const stats = await StatServices.getStats();

	// const top_librarians_text = `${
	// 	texts.stat.top_librarians
	// }\n${stats.top_librarians
	// 	.map(
	// 		(user, i) =>
	// 			`<b>${i + 1}.</b> ${user.lastName} ${user.firstName[0]}. – ${
	// 				user.count
	// 			} martta`
	// 	)
	// 	.join("\n")}\n\n`;

	const text = `${texts.stat.general}\n\n${
		texts.stat.books_count + stats.books_count
	} ta\n${texts.stat.librarians_count + stats.librarians_count} ta\n${
		texts.stat.rents_count + stats.rents_count
	} ta\n${texts.stat.males + stats.gender.male} | ${
		texts.stat.females + stats.gender.female
	}\n${texts.stat.reading_books_count + stats.reading_books_count} ta\n${
		texts.stat.expired_leases + stats.expired_leases
	} ta\n${
		texts.stat.dayly_leasing_books_avarage_count_of_last_month +
		stats.dayly_leasing_books_avarage_count_of_last_month
	} ta\n${
		texts.stat.leased_books_count_of_last_month +
		stats.leased_books_count_of_last_month
	} ta\n${
		texts.stat.leased_books_count_of_last_week +
		stats.leased_books_count_of_last_week
	} ta\n${
		texts.stat.new_users_count_of_last_24_hours +
		stats.new_users_count_last_24_hours
	} ta\n\n${texts.stat.top_books}\n${stats.top_books
		.slice(0, 20)
		.map((book, i) => `<b>${i + 1}.</b> ${book.name} – ${book.count} martta`)
		.join("\n")}\n\n${texts.stat.warning}\n\n${texts.stat.footer}`;

	if (ctx.callbackQuery) {
		ctx.answerCbQuery();
		return ctx.editMessageText(text, {
			reply_markup: backMarkup().reply_markup,
			parse_mode: "HTML",
		});
	}

	return ctx.replyWithHTML(text, backMarkup());
});

module.exports = stats;
