const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
const { Op } = require("sequelize");
const { User, SmsBulk, Rent, Sms } = require("../../database/models");
const { getOneDayBackDate } = require("../../utils/date");
const middlewares = require("../middlewares");
const { isLibrarian, isOwner } = require("../middlewares/permissions");
const { getListOptions } = require("../middlewares/utils");
const StatServices = require("../../services/StatServices");
const SmsService = require("../../services/SmsService");
const { sendBatchSmsViaEskiz } = require("../../helpers/SmsProviderApi");
const { SmsProviderType, SmsStatusEnum } = require("../../constants/mix");
const HttpError = require("../../utils/HttpError");
const route = Router();

const users_filter_types = {
	active_reading: "active_reading",
	rent_expired: "rent_expired",
	top_librarians: "top_librarians",
	by_json: "by_json",
};

module.exports = (app) => {
	app.use("/sms", middlewares.isAuth, isLibrarian, route);

	route.get("/", async (req, res, next) => {
		try {
			let { count, rows } = await SmsBulk.findAndCountAll(
				getListOptions(req.query, null, SmsBulk, null, {
					userId: req.user.id,
				})
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
	});

	route.post(
		"/",
		celebrate({
			body: Joi.object({
				users_filter: Joi.string().valid(
					...Object.values(users_filter_types)
				),
				text: Joi.string().required().min(10),
				phones: Joi.array().items(Joi.string().length(9)),
			}),
		}),
		async (req, res, next) => {
			try {
				const { users_filter, text, phones = [] } = req.body;

				if (users_filter === users_filter_types.by_json) {
					await customMessagesByJson(req, res, next);
					return;
				}

				if (!phones.length) {
					if (users_filter === users_filter_types.top_librarians) {
						const librarians = await StatServices.getTopLibrarians({
							select: ["phone"],
						});

						phones.push(...librarians.map((r) => r.phone));
					} else if (
						users_filter === users_filter_types.active_reading ||
						users_filter === users_filter_types.rent_expired
					) {
						const where = {
							rejected: {
								[Op.not]: true,
							},
						};

						if (
							users_filter === users_filter_types.active_reading
						) {
							where.returnedAt = null;
						}

						if (users_filter === users_filter_types.rent_expired) {
							where.returnedAt = null;
							where.returningDate = {
								[Op.lt]: getOneDayBackDate(),
							};
						}

						const rents = await Rent.findAll({
							include: {
								model: User,
								as: "user",
								attributes: ["id", "phone"],
								where: {
									locationId: req.user.locationId,
									phone: {
										[Op.not]: null,
									},
								},
							},
							where: where,
							group: ["user.id", "rent.userId"],
							attributes: ["rent.userId"],
							limit: 500,
						});

						phones.push(...rents.map((r) => r.user.phone));
					}
				}

				const smsbulk = await SmsBulk.create({
					text: text,
					userId: req.user.id,
				});

				for (const phone of phones) {
					await Sms.create({
						phone: phone,
						smsbulkId: smsbulk.id,
						userId: req.user.id,
						locationId: req.user.locationId,
						text: text,
					});
				}

				res.status(200).json({
					message: `${phones.length} sms created`,
				});
			} catch (error) {
				next(error);
			}
		}
	);

	route.put(
		"/messages",
		celebrate({
			body: Joi.array().items(
				Joi.object().keys({
					id: Joi.required(),
					status: Joi.required(),
				})
			),
		}),
		async (req, res, next) => {
			try {
				for (const sms of req.body) {
					await Sms.update(
						{ status: sms.status },
						{ where: { id: sms.id } }
					);
				}
				res.status(200).json({ message: "Updated" });
			} catch (error) {
				next(error);
			}
		}
	);

	route.put(
		"/:id",
		celebrate({
			body: Joi.object({
				status: Joi.string().required(),
			}),
		}),
		async (req, res, next) => {
			try {
				await Sms.update(
					{ status: req.body.status },
					{
						where: {
							smsbulkId: req.params.id,
							userId: req.user.id,
							status: {
								[Op.or]: ["draft", "pending"],
							},
						},
					}
				);
				res.status(200).json({ message: "Updated" });
			} catch (error) {
				next(error);
			}
		}
	);

	route.get("/messages", async (req, res, next) => {
		try {
			const { count, rows } = await Sms.findAndCountAll(
				getListOptions(
					{ sort: "id", order: "ASC", size: 300, ...req.query },
					null,
					Sms,
					null,
					{
						userId: req.user.id,
					}
				)
			);
			return res
				.json({
					page: parseInt(req.query.page) || 1,
					items: rows,
					totalCount: count,
				})
				.status(200);
		} catch (error) {
			next(error);
		}
	});

	/**
	 * SMS lardagi suhbatlar ro'yxati (telefon raqamlar bo'yicha guruhlangan)
	 * Eng so'nggi sms updatedAt bo'yicha saralangan.
	 */
	route.get("/conversations", async (req, res, next) => {
		try {
			const limit = parseInt(req.query.size) || 20;
			const page = parseInt(req.query.page) || 1;
			const offset = (page - 1) * limit;
			const showAll = req.query.all === "true" || req.query.all === "1";
			const search = req.query.q ? `%${req.query.q}%` : null;

			// Faqat javob kelgan (receivedAt (IS NOT NULL) bo'lgan) raqamlarni olish uchun filtr
			// search bo'lsa hammasi chiqishi kerak
			let filterSql = "";
			if (!showAll && !search) {
				filterSql += ` AND phone IN (SELECT DISTINCT phone FROM sms WHERE "userId" = :userId AND "receivedAt" IS NOT NULL)`;
			}

			if (search) {
				filterSql += ` AND phone ILIKE :search`;
			}

			// PostgreSQL uchun eng tezkor query (DISTINCT ON yordamida har bir raqamdan eng oxirgi smsni olish)
			const query = `
				SELECT * FROM (
					SELECT DISTINCT ON (phone) *
					FROM sms
					WHERE "userId" = :userId
					${filterSql}
					ORDER BY phone, "updatedAt" DESC
				) AS sub
				ORDER BY "updatedAt" DESC
				LIMIT :limit OFFSET :offset
			`;

			const rows = await Sms.sequelize.query(query, {
				replacements: {
					userId: req.user.id,
					limit,
					offset,
					search,
				},
				type: Sms.sequelize.QueryTypes.SELECT,
			});

			// User meta datalarni yig'ish
			const phoneNumbers = rows.map((r) => r.phone);
			const usersMap = {};

			if (phoneNumbers.length > 0) {
				const users = await User.findAll({
					where: {
						[Op.or]: [
							{ phone: { [Op.in]: phoneNumbers } },
							{ extraPhone: { [Op.in]: phoneNumbers } },
							{ extraPhone2: { [Op.in]: phoneNumbers } },
						],
					},
					attributes: [
						"id",
						"firstName",
						"lastName",
						"phone",
						"extraPhone",
						"extraPhone2",
					],
					raw: true,
				});

				// Telefon raqamlari bo'yicha userlarni guruhlash
				users.forEach((u) => {
					const matchPhones = [
						u.phone,
						u.extraPhone,
						u.extraPhone2,
					].filter(Boolean);
					matchPhones.forEach((p) => {
						if (phoneNumbers.includes(p)) {
							if (!usersMap[p]) usersMap[p] = [];
							usersMap[p].push({
								id: u.id,
								firstName: u.firstName,
								lastName: u.lastName,
							});
						}
					});
				});
			}

			return res.status(200).json({
				page,
				items: rows,
				users: usersMap,
				// totalCount o'chirildi (performance uchun)
			});
		} catch (error) {
			next(error);
		}
	});

	/**
	 * Tanlangan telefon raqami bo'yicha smslar (chat tarixi)
	 */
	route.get("/conversations/:phone", async (req, res, next) => {
		try {
			const limit = parseInt(req.query.size) || 50;
			const page = parseInt(req.query.page) || 1;
			const offset = (page - 1) * limit;
			const phone = req.params.phone
				.replace("+998", "")
				.replace(/\s/g, "");

			const rows = await Sms.findAll({
				where: {
					userId: req.user.id,
					phone: phone,
				},
				order: [["updatedAt", "DESC"]],
				limit,
				offset,
			});

			return res.status(200).json({
				page,
				items: rows,
			});
		} catch (error) {
			next(error);
		}
	});

	route.delete("/messages/:id", middlewares.destroy(Sms));

	/**
	 * Bitta SMS yuborish (Gateway orqali)
	 */
	route.post(
		"/send-single",
		celebrate({
			body: Joi.object({
				phone: Joi.string().required(),
				text: Joi.string().required(),
			}),
		}),
		async (req, res, next) => {
			try {
				const result = await SmsService.sendSingleSms(
					req.user.id,
					req.user.locationId,
					req.body
				);
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		}
	);
};

async function customMessagesByJson(req, res) {
	/**
	 * @type {{text: string, phone_number: string}[]}
	 */
	const message_and_phone_data = JSON.parse(req.body.text);

	const validated = Joi.array()
		.items(
			Joi.object({
				text: Joi.string().required(),
				phone_number: Joi.string().regex(/\d{9}/),
			})
		)
		.validate(message_and_phone_data);

	if (validated.error || message_and_phone_data.length > 500) {
		throw new Error(validated.error.message);
	}

	const librarian = req.user;

	const smsbulk = await SmsBulk.create({
		attributes: ["id"],
		text: message_and_phone_data[0].text,
		userId: librarian.id,
	});

	// await sendBatchSmsViaEskiz({
	// 	messages: message_and_phone_data,
	// 	message_text_limit: 1000,
	// })
	// 	.then(async (messages) => {

	await Sms.bulkCreate(
		message_and_phone_data.map((message) => {
			return {
				phone: message.phone_number,
				userId: librarian.id,
				text: message.text,
				smsbulkId: smsbulk.id,
				status: SmsStatusEnum.draft,
			};
		})
	);
	res.status(200).json({
		message: "success",
	});
	// })
	// .catch(async (error) => {
	// 	console.error(error);
	// 	next(error);
	// 	await Sms.create({
	// 		phone: "ERROR",
	// 		userId: librarian.id,
	// 		smsbulkId: smsbulk.id,
	// 		error_reason: error.message,
	// 		status: "error",
	// 	});
	// });
}
