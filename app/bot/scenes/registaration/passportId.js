const { Scenes } = require("telegraf");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const passportId = new BaseScene("passportId");

passportId
	.start(leaveSceneAndSendToMain)
	.enter(async (ctx) => {
		return ctx.replyWithHTML(
			"<b>Passport seriayangizni yuboring</b>\nFoydalanuvchilarni unikalligi saqlab qolish uchun. Ya'ni siz va boshqa kitobxonni asosiy farqlovchi ma'lumot\n2 harf va 7 raqam\nShu ko'rinishda: AA1234567"
		);
	})
	.hears(/^[A-Za-b]{2}\d{7}$/, async (ctx) => {
		let passportId = ctx.match[0].toUpperCase();
		ctx.session.user.passportId = passportId;

		// check this uniq passport id
		const user = await User.findOne({
			where: { passportId: passportId },
		});

		if (user && user.id !== ctx.session.user.id) {
			await ctx.reply(
				"Siz kutubxonadan ro'yxatdan o'tgan ekansiz.\nIltimos o'z profilingizga kiring\nBuning uchun 'Profilim' tugmasini bosasiz"
			);
			return leaveSceneAndSendToMain(ctx);
		} else {
			await User.update(
				{ passportId: passportId },
				{
					where: { id: ctx.session.user.id },
				}
			);
		}

		return ctx.scene.state.onFinish(ctx);
	})
	.use(reenter);

module.exports = passportId;
