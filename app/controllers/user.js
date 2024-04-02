const { Sequelize, Op } = require("sequelize");
const { getListOptions } = require("../api/middlewares/utils");
const { User, Address } = require("../database/models");
const Verification = require("../services/Verification");
const HttpError = require("../utils/HttpError");
const { upperCaseAndClearOtherChars } = require("../utils/string");

const userAttributes = (owner) => {
	if (!owner) {
		return {
			exclude: ["password"],
		};
	}

	return {};
};

function removeRolesFromBody(req) {
	if (!req.user.owner) {
		delete req.body.password;
		delete req.body.moderator;
		delete req.body.librarian;
	}
}

function clearing(body) {
	body.firstName = upperCaseAndClearOtherChars(body.firstName);
	body.lastName = upperCaseAndClearOtherChars(body.lastName);

	return {
		...body,
		phone: clearPhoneNumber(body.phone),
		extraPhone: body.extraPhone && clearPhoneNumber(body.extraPhone),
	};
}

function clearPhoneNumber(number) {
	return number.replace(/ /g, "").replace("+998", "");
}

async function addressReference(user) {
	if (user.address) {
		const [address] = await Address.upsert(user.address, { returning: true });

		user.addressId = address.id;
	}
}

const UserController = {
	add: () => async (req, res, next) => {
		try {
			removeRolesFromBody(req);

			const user = clearing(req.body);

			if (user.librarian) {
				if (!user.libraryId) throw HttpError(400, "Location must have");
				user.locationId = user.libraryId;
			}

			if (!user.libraryId) {
				user.locationId = req.user.libraryId;
			}

			if (user.passportId) {
				const isHasByPassportId = await User.findOne({
					where: { passportId: user.passportId },
					attributes: ["id"],
				});

				if (isHasByPassportId) {
					throw HttpError(400, "Bu passport raqami bazada mavjud");
				}
			}

			if (user.code) {
				if (!Verification.verifyCode("998" + user.phone, user.code)) {
					throw HttpError(403, "Sms kodi xato yoki eskirgan!");
				}
				delete user.code;
				user.phoneVerified = true;
			}

			await addressReference(user);

			const result = await User.create(user);

			return res.json(result.toJSON()).status(201);
		} catch (e) {
			next(e);
		}
	},
	getList: () => async (req, res, next) => {
		try {
			// let query = getPermissionFilters(query, req, "librarian")
			let customWhere = {
				phone: {
					[Op.not]: null,
				},
			};

			if (!req.user.owner) {
				customWhere.locationId = req.user.locationId;
			}

			let { count, rows } = await User.findAndCountAll(
				getListOptions(
					req.query,
					{
						search: ({ q }) => {
							return Sequelize.where(
								Sequelize.fn(
									"concat",
									"i",
									Sequelize.cast(Sequelize.col("users.id"), "varchar"),
									".",
									Sequelize.col("firstName"),
									Sequelize.col("lastName"),
									Sequelize.col("phone"),
									Sequelize.col("extraPhone"),
									Sequelize.col("passportId")
								),
								{
									[Op.iLike]: `%${q}%`,
								}
							);
						},
						options: {
							attributes: userAttributes(req.user.owner),
							// logging: (...l) => {
							// 	console.log("\n", ...l);
							// },
						},
					},
					User,
					() => {
						return [
							{
								as: "address",
								model: Address,
								attributes: [
									"addressLine",
									"countryCode",
									"createdAt",
									"region",
									"town",
									"latitude",
									"longitude",
								],
							},
						];
					},
					customWhere
				)
			);
			return res
				.json({
					page: parseInt(req.query.page) || 1,
					items: rows,
					totalCount: count,
				})
				.status(200);
		} catch (e) {
			next(e);
		}
	},
	getOne: () => async (req, res, next) => {
		try {
			const result = await User.findByPk(req.params.id, {
				attributes: userAttributes(req.user.owner),
				include: {
					as: "address",
					model: Address,
				},
			});

			if (!result) return res.json({ message: "Not found" }).status(404);

			return res.json(result.toJSON()).status(200);
		} catch (e) {
			next(e);
		}
	},
	update: () => async (req, res, next) => {
		try {
			removeRolesFromBody(req);

			let user = clearing(req.body);

			if (user.librarian) {
				if (!user.libraryId) throw HttpError(400, "Location must have");
				user.locationId = user.libraryId;
			}

			if (!user.libraryId) {
				user.locationId = req.user.libraryId;
			}

			if (req.body.passportId) {
				const isHasByPassportId = await User.findOne({
					where: { passportId: req.body.passportId },
					attributes: ["id"],
				});

				if (
					isHasByPassportId &&
					isHasByPassportId.id !== parseInt(req.params.id)
				) {
					throw HttpError(400, "Bu passport raqami bazada mavjud");
				}
			}

			await addressReference(user);

			const result = await User.update(user, {
				where: { id: req.params.id },
			});

			if (!result[0]) return res.json({ message: "Not found" }).status(404);

			return UserController.getOne()(req, res, next);
			// return res.json({ message: "Updated" }).status(200);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = UserController;
