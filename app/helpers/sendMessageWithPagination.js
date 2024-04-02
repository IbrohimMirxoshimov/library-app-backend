const { toMatrix } = require("../utils/array");
function sleep(ms) {
	return new Promise((res) => setTimeout(() => res(true), ms));
}

function sendMessages(page, chat_id, ctx) {
	return Promise.all(
		page.map((text) =>
			ctx.telegram.sendMessage(chat_id, text, { parse_mode: "HTML" })
		)
	);
}

module.exports = async function sendMessageWithPagination(
	ctx,
	chat_id,
	listTexts,
	sizePage = 4,
	pauseTime = 1000
) {
	let pages = toMatrix(listTexts, sizePage);
	for (const page of pages) {
		await sendMessages(page, chat_id, ctx);
		await sleep(pauseTime);
	}
};
