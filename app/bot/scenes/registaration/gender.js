const { Scenes, Markup } = require("telegraf");
const User = require("../../../database/models/User");
const {
	reenter,
	deleteMessageWithCatch,
} = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const gender = new BaseScene("gender");

gender
	.start(leaveSceneAndSendToMain)
	.enter((ctx) => {
		return ctx.replyWithHTML(
			"<b>Siz muslima yoki muslim</b>\nBu ma'lumot kitob qaytarish kechikkanda sizga kim telefon qilishini aniqlash uchun kerak. Ya'ni ayol kishi uchun ayol, erkak kishi uchun erkak kishi qo'ng'iroq qilishadi",
			Markup.inlineKeyboard([
				Markup.button.callback("Erkak", "male"),
				Markup.button.callback("Ayol", "female"),
			])
		);
	})
	.action(/male|female/, async (ctx) => {
		ctx.session.user.gender = ctx.callbackQuery.data;
		await User.update(
			{ gender: ctx.callbackQuery.data },
			{
				where: { id: ctx.session.user.id },
			}
		);
		deleteMessageWithCatch(ctx);
		return ctx.scene.state.onFinish(ctx);
	})
	.use(reenter);

module.exports = gender;
