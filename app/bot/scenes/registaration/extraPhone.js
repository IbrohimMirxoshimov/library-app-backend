const { Scenes } = require("telegraf");
const texts = require("../../../constants/texts");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const extraPhone = new BaseScene("extraPhone");

extraPhone
	.start(leaveSceneAndSendToMain)
	.enter(async (ctx) => {
		return ctx.replyWithHTML(
			"<b>Qo'shimcha raqam</b>\nOta, ona yoki biror yaqin insoningiz raqami kerak. Agar siz bir kun davomida o'z telefonigizni ko'tarmasangiz shu raqamga qo'ng'iroq qilamiz. Faqatgina kitobni kechiktirsangiz va qo'ng'iroq qilganda javob bermasangiz.\n\n" +
				texts.phone_template
		);
	})
	.hears(/\d{9}/, async (ctx) => {
		let [extraPhone] = ctx.match;
		ctx.session.user.extraPhone = extraPhone;
		await User.update(
			{ extraPhone: extraPhone },
			{
				where: { id: ctx.session.user.id },
			}
		);
		return ctx.scene.state.onFinish(ctx);
	})
	.use(reenter);

module.exports = extraPhone;
