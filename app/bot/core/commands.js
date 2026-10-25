// const bot = require("./bot");
const { getDeepLink, mainSend, sendHelp } = require("../utils/helpers");
const { sendGettingRentInfo } = require("../middlewares/others");
const { backMarkup } = require("../utils/keyboards");
const { MAIN_CHANNEL_CHAT_ID } = require("../../config");
const StatServices = require("../../services/StatServices");
const { MAIN_LOCATION_ID } = require("../../constants/mix");
const { getUserLocation } = require("../cache");
const { escapeHtml } = require("../utils/helpers");

async function fewBooksMiddleware(ctx) {
	const location = getUserLocation(ctx.session.user);
	const few_books = await StatServices.getFewBooks({
		locationId: location.id,
		cached: true,
	});

	let list = "";
	for (const [i, book] of few_books.entries()) {
		const line = `${i + 1}) ${escapeHtml(book.name)}\n`;
		if (list.length + line.length > 3000) break;
		list += line;
	}

	const fullListLink =
		location.id === MAIN_LOCATION_ID
			? `<a href="https://www.mehrkutubxonasi.uz/zarur">📚 To'liq ro'yxat</a>\n\n`
			: "";

	return ctx.reply(
		`📚 <b>Eng zarur va yetishmayotgan kitoblar</b>\n🏛 <b>${escapeHtml(
			`${location.name} - ${location.region.name}`
		)}</b>\n\n${list || "Hozircha ro'yxat bo'sh\n"}\n${fullListLink}<b>Siz ham kutubxonaga hissa qo'shib minglab kitobxonlar ilm olishiga sababchi bo'lishingiz mumkin\n@${
			ctx.botInfo.username
		}</b>`,
		{
			parse_mode: "HTML",
		}
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
