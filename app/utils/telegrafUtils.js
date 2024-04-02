const { Context } = require("telegraf");

function deleteMessage(ctx) {
	try {
		if (ctx.session.deleteMessageId) {
			let messageId = ctx.session.deleteMessageId;
			delete ctx.session.deleteMessageId;
			console.log(messageId);
			ctx.telegram.deleteMessage(ctx.chat.id, messageId);
		}
	} catch (error) {
		console.log("deleteMessage error: ", error);
	}
}

/**
 *
 * @param {Context} ctx
 */
function deleteMessageWithCatch(ctx) {
	ctx.deleteMessage().catch(() => {});
}

function isCommand(string) {
	return string.startsWith("/");
}

const authing = {
	start: (ctx) => {
		ctx.session.authing = true;
	},
	end: (ctx) => {
		delete ctx.session.authing;
	},
};

function enterScene(ctx, sceneName) {
	ctx.scene.enter(sceneName);
}

function reenter(ctx) {
	return ctx.scene.reenter();
}

module.exports = {
	authing: authing,
	deleteMessage: deleteMessage,
	isCommand: isCommand,
	enterScene: enterScene,
	reenter: reenter,
	deleteMessageWithCatch: deleteMessageWithCatch,
};
