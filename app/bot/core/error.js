function errorHandlers(bot) {
	bot.catch((e) => {
		console.error("ERROR", e);
		bot.telegram.sendMessage(DEV_ID, e.stack || e.message).catch((e) => {});
	});
}
module.exports = {
	errorHandlers: errorHandlers,
};
