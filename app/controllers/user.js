const { Op } = require("sequelize");
const { getListOptions } = require("../api/middlewares/utils");
const {
	User,
	Address,
	Region,
	Town,
	Location,
	UserLocation,
	sequelize,
} = require("../database/models");
const Verification = require("../services/Verification");
const HttpError = require("../utils/HttpError");
const { searchWhere, searchRankOrder } = require("../utils/search");
const { upperCaseAndClearOtherChars } = require("../utils/string");
const UserStatus = require("../constants/UserStatus");
const {
	isStaff,
	takeLibraryFields,
	setLibraryFields,
	applyLibraryFields,
} = require("../services/ReaderLibrary");

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
		phone: body.phone && clearPhoneNumber(body.phone),
		extraPhone: body.extraPhone && clearPhoneNumber(body.extraPhone),
		extraPhone2: body.extraPhone2 && clearPhoneNumber(body.extraPhone2),
	};
}

function clearPhoneNumber(number) {
	return number.replace(/ /g, "").replace("+998", "");
}

function parseId(value) {
	if (value === null || value === undefined || value === "") return null;
	const id = parseInt(value);
	return Number.isNaN(id) ? null : id;
}

async function addressReference(user, existingAddressId) {
	if (!user.address) {
		delete user.address;
		return;
	}

	const address = { ...user.address };
	delete address.id;
	delete address.locationId;
	delete address.createdAt;
	delete address.updatedAt;
	delete user.address;

	if (address.regionId !== undefined) {
		address.regionId = parseId(address.regionId);
		address.region = null;
		if (address.regionId) {
			const region = await Region.findByPk(address.regionId, {
				attributes: ["id", "name"],
			});
			if (!region) throw HttpError(400, "Viloyat topilmadi");
			address.region = region.name;
		}
	}

	if (address.townId !== undefined) {
		address.townId = parseId(address.townId);
		address.town = null;
		if (address.townId) {
			const town = await Town.findByPk(address.townId, {
				attributes: ["id", "name"],
			});
			if (!town) throw HttpError(400, "Tuman topilmadi");
			address.town = town.name;
		}
	}

	if (existingAddressId) {
		await Address.update(address, { where: { id: existingAddressId } });
		user.addressId = existingAddressId;
	} else {
		const created = await Address.create(address);
		user.addressId = created.id;
	}
}

// kutubxonachining kutubxonasi
function currentLibraryId(req) {
	return Number(req.user.libraryId || req.user.locationId) || null;
}

// kutubxonaga ulangan kitobxonlar sharti (user_locations orqali)
function linkedToLibraryWhere(libraryId) {
	return {
		id: {
			[Op.in]: sequelize.literal(
				`(SELECT "userId" FROM user_locations WHERE "locationId" = ${
					Number(libraryId) || 0
				})`
			),
		},
	};
}

// body dan kutubxona maydonlarini ajratadi. xodimda faqat status users da qoladi
function splitLibraryFields(body, target) {
	const fields = takeLibraryFields(body);
	if (!isStaff(target)) return fields;

	if (fields.status !== undefined) body.status = fields.status;
	return {};
}

// filters.status / filters.verified -> user_locations bo'yicha shart (filters dan o'chiriladi).
// libraryId bo'lmasa (owner) asosiy kutubxonadagi qiymat olinadi
function libraryFieldsFilter(filters, libraryId) {
	const conditions = [];

	if (filters.status !== undefined && filters.status !== "") {
		const status =
			parseInt(filters.status) === UserStatus.blocked
				? UserStatus.blocked
				: UserStatus.active;
		conditions.push(`ul.status = ${status}`);
	}
	if (filters.verified !== undefined && filters.verified !== "") {
		const verified = ["1", "true", true, 1].includes(filters.verified);
		conditions.push(`ul.verified = ${verified}`);
	}
	delete filters.status;
	delete filters.verified;
	if (!conditions.length) return null;

	const libraryCondition = libraryId
		? `ul."locationId" = ${Number(libraryId) || 0}`
		: `ul."locationId" = "users"."locationId"`;

	return sequelize.literal(
		`EXISTS (SELECT 1 FROM user_locations ul WHERE ul."userId" = "users"."id" AND ${libraryCondition} AND ${conditions.join(
			" AND "
		)})`
	);
}

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// tug'ilgan sana Toshkent vaqti bo'yicha "YYYY-MM-DD"
function birthDateKey(date) {
	if (!date) return null;
	return new Date(date).toLocaleDateString("en-CA", {
		timeZone: "Asia/Tashkent",
	});
}

// passport + tug'ilgan sana bo'yicha mavjud kitobxonni topish.
// bazada sana bo'sh bo'lsa passportning o'zi yetarli
async function findByPassportAndBirthDate(passportId, birthDate) {
	const user = await User.findOne({
		where: { passportId },
		attributes: ["id", "firstName", "lastName", "birthDate"],
		include: {
			model: Location,
			as: "libraries",
			attributes: ["id", "name"],
			through: { attributes: [] },
		},
	});

	if (!user) return { user: null, passportExists: false };

	if (user.birthDate && birthDateKey(user.birthDate) !== birthDate) {
		return { user: null, passportExists: true };
	}

	return { user, passportExists: true };
}

function parseLookupParams(source) {
	const passportId = String(source.passportId || "")
		.replace(/\s/g, "")
		.toUpperCase();
	const birthDate = String(source.birthDate || "");

	if (!/^[A-Z]{2}\d{7}$/.test(passportId))
		throw HttpError(400, "Passport noto'g'ri");
	if (!BIRTH_DATE_PATTERN.test(birthDate))
		throw HttpError(400, "Tug'ilgan sana noto'g'ri");

	return { passportId, birthDate };
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
					throw HttpError(
						400,
						"Bu passport raqami bazada mavjud. Passport va tug'ilgan sanani to'g'ri kiritib, kitobxonni kutubxonangizga ulang"
					);
				}
			}

			delete user.phoneVerified;
			if (user.code) {
				if (!Verification.verifyCode("998" + user.phone, user.code)) {
					throw HttpError(403, "Sms kodi xato yoki eskirgan!");
				}
				user.phoneVerified = new Date();
			}
			delete user.code;

			await addressReference(user);

			// blok, balans, izoh, verified - kutubxonaga bog'liq (xodimlarda faqat users.status)
			const libraryFields = splitLibraryFields(user, user);

			const result = await User.create(user);
			await setLibraryFields(result.id, result.locationId, libraryFields);

			const json = result.toJSON();
			await applyLibraryFields([json], currentLibraryId(req));

			return res.json(json).status(201);
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

			const libraryId = currentLibraryId(req);

			if (!req.user.owner) {
				Object.assign(customWhere, linkedToLibraryWhere(libraryId));
			}

			// status / verified bo'yicha filtr kutubxonadagi qiymat bo'yicha
			const query = { ...req.query };
			if (query.filters) {
				query.filters = { ...query.filters };
				const libraryFilter = libraryFieldsFilter(query.filters, libraryId);
				if (libraryFilter) {
					customWhere[Op.and] = [
						...(customWhere[Op.and] || []),
						libraryFilter,
					];
				}
			}

			let { count, rows } = await User.findAndCountAll(
				getListOptions(
					query,
					{
						// "i{id}.{firstName} {lastName} {passportId} {phone} {extraPhone} {extraPhone2}"
						// "i{id}." prefiksi id bo'yicha qidirish uchun saqlangan
						search: ({ q }) =>
							searchWhere(
								q,
								(norm) => `'i' || "users"."id" || '.' || ${norm(
									`coalesce("users"."firstName", '') || ' ' || coalesce("users"."lastName", '') || ' ' || coalesce("users"."passportId", '')`
								)}
									|| ' ' || coalesce("users"."phone", '')
									|| ' ' || coalesce("users"."extraPhone", '')
									|| ' ' || coalesce("users"."extraPhone2", '')`
							),
						// ism-familiya (yoki familiya-ism) so'rov bilan boshlanadiganlar birinchi
						searchOrder: ({ q }) =>
							searchRankOrder(q, [
								`coalesce("users"."firstName", '') || coalesce("users"."lastName", '')`,
								`coalesce("users"."lastName", '') || coalesce("users"."firstName", '')`,
							]),
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
									"id",
									"addressLine",
									"countryCode",
									"createdAt",
									"region",
									"town",
									"regionId",
									"townId",
									"latitude",
									"longitude",
								],
							},
						];
					},
					customWhere
				)
			);
			const items = rows.map((r) => r.toJSON());
			await applyLibraryFields(items, libraryId);

			return res
				.json({
					page: parseInt(req.query.page) || 1,
					items,
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

			const json = result.toJSON();
			await applyLibraryFields([json], currentLibraryId(req));

			return res.json(json).status(200);
		} catch (e) {
			next(e);
		}
	},
	update: () => async (req, res, next) => {
		try {
			removeRolesFromBody(req);

			let user = clearing(req.body);
			// asosiy raqam faqat PUT /users/:id/phone orqali o'zgaradi
			delete user.phone;
			delete user.phoneVerified;
			delete user.code;
			delete user.otherLibraryBlocks;

			const existing = await User.findByPk(req.params.id, {
				attributes: ["id", "addressId", "locationId", "librarian", "owner", "moderator"],
			});

			if (!existing) return res.json({ message: "Not found" }).status(404);

			// blok, balans, izoh, verified - joriy kutubxonadagi ulanishga yoziladi
			// (xodimlarda faqat users.status)
			const libraryFields = splitLibraryFields(user, existing);

			// asosiy kutubxona (locationId) tahrirda o'zgarmaydi. kitobxon
			// boshqa kutubxonalarga user_locations orqali ulanadi
			delete user.locationId;
			if (user.librarian) {
				if (!user.libraryId) throw HttpError(400, "Location must have");
				user.locationId = user.libraryId;
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

			if (user.address) {
				await addressReference(user, existing.addressId);
			} else {
				delete user.address;
			}
			delete user.id;

			const result = await User.update(user, {
				where: { id: req.params.id },
			});

			if (!result[0])
				return res.json({ message: "Not found" }).status(404);

			await setLibraryFields(
				existing.id,
				currentLibraryId(req) || existing.locationId,
				libraryFields
			);

			return UserController.getOne()(req, res, next);
			// return res.json({ message: "Updated" }).status(200);
		} catch (e) {
			next(e);
		}
	},
	// passport + tug'ilgan sana bo'yicha bazadagi kitobxonni topish (boshqa kutubxonada bo'lsa ulash uchun)
	lookup: () => async (req, res, next) => {
		try {
			const { passportId, birthDate } = parseLookupParams(req.query);
			const { user, passportExists } = await findByPassportAndBirthDate(
				passportId,
				birthDate
			);

			if (!user) return res.status(200).json({ found: false, passportExists });

			const libraryId = currentLibraryId(req);

			return res.status(200).json({
				found: true,
				user: {
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
				},
				libraries: user.libraries.map((l) => ({ id: l.id, name: l.name })),
				linked: user.libraries.some((l) => l.id === libraryId),
			});
		} catch (e) {
			next(e);
		}
	},
	// mavjud kitobxonni joriy kutubxonaga ulash
	link: () => async (req, res, next) => {
		try {
			const { passportId, birthDate } = parseLookupParams(req.body);
			const { user } = await findByPassportAndBirthDate(
				passportId,
				birthDate
			);

			if (!user || user.id !== parseInt(req.params.id)) {
				throw HttpError(400, "Passport yoki tug'ilgan sana mos kelmadi");
			}

			const libraryId = currentLibraryId(req);
			if (!libraryId) throw HttpError(400, "Kutubxona aniqlanmadi");

			await sequelize.transaction(async (transaction) => {
				await UserLocation.findOrCreate({
					where: { userId: user.id, locationId: libraryId },
					transaction,
				});

				// bazada sana bo'sh bo'lsa kiritilgani yoziladi
				if (!user.birthDate) {
					await User.update(
						{ birthDate: new Date(`${birthDate}T00:00:00+05:00`) },
						{ where: { id: user.id }, transaction }
					);
				}
			});

			return UserController.getOne()(req, res, next);
		} catch (e) {
			next(e);
		}
	},
	// asosiy raqamni o'zgartirish. kod bo'lsa yangi raqam darhol tasdiqlanadi,
	// bo'lmasa tasdiqlash bekor qilinadi
	changePhone: () => async (req, res, next) => {
		try {
			const user = await User.findByPk(req.params.id, {
				attributes: ["id", "phone"],
			});

			if (!user) throw HttpError(404);

			const phone = req.body.phone;
			let phoneVerified = null;

			if (req.body.code) {
				if (!Verification.verifyCode("998" + phone, req.body.code)) {
					throw HttpError(403, "Sms kodi xato yoki eskirgan!");
				}
				phoneVerified = new Date();
			}

			await user.update({ phone, phoneVerified });

			return UserController.getOne()(req, res, next);
		} catch (e) {
			next(e);
		}
	},
	// hozirgi asosiy raqamni sms kod bilan tasdiqlash
	verifyPhone: () => async (req, res, next) => {
		try {
			const user = await User.findByPk(req.params.id, {
				attributes: ["id", "phone"],
			});

			if (!user) throw HttpError(404);
			if (!user.phone) throw HttpError(400, "Kitobxonda raqam yo'q");

			if (!Verification.verifyCode("998" + user.phone, req.body.code)) {
				throw HttpError(403, "Sms kodi xato yoki eskirgan!");
			}

			await user.update({ phoneVerified: new Date() });

			return UserController.getOne()(req, res, next);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = UserController;
