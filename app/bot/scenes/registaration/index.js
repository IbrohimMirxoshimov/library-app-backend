const { successFullRegistration } = require("../../utils/helpers");

const registation = {
	getRegistrationScenes() {
		return [
			require("./firstName"),
			require("./lastName"),
			require("./passportImage"),
			require("./passportId"),
			require("./address"),
			require("./phone"),
			require("./extraPhone"),
			require("./gender"),
		];
	},
	steps: {
		passportImage: {
			name: "passportImage",
			onFinish: enterNextScene,
			next: "gender",
		},
		phone: {
			name: "phone",
			onFinish: enterNextScene,
			next: "extraPhone",
		},
		extraPhone: {
			name: "extraPhone",
			onFinish: enterNextScene,
			next: "passportImage",
		},
		firstName: {
			name: "firstName",
			onFinish: enterNextScene,
			next: "lastName",
		},
		lastName: {
			name: "lastName",
			onFinish: enterNextScene,
			next: "passportId",
		},
		gender: {
			name: "gender",
			onFinish: enterNextScene,
			next: "address",
		},
		passportId: {
			name: "passportId",
			onFinish: enterNextScene,
			next: "phone",
		},
		address: {
			name: "address",
			onFinish: async (ctx) => {
				ctx.scene.leave();
				return successFullRegistration(ctx);
			},
		},
	},
};

function enterNextScene(ctx) {
	const nextScene =
		registation.steps[registation.steps[ctx.scene.state.name].next];
	return ctx.scene.enter(nextScene.name, nextScene);
}

module.exports = registation;
