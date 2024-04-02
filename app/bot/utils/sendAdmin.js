const { DEV_ID } = require("../../config");
const bot = require("../core/bot");

module.exports = async function sendAdmin(message) {
	return bot.telegram.sendMessage(DEV_ID, String(message)).catch((e) => {
		console.error(e);
	});
};
