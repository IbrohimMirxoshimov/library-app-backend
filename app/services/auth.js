const { Op } = require("sequelize");
const User = require("../database/models/User");
const HttpError = require("../utils/HttpError");
const { verifyCode } = require("./Verification");
const jwt = require("jsonwebtoken");
const config = require("../config");
const EXPIRE_TIME_TOKEN = 1000 * 60 * 60 * 24 * 12;

function generateToken(user) {
	return jwt.sign(
		{
			id: user.id,
			librarian: user.librarian,
			libraryId: user.libraryId,
			locationId: user.locationId,
			owner: user.owner,
			moderator: user.moderator,
			exp: Math.floor((Date.now() + EXPIRE_TIME_TOKEN) / 1000),
		},
		config.jwtSecret
	);
}

function getAttributesByPermission(
	object,
	excludes = ["tempLocationId", "deletedAt", "password"]
) {
	for (const key of excludes) {
		delete object[key];
	}

	return object;
}

module.exports = {
	async SignIn(username, password) {
		const userRecord = await User.findOne({
			where: {
				[Op.or]: [{ username: username }, { phone: username }],
			},
			raw: true,
		});

		if (!userRecord) throw HttpError(403);

		const validPassword =
			userRecord.password === password || userRecord.passportId === password;

		if (validPassword) {
			let user = { ...userRecord };

			return {
				user: getAttributesByPermission(user),
				token: generateToken(userRecord),
			};
		} else {
			throw HttpError(403);
		}
	},
	async CheckPhone(phone) {
		const userRecord = await User.findOne({
			where: {
				phone: phone,
			},
			raw: true,
		});

		return userRecord;
	},
	async SignUp(userToRegistr) {
		let user = await this.CheckPhone(userToRegistr.phone);

		if (user) {
			user = (
				await User.update(
					{
						...userToRegistr,
						phoneVerified: true,
					},
					{
						where: {
							id: user.id,
						},
						returning: true,
					}
				)
			)[1][0].toJSON();
		} else {
			user = (
				await User.create({
					...userToRegistr,
					phoneVerified: true,
				})
			).toJSON();
		}

		return getAttributesByPermission(user, [
			"moderator",
			"librarian",
			"owner",
			"tempLocationId",
			"password",
			"libraryId",
		]);
	},
	async SignUpWithPhoneValidation({ code, ...user }) {
		if (verifyCode(user.phone, code)) {
			return this.SignUp(user);
		}

		throw HttpError(403);
	},
};
