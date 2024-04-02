const { Scenes, Markup } = require("telegraf");
const { loginScene, profileScene } = require(".");
const texts = require("../../constants/texts");
const { User } = require("../../database/models");
const { mainSend } = require("../utils/helpers");
const { backMarkup, registerButton } = require("../utils/keyboards");
const { BaseScene } = Scenes;

const Scene = new BaseScene(loginScene.name);

Scene.start((ctx) => {
	ctx.scene.leave();
	return mainSend(ctx);
})
	.enter(async (ctx) => {
		return ctx.reply(
			"Kutubxonadan ro'yxatdan otgan passport seriyangizni yuboring\n\nShu shaklda: AA1234567",
			backMarkup()
		);
	})
	.hears(/^[A-Za-b]{2}\d{7}$/, async (ctx) => {
		let [passport] = ctx.match;
		let user = ctx.scene.state;
		if (user.passportId === passport) {
			await User.destroy({
				where: {
					telegramId: String(ctx.from.id),
					phone: null,
					passportId: null,
				},
			});
			let [_, [newUser]] = await User.update(
				{
					tempLocationId: ctx.session.user.tempLocationId,
					telegramId: ctx.session.user.telegramId,
				},
				{ where: { id: user.id }, returning: true }
			);

			ctx.session.user = newUser;
			await ctx.reply(
				`Assalomu alaykum\n${newUser.firstName} ${newUser.lastName}\n\nProfilinigzga muvoffaqiyatli kirdingiz!`
			);

			return profileScene.enter(ctx);
		} else {
			return ctx.reply(
				"Passport seriyasi mos kelmadi. \nXato yuborgan bo'lsangiz yana bir martta qayta yuborishingiz mumkin.\n\n" +
					texts.if_you_authed,
				backMarkup()
			);
		}
		// let user = await auth.CheckPhone(passport);

		// if (user) return loginScene.enter(ctx, user);
		// else
		// 	return ctx.replyWithHTML(
		// 		"Bu raqam kutubxonadan ro'yxatdan o'tmagan ekan",
		// 		backMarkup()
		// 	);
	})
	.on("text", (ctx) => {
		return ctx.replyWithHTML(texts.send_passport_correctly);
	});

module.exports = Scene;
