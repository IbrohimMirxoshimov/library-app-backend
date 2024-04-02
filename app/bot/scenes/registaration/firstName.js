const { Scenes } = require("telegraf");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const firstName = new BaseScene("firstName");

firstName
	.start(leaveSceneAndSendToMain)
	.enter((ctx) => {
		return ctx.replyWithHTML("Ismingiz yuboring");
	})
	.on("text", async (ctx) => {
		if (ctx.message.text.length > 2) {
			ctx.session.user.firstName = ctx.message.text;
			await User.update(
				{ firstName: ctx.message.text },
				{
					where: { id: ctx.session.user.id },
				}
			);
			return ctx.scene.state.onFinish(ctx);
		}
	})
	.use(reenter);

module.exports = firstName;
