const { Scenes } = require("telegraf");
const { MAIN_CHANNEL_CHAT_ID } = require("../../config");
const { backMarkup } = require("../utils/keyboards");
const { BaseScene } = Scenes;

const about = new BaseScene("about");

about.enter((ctx) => {
	return ctx.telegram.copyMessage(ctx.chat.id, MAIN_CHANNEL_CHAT_ID, 129, {
		reply_markup: backMarkup().reply_markup,
	});
});

module.exports = about;
