const HttpError = require("../../utils/HttpError");

const isOwner = (req, res, next) => {
	if (req.user.owner) {
		return next();
	}

	throw HttpError(403);
};

const isModerator = (req, res, next) => {
	if (req.user.moderator || req.user.owner) {
		return next();
	}

	throw HttpError(403);
};

const isLibrarian = (req, res, next) => {
	if (req.user.librarian || req.user.owner) {
		return next();
	}

	throw HttpError(403);
};

module.exports = {
	isOwner: isOwner,
	isModerator: isModerator,
	isLibrarian: isLibrarian,
};
