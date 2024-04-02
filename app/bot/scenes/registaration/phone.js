const { Scenes } = require("telegraf");
const texts = require("../../../constants/texts");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain, makeBold } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const phone = new BaseScene("phone");

phone
	.start(leaveSceneAndSendToMain)
	.enter((ctx) => {
		return ctx.replyWithHTML(
			makeBold("Telefon raqamingiz") +
				"\nO'zingizning faol raqamingiz yuboring\n\n" +
				texts.phone_template
		);
	})
	.hears(/\d{9}/, async (ctx) => {
		let [phone] = ctx.match;
		ctx.session.user.phone = phone;
		await User.update(
			{ phone: phone },
			{
				where: { id: ctx.session.user.id },
			}
		);
		return ctx.scene.state.onFinish(ctx);
	})
	.use(reenter);

module.exports = phone;
