const { Scenes } = require("telegraf");
const User = require("../../../database/models/User");
const { reenter } = require("../../../utils/telegrafUtils");
const { leaveSceneAndSendToMain } = require("../../utils/helpers");
const { BaseScene } = Scenes;

const address = new BaseScene("address");

address
	.start(leaveSceneAndSendToMain)
	.enter((ctx) => {
		return ctx.replyWithHTML(
			"<b>Oxirgisi, ayni vaqtda yashayotgan manzilingizni yuboring</b>\n\nKitobni qaytarish uchun kerak bo'lishi mumkin. Faqatgina umuman aloqaga chiqmasangiz, ya'ni 3 kun qo'ng'iroqqa umuman javob bermasangiz yashash manzilingizga borishimiz mumkin.\nShahar, tuman, ko'cha, uy raqami. \nIltimos to'liq yozing\n\n⚠️ Eslatib o'tamiz hozir Toshkent shahridagi kutubxona faqat Toshket shahrida yashovchi kitobxonlar uchun beriladi. Agar siz toshkent shahrida chiqib ketayotgan bo'lsangiz kitobni albatta kutubxonaga qaytarishingiz mumkin. Tez kunda boshqa viloyatlarda ham kutubxonalar tashkil qilamiz. InshaAlloh"
		);
	})
	.on("text", async (ctx) => {
		if (ctx.message.text.length > 25) {
			ctx.session.user.address = ctx.message.text;

			await User.update(
				{ address: ctx.message.text },
				{
					where: { id: ctx.session.user.id },
				}
			);

			return ctx.scene.state.onFinish(ctx);
		} else return ctx.reply("Iltimos to'liq kiriting");
	})
	.use(reenter);

module.exports = address;
