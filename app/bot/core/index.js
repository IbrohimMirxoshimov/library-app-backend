const { session } = require("telegraf");
const { DEV_ID } = require("../../config");
const { inlineQuery } = require("./inline");
const texts = require("../../constants/texts");
const { getSessionKey, store } = require("./session");
const { mainSend } = require("../utils/helpers");
const stageMiddleware = require("../middlewares/stage");
const { adminHandlers } = require("./admin");
const { authMiddleware, authHelp } = require("../middlewares/auth");
const { updateLocations } = require("../cache");
const { profileScene, checkPhoneScene } = require("../scenes");
const { sendGettingRentInfo } = require("../middlewares/others");
const { handleMainCommands } = require("./commands");

async function loadBot() {
	const bot = require("./bot");

	bot.catch((e) => {
		console.error("ERROR", e);
		bot.telegram.sendMessage(DEV_ID, e.stack || e.message).catch((e) => {});
	});

	await updateLocations();

	bot
		.use((ctx, next) => {
			// console.log("ctx.update", JSON.stringify(ctx.update, null, 2));

			if (ctx.update.inline_query) {
				return next();
			}

			if (ctx.chat && ctx.chat.type === "private") {
				return next();
			}

			return;
		})
		.use(
			session({
				getSessionKey: getSessionKey,
				store: store,
			})
		)
		.use(authMiddleware());

	//inline updates
	inlineQuery(bot);

	bot
		.use(stageMiddleware())
		.use(authHelp)
		.action("chl", (ctx) => ctx.scene.enter("location"))
		.action("stats", (ctx) => ctx.scene.enter("stats"))
		.action("g_rent", sendGettingRentInfo);

	handleMainCommands(bot);
	bot
		.action(texts.menu.data.my_profile, (ctx) => {
			if (ctx.session.user.phone && ctx.session.user.passportId)
				return profileScene.enter(ctx);

			return checkPhoneScene.enter(ctx);
		})
		.action("back", mainSend);

	// admin updates
	adminHandlers(bot);

	// other updates
	bot.on("text", mainSend);

	// launch main bot
	return bot.launch().then(() => {
		return bot.telegram.sendMessage(DEV_ID, "bot started");
	});
}

module.exports = loadBot;
