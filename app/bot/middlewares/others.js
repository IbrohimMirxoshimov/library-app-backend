const { Markup } = require("telegraf");
const { searchButton, backButton } = require("../utils/keyboards");

function sendGettingRentInfo(ctx) {
	return ctx.telegram.copyMessage(ctx.from.id, "-1001437994129", 2, {
		reply_markup: Markup.inlineKeyboard([[searchButton(ctx)], [backButton()]])
			.reply_markup,
	});
}

module.exports = {
	sendGettingRentInfo,
};
