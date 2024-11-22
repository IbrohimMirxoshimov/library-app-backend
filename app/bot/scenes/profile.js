const { Scenes, Markup } = require("telegraf");
const { profileScene } = require(".");
const UserStatus = require("../../constants/UserStatus");
const { User } = require("../../database/models");
const { backButton } = require("../utils/keyboards");
const { BaseScene } = Scenes;
const UserStatusTrasnlate = {
	[UserStatus.active]: "Faol",
	[UserStatus.blocked]: "Bloklangan",
};
function idToBarcode(id) {
	let z = 1000000000;
	return String(z + id).slice(1);
}

const Scene = new BaseScene(profileScene.name);
function getGenderIcon(gender) {
	if (gender === "male") {
		return "🧔🏻";
	}

	return "🧕🏻";
}
Scene.enter(async (ctx) => {
	const user = await User.findOne({
		where: {
			id: ctx.session.user.id,
		},
	});

	const text = `${getGenderIcon(user.gender)} Kitobxon: <b>${
		user.firstName
	} ${user.lastName || ""}</b>
☎️ Telefon raqam: <b><tg-spoiler>${
		user.phone
	}</tg-spoiler></b>\n📑 Passport: <b>${user.passportId.slice(
		0,
		2
	)}******${user.passportId.slice(-1)}</b>
${user.balance ? `💳 Balans: <b>${user.balance} so'm</b>` : ""}`;

	const keyboard = Markup.inlineKeyboard([
		[Markup.button.switchToCurrentChat("📘 O'qigan kitoblarim", "my_1")],
		[Markup.button.switchToCurrentChat("📖 O'qiyapman", "my_0")],
		[backButton()],
	]);

	if (ctx.callbackQuery) {
		ctx.answerCbQuery();
		return ctx.editMessageText(text, {
			parse_mode: "HTML",
			reply_markup: keyboard.reply_markup,
		});
	}
	return ctx.replyWithHTML(text, keyboard);
});

module.exports = Scene;
