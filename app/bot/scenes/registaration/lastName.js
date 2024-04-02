const { Scenes } = require("telegraf");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const lastName = new BaseScene("lastName");

lastName
	.start(leaveSceneAndSendToMain)
	.enter(async (ctx) => {
		return ctx.replyWithHTML("Familiyangizni yuboring");
	})
	.on("text", async (ctx) => {
		if (ctx.message.text.length > 2) {
			ctx.session.user.lastName = ctx.message.text;
			await User.update(
				{ lastName: ctx.message.text },
				{
					where: { id: ctx.session.user.id },
				}
			);
			return ctx.scene.state.onFinish(ctx);
		}
	})
	.use(reenter);

module.exports = lastName;
