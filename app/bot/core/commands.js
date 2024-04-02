// const bot = require("./bot");
const { getDeepLink, mainSend, sendHelp } = require("../utils/helpers");
const { sendGettingRentInfo } = require("../middlewares/others");
const { backMarkup } = require("../utils/keyboards");
const { MAIN_CHANNEL_CHAT_ID } = require("../../config");
const StatServices = require("../../services/StatServices");

async function fewBooksMiddleware(ctx) {
	return StatServices.getFewBooks({ locationId: 1, cached: true }).then(
		(few_books) =>
			ctx.reply(
				`📚 <b>Eng zarur va yetishmayotgan kitoblar</b>\n\n${few_books
					.map((book, i) => i + 1 + ") " + book.name)
					.join("\n")
					.slice(0, 3000)
					.split("\n")
					.slice(0, -1)
					.join(
						"\n"
					)} \n\n<a href="https://www.mehrkutubxonasi.uz/zarur">📚 To'liq ro'yxat</a>\n\n<b>Siz ham kutubxonaga hissa qo'shib minglab kitobxonlar ilm olishiga sababchi bo'lishingiz mumkin\n@${
					ctx.botInfo.username
				}</b>`,
				{
					parse_mode: "HTML",
				}
			)
	);
}

function handleMainCommands(bot) {
	bot
		.start((ctx) => {
			if (getDeepLink(ctx.message.text) === "h") return sendHelp(ctx);

			return mainSend(ctx);
		})
		.command("yordam", sendHelp)
		.command("qidirish", sendHelp)
		.command("kitob", sendGettingRentInfo)
		.command("zarur", fewBooksMiddleware)
		.command("hissa", (ctx) =>
			ctx.telegram.copyMessage(ctx.chat.id, MAIN_CHANNEL_CHAT_ID, 44, {
				reply_markup: backMarkup().reply_markup,
			})
		)
		.command("natija", (ctx) => ctx.scene.enter("stats"))
		.command("haqida", (ctx) => ctx.scene.enter("about"));
}

module.exports = { handleMainCommands };
