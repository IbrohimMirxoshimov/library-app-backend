const { Sequelize, Op } = require("sequelize");
const { getListOptions } = require("../api/middlewares/utils");
const { DEV_ID } = require("../config");
const UserStatus = require("../constants/UserStatus");
const db = require("../database/models");
const { Rent, Stock, User, Book, Comment } = db;
const { sendMessageFromTelegramBot } = require("../services/Notifications");
const { report } = require("../services/RentServices");
const StatServices = require("../services/StatServices");
const HttpError = require("../utils/HttpError");
const {
	getReportText,
	getRentDurationInDays,
	getReturningDateIfIsNotWorkingDay,
} = require("../utils/rent");
const BLOCKING_LATE_TIME_FROM_LEASED_IN_DAYS = 70;
const BLOCKING_LATE_TIME_FROM_LEASED_IN_MS =
	BLOCKING_LATE_TIME_FROM_LEASED_IN_DAYS * 24 * 60 * 60 * 1000;
const BLOCKING_LATE_TIME_FROM_RETURNING_IN_DAYS = 10;
const BLOCKING_LATE_TIME_FROM_RETURNING_IN_MS =
	BLOCKING_LATE_TIME_FROM_RETURNING_IN_DAYS * 24 * 60 * 60 * 1000;
async function isRequiredBook(book_id) {
	return StatServices.getFewBooks({ cached: true }).then((books) =>
		books.some((book) => book.bookId === book_id)
	);
}

function canGetMoreRents(active_rents_count, leased_rents) {
	const strategy = [
		{
			min_leases: 5,
			max_actives: 2,
		},
		{
			min_leases: 12,
			max_actives: 3,
		},
		{
			min_leases: 25,
			max_actives: 4,
		},
		{
			min_leases: 40,
			max_actives: 5,
		},
	];

	return strategy.some(
		(s) =>
			s.max_actives > active_rents_count && s.min_leases <= leased_rents
	);
}

async function isUserVerified(user_id) {
	return User.findOne({
		where: {
			id: user_id,
			verified: true,
		},
	}).then(Boolean);
}

// create update location id kiritish kerak
// statistika hammasini stock.location olib tashlash o'rniga rent location ishlatish kerak

async function isUserActive(user_id) {
	return User.findOne({
		where: {
			id: user_id,
			status: UserStatus.active,
		},
	}).then(Boolean);
}

async function canGetMoreRentStrategy(stock, userId) {
	const active_rents_count = await Rent.count({
		where: {
			userId: userId,
			returnedAt: {
				[Op.is]: null,
			},
		},
	});

	if (active_rents_count === 0) return;

	// shu joyda o'zgartirish kiritamiz
	// zarur kitob bor odam umuman kitob ololmaydi. Yoki biror kitob olgan odam zarur kitob ololmaydi.
	// Hullas zarur kitob olgan odam umuman boshqa kitob ololmaydi.
	// Ballik tizimga o'tguncha yoki boshqa yechim topilgunicha

	// agar kitobxonda faol ijara mavjud bo'lsa zarur kitob berilmaydi
	if (await isRequiredBook(stock.bookId)) {
		if ((await isUserVerified(userId)) && active_rents_count < 5) return;
		throw HttpError(
			400,
			"Qo'shimcha kitob sifatida berilmaydi. Zarur kitoblar ro'yxatiga kiritilgan!"
		);
	}

	// active rentlarni olamiz
	const active_rents = await Rent.findAll({
		where: {
			userId: userId,
			returnedAt: {
				[Op.is]: null,
			},
		},
		include: {
			model: Stock,
			as: "stock",
			paranoid: false,
		},
	});

	// reject qiligan ijara borlikka tekshiramiz
	for (const active_rent of active_rents) {
		if (active_rent.rejected) {
			throw HttpError(
				400,
				"Kitobxonda umuman qaytarilmagan kitob mavjud"
			);
		}
	}

	// avval bironta zarur kitob olgan bo'lsa boshqa kitob berilmaydi
	for (const active_rent of active_rents) {
		// if required
		if (await isRequiredBook(active_rent.stock.bookId)) {
			if ((await isUserVerified(userId)) && active_rents_count < 5)
				return;
			throw HttpError(
				400,
				"Qo'shimcha kitob sifatida berilmaydi. Zarur kitoblar ro'yxatiga kiritilgan!"
			);
		}
	}

	// endi agarda avval olgan kitoblarida ham hozirgi kitob ham zarur bo'lmasa
	// shu kungacha nechta kitob o'qiganligiga qarab qancha kitob ola olishi belgilanadi

	// qancha kitob o'qiganligi
	const all_rents_count = await Rent.count({
		where: {
			userId: userId,
		},
	});

	const leased_rents = all_rents_count - active_rents_count;

	if (!canGetMoreRents(active_rents_count, leased_rents)) {
		if ((await isUserVerified(userId)) && active_rents_count < 5) return;
		throw HttpError(
			400,
			`Berilmaydi. Kitobxonda ${active_rents_count} ta faol ijara mavjud!`
		);
	}
}
async function canUserGetRent(userId, libraryId, bookPrice = 50000) {
	if (!userId) {
		throw HttpError(400, "User not found");
	}

	const user = await User.findOne({
		where: {
			id: userId,
			locationId: libraryId,
		},
	});

	if (!user) {
		throw HttpError(400, "User not found");
	}

	if (user.status === UserStatus.active) {
		return true;
	}

	if (user.status === UserStatus.blocked) {
		if (user.blockingReason) {
			throw HttpError(
				400,
				user.blockingReason + `\nKitob ${bookPrice} so'm`
			);
		}

		if (user.balance >= bookPrice) {
			return true;
		}

		throw HttpError(
			400,
			`Bloklangan. Kitobxon hisobida eng kami ${bookPrice} so'm mavjud bo'lishi kerak.`
		);
	}

	throw HttpError(400, "Kutilmagan xatolik");
}

async function checkToAdd(req) {
	if (req.body.returnedAt) throw HttpError(400);
	if (req.body.returningDate < req.body.leasedAt)
		throw HttpError(400, "Sana to'g'ri emas");

	const stock = await Stock.findOne({
		include: {
			model: Book,
			as: "book",
			paranoid: false,
		},
		where: {
			id: req.body.stockId,
			locationId: req.user.libraryId,
			busy: false,
		},
		paranoid: false,
	});

	if (!stock) throw HttpError(400, "Kitob mavjud emas yoki nofaol!");

	await canUserGetRent(req.body.userId, req.user.libraryId, stock.book.price);

	// * Check max rent duration
	// temporary only location id is 1
	// should add check duration feature to location and we can use it here
	if (stock.locationId === 1) {
		const duration_day = getRentDurationInDays(req.body);

		if (duration_day >= stock.book.rentDuration + 1) {
			throw HttpError(
				400,
				`Berilmaydi. Eng ko'p o'qish muddati: ${stock.book.rentDuration} kun`
			);
		}
	}

	// Does user can get more books
	await canGetMoreRentStrategy(stock, req.body.userId);

	return stock;
}

const RentController = {
	getList: () => async (req, res, next) => {
		try {
			let { count, rows } = await Rent.findAndCountAll(
				getListOptions(
					req.query,
					{
						search: ({ q }) => {
							return Sequelize.where(
								Sequelize.fn(
									"concat",
									"i",
									Sequelize.cast(
										Sequelize.col("rent.id"),
										"varchar"
									),
									"c",
									Sequelize.cast(
										Sequelize.col("customId"),
										"varchar"
									),
									"u",
									Sequelize.cast(
										Sequelize.col("user.id"),
										"varchar"
									),
									".",
									Sequelize.col("user.firstName"),
									Sequelize.col("user.lastName"),
									"p",
									Sequelize.col("user.phone"),
									"p",
									Sequelize.col("user.extraPhone"),
									"p",
									Sequelize.col("user.extraPhone2"),
									"s",
									Sequelize.cast(
										Sequelize.col("stockId"),
										"varchar"
									),
									"b",
									Sequelize.cast(
										Sequelize.col("stock.bookId"),
										"varchar"
									),
									"."
								),
								{
									[Op.iLike]: `%${q}%`,
								}
							);
						},
					},
					Rent,
					(q) => [
						{
							model: Stock,
							as: "stock",
							where: req.user.owner
								? undefined
								: {
										locationId: req.user.libraryId,
								  },
							paranoid: false,
						},
						{
							model: User,
							as: "user",
							attributes: {
								include: ["firstName", "lastName"],
							},
							paranoid: false,
						},
					]
					// {
					// 	rejected:
					// 		req.query.rejected === "all"
					// 			? {
					// 					[Op.not]: null,
					// 			  }
					// 			: {
					// 					[Op.is]: Boolean(req.query.rejected),
					// 			  },
					// }
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
	report: () => async (req, res, next) => {
		try {
			let query = req.query;
			let r = await report(req.user.libraryId);

			if (query.format === "text") {
				return res.send(getReportText(r)).status(200);
			}

			return res.json(rows).status(201);
		} catch (e) {
			next(e);
		}
	},
	checkToAdd: () => async (req, res, next) => {
		try {
			await checkToAdd(req);

			return res.json({ message: "OK" }).status(200);
		} catch (e) {
			next(e);
		}
	},
	add: () => async (req, res, next) => {
		const transaction = await db.sequelize.transaction();

		try {
			const stock = await checkToAdd(req);
			// modify for working days
			req.body.returningDate = getReturningDateIfIsNotWorkingDay(
				req.body
			);

			// make stock busy
			await Stock.update(
				{ busy: true },
				{
					where: {
						id: req.body.stockId,
						locationId: req.user.libraryId,
						busy: false,
					},
					transaction,
				}
			);

			const result = await Rent.create(req.body, { transaction });

			await transaction.commit();

			res.json(result.toJSON()).status(201);

			// sendMessageFromTelegramBot(
			// 	DEV_ID,
			// 	`B: ${stock.book.id} D: ${getRentDurationInDays(req.body)} L: ${
			// 		stock.locationId
			// 	}\n${stock.book.name}`
			// ).catch((e) => console.error(e));
		} catch (e) {
			await transaction.rollback();
			next(e);
		}
	},
	return: () => async (req, res, next) => {
		const transaction = await db.sequelize.transaction();

		try {
			const rent = await Rent.findByPk(parseInt(req.params.id), {
				include: {
					model: Stock,
					as: "stock",
					where: {
						locationId: req.user.libraryId,
					},
					paranoid: false,
				},
				paranoid: false,
				transaction,
			});

			if (!rent || rent.returnedAt) throw HttpError(404);

			await Stock.update(
				{ busy: false, deletedAt: null },
				{
					where: {
						id: rent.stock.id,
					},
					paranoid: false,
					transaction,
				}
			);

			await rent.update(
				{
					returnedAt: new Date(),
					rejected: false,
				},
				{ transaction }
			);

			const customer = await User.findOne({
				where: {
					id: rent.userId,
				},
				attributes: ["id", "blockingReason"],
				transaction,
			});

			const very_long_leased =
				new Date().getTime() - rent.leasedAt.getTime() >
				BLOCKING_LATE_TIME_FROM_LEASED_IN_MS;
			const long_late =
				new Date().getTime() - rent.returningDate.getTime() >
				BLOCKING_LATE_TIME_FROM_RETURNING_IN_MS;

			// block user
			if (very_long_leased || long_late) {
				if (very_long_leased) {
					customer.blockingReason =
						(customer.blockingReason || "") +
						`Kitobxon ${BLOCKING_LATE_TIME_FROM_LEASED_IN_DAYS} kun muddat kitobni qaytarmagan\n`;
				}
				if (long_late) {
					customer.blockingReason =
						(customer.blockingReason || "") +
						`Kelishilgan muddatdan ${BLOCKING_LATE_TIME_FROM_RETURNING_IN_DAYS} kun o'tib ketgan\n`;
				}

				await User.update(
					{
						status: UserStatus.blocked,
						blockingReason: customer.blockingReason,
					},
					{
						where: {
							id: rent.userId,
						},
						transaction,
					}
				);
			}

			await transaction.commit();

			return res
				.json({
					message: "Updated",
					user_blocked_reason: customer.blockingReason,
				})
				.status(200);
		} catch (e) {
			await transaction.rollback();
			next(e);
		}
	},
	returnWithCustomid: () => async (req, res, next) => {
		try {
			throw HttpError(400, "Bu imkoniyat ishlashdan to'xtadi");
		} catch (e) {
			next(e);
		}
	},
	reject: () => async (req, res, next) => {
		try {
			const rent = await Rent.findByPk(parseInt(req.params.id), {
				include: {
					model: Stock,
					as: "stock",
					where: {
						locationId: req.user.libraryId,
					},
				},
			});

			if (!rent) throw HttpError(404);

			await rent.update({
				rejected: true,
			});
			await rent.stock.destroy();

			return res.json({ message: "Rejected" }).status(200);
		} catch (e) {
			next(e);
		}
	},
	delete: () => async (req, res, next) => {
		try {
			const rent = await Rent.findByPk(parseInt(req.params.id), {
				include: {
					model: Stock,
					as: "stock",
					where: {
						locationId: req.user.libraryId,
					},
					paranoid: false,
				},
			});

			if (!rent) throw HttpError(404);

			if (!rent.returnedAt)
				await rent.stock.update({
					busy: false,
				});

			await rent.destroy();

			return res.json({ message: "Destroyed" }).status(200);
		} catch (e) {
			next(e);
		}
	},
	getOne: () => async (req, res, next) => {
		try {
			let result = await Rent.findByPk(req.params.id, {
				include: { as: "stock", model: Stock },
			});

			if (!result) return res.status(404).json({ message: "Topilmadi" });

			return res.status(200).json(result.toJSON());
		} catch (e) {
			next(e);
		}
	},
	edit: () => async (req, res, next) => {
		try {
			const rent = await Rent.findOne({
				where: { id: req.params.id },
			});

			if (req.body.returningDate) {
				// modify for working days
				req.body.returningDate = getReturningDateIfIsNotWorkingDay(
					req.body
				);
			}

			const result = await Rent.update(req.body, {
				where: { id: req.params.id },
			});

			if (!result[0])
				return res.json({ message: "Not found" }).status(404);

			if (req.body.returningDate) {
				await Comment.create({
					text: `Qaytarilish sanasi ${new Date(
						rent.returningDate
					).toLocaleDateString("ru")} dan ${new Date(
						req.body.returningDate
					).toLocaleDateString("ru")} ga o'zgartirildi`,
					rentId: req.params.id,
				});
			}

			return res.json({ message: "Updated" }).status(200);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = RentController;
