const { MAIN_CHANNEL_CHAT_ID } = require("../../config");

async function isMember(user_id) {
	const bot = require("../core/bot");

	return bot.telegram
		.getChatMember(MAIN_CHANNEL_CHAT_ID, user_id)
		.then((r) => {
			const allowed_statuses = ["creator", "administrator", "member"];
			console.log(r);
			return allowed_statuses.includes(r.status);
		})
		.catch((e) => {
			console.error(e);
			return false;
		});
}

module.exports = isMember;
