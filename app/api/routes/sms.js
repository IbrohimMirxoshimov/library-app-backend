const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
const { Op } = require("sequelize");
const { User, SmsBulk, Rent, Sms } = require("../../database/models");
const { getOneDayBackDate } = require("../../utils/date");
const middlewares = require("../middlewares");
const { isLibrarian, isOwner } = require("../middlewares/permissions");
const { getListOptions } = require("../middlewares/utils");
const StatServices = require("../../services/StatServices");
const { sendBatchSmsViaEskiz } = require("../../helpers/SmsProviderApi");
const { SmsProviderType } = require("../../constants/mix");
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
					return customMessagesByJson(req, res, next);
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
							status: "draft",
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
					{ ...req.query, sort: "id", order: "ASC" },
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

	route.delete("/messages/:id", middlewares.destroy(Sms));
};

async function customMessagesByJson(req, res, next) {
	if (!req.user.owner) {
		throw HttpError(403);
	}

	/**
	 * @type {{text: string, phone_number: string}[]}
	 */
	const message_and_phone_data = JSON.parse(req.body.text);

	const validated = Joi.array()
		.items(
			Joi.object({
				text: Joi.string().required(),
				phone_number: Joi.string().regex(/998\d{9}/),
			})
		)
		.validate(message_and_phone_data);

	if (validated.error) {
		throw new Error(validated.error.message);
	}

	const librarian = req.user;

	const smsbulk = await SmsBulk.create({
		attributes: ["id"],
		text: message_and_phone_data[0].text,
		userId: librarian.id,
	});

	await sendBatchSmsViaEskiz({
		messages: message_and_phone_data,
		message_text_limit: 1000,
	})
		.then(async (messages) => {
			res.status(200).json({
				message: "success",
			});
			await Sms.bulkCreate(
				messages.map((message) => {
					return {
						phone: message.to,
						userId: librarian.id,
						text: message.text,
						provider: SmsProviderType.eskiz,
						provider_message_id: message.user_sms_id,
						smsbulkId: smsbulk.id,
						error_reason: message.error_reason,
						status: message.error_reason ? "error" : "pending",
					};
				})
			);
		})
		.catch(async (error) => {
			console.error(error);
			next(error);
			await Sms.create({
				phone: "ERROR",
				userId: librarian.id,
				smsbulkId: smsbulk.id,
				error_reason: error.message,
				status: "error",
			});
		});
}
