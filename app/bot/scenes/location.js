const { Scenes, Markup } = require("telegraf");
const User = require("../../database/models/User");
const { cache } = require("../cache");
const { mainSend, authUser } = require("../utils/helpers");
const { BaseScene } = Scenes;

const location = new BaseScene("location");

location
	.enter(async (ctx) => {
		let t = `Kutubxonani tanlang\n\nKutubxona joylashgan tuman so'ng viloyat yoki shahar ko'rsatilgan`;
		let m = Markup.inlineKeyboard(
			cache
				.getLocations()
				.map((l) => [
					Markup.button.callback(`🏛 ${l.name} - ${l.region.name}`, "l" + l.id),
				])
		);

		if (ctx.callbackQuery) {
			ctx.answerCbQuery();
			return ctx.editMessageText(t, m);
		}

		return ctx.reply(t, m);
	})
	.action(/l(\d+)/, async (ctx) => {
		let = [, lid] = ctx.match;
		lid = parseInt(lid);

		// change this when registration is working
		if (ctx.session.user) {
			await User.update(
				{
					tempLocationId: lid,
				},
				{
					where: {
						telegramId: ctx.from.id.toString(),
					},
				}
			);
			ctx.session.user.tempLocationId = lid;
		} else {
			await authUser(ctx);
		}

		ctx.scene.leave();
		return mainSend(ctx);
	})
	.use((ctx) => ctx.scene.reenter());

module.exports = location;
