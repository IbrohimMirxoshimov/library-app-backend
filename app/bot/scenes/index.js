const { getRegistrationScenes } = require("./registaration");

module.exports = {
	getSceneInstences() {
		return [
			require("./location"),
			require("./stats"),
			require("./check-phone"),
			require("./profile"),
			require("./login"),
			require("./about"),
			...getRegistrationScenes(),
		];
	},
	locationScene: {
		name: "location",
		enter: (ctx) => ctx.scene.enter("location"),
	},
	statsScene: {
		name: "stats",
		enter: (ctx) => ctx.scene.enter("stats"),
	},
	checkPhoneScene: {
		name: "check-phone",
		enter: (ctx) => ctx.scene.enter("check-phone"),
	},
	profileScene: {
		name: "profile",
		enter: (ctx) => ctx.scene.enter("profile"),
	},
	loginScene: {
		name: "login",
		enter: (ctx, data) => ctx.scene.enter("login", data),
	},
};
