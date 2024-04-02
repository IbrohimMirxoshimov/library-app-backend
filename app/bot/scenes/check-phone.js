const { Scenes, Markup } = require("telegraf");
const { checkPhoneScene, loginScene } = require(".");
const texts = require("../../constants/texts");
const auth = require("../../services/auth");
const { mainSend } = require("../utils/helpers");
const { backMarkup, backButton } = require("../utils/keyboards");
const { BaseScene } = Scenes;

const CheckPhone = new BaseScene(checkPhoneScene.name);

CheckPhone.start((ctx) => {
	ctx.scene.leave();
	return mainSend(ctx);
})
	// .action(texts.cb_data.register, (ctx, next) => {
	// 	ctx.scene.leave();
	// 	deleteMessageWithCatch(ctx);
	// 	return next();
	// })
	.enter(async (ctx) => {
		return ctx.editMessageText(texts.send_phone_registred, backMarkup());
	})
	.hears(/\d{9}/, async (ctx) => {
		let [phone] = ctx.match;

		let user = await auth.CheckPhone(phone);

		if (user) return loginScene.enter(ctx, user);
		else
			return ctx.replyWithHTML(
				"<b>Bu raqam kutubxonadan ro'yxatdan o'tmagan ekan\nXato bo'lsa qayta jo'nating</b>\n\n",
				// + texts.if_you_authed
				Markup.inlineKeyboard([[backButton()]])
			);
	})
	.on("text", (ctx) => {
		return ctx.replyWithHTML(texts.send_phone_correctly);
	});

module.exports = CheckPhone;
