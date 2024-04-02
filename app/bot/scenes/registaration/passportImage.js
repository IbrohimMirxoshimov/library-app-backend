const { Scenes } = require("telegraf");
const { ATTACHMENTS_CHANNEL_ID, DEV_ID } = require("../../../config");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const passportImage = new BaseScene("passportImage");
const fileExts = ["png", "jpg", "jpeg", "pdf"];
passportImage
	.start(leaveSceneAndSendToMain)
	.enter((ctx) => {
		return ctx.replyWithHTML(
			`<b>Passport suratini yuboring</b>\nFayl ko'rinishida yuborishingiz maqullanadi. Tiniq va yetarli darajada yorug' bo'lishiga e'tibor bering\n\nFayl formati quyidagilar bo'lishi mumkin: ${fileExts.join(
				", "
			)}`
		);
	})
	.on(["photo", "document"], async (ctx, next) => {
		try {
			let file_id;
			let method = "sendPhoto";

			if (ctx.message.photo?.length) {
				file_id = ctx.message.photo.pop().file_id;
			} else if (
				fileExts.includes(
					ctx.message.document.file_name.split(".").slice(-1)[0]
				)
			) {
				method = "sendDocument";
				file_id = ctx.message.document.file_id;
			} else {
				return ctx.reply("Iltimos to'g'ri formatdagi rasm yoki fayl yuboring!");
			}

			const res = await ctx.copyMessage(ATTACHMENTS_CHANNEL_ID, {
				caption: [
					"id",
					"phone",
					"extraPhone",
					"firstName",
					"lastName",
					"passportId",
				]
					.map((key) => `${key.toUpperCase()}: ${ctx.session.user[key]}`)
					.join("\n"),
			});

			const channel_absolute_id =
				Math.abs(ATTACHMENTS_CHANNEL_ID) - 1000000000000;

			const link = `https://t.me/c/${channel_absolute_id}/${res.message_id}`;

			ctx.session.user.passportImage = link;

			await User.update(
				{ passportImage: ctx.session.user.passportImage },
				{
					where: { id: ctx.session.user.id },
				}
			);

			return ctx.scene.state.onFinish(ctx);
		} catch (error) {
			console.error(error);
			ctx.telegram.sendMessage(DEV_ID, error.message);
			return next();
		}
	})

	.use(reenter);

module.exports = passportImage;
