const store = new Map();

const getSessionKey = (ctx) => {
	if (ctx.from?.id) {
		return +ctx.from.id;
	}

	return undefined;
};

module.exports = {
	store: store,
	getSessionKey: getSessionKey,
};
