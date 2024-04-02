const { getSessionKey } = require("../core/session");
const UserApi = require("../fetch/UserApi");
const { authUser } = require("../utils/helpers");

const authMiddleware = () => (ctx, next) => {
	if (!ctx.session) {
		if (getSessionKey(ctx)) {
			ctx.session = {};
		} else {
			return;
		}
	}

	clearTimeout(ctx.session.to);
	ctx.session.to = setTimeout(async () => {
		if (ctx.session.auth) {
			next();
		} else {
			if (ctx.session.authing) return next();

			let user = await UserApi.findOne({
				where: { telegramId: ctx.from.id.toString() },
			});
			if (user) {
				ctx.session.user = user.toJSON();
				ctx.session.auth = true;
			} else {
				if (ctx.inlineQuery) return next();
				ctx.session.authing = true;
				ctx.session.enterScene = "location";
				await authUser(ctx);
			}

			next();
		}
	}, 300);
};

const authHelp = (ctx, next) => {
	if (ctx.session.enterScene) {
		delete ctx.session.enterScene;
		return ctx.scene.enter("location");
	}

	return next();
};
module.exports = { authHelp: authHelp, authMiddleware: authMiddleware };
