const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
const { Op } = require("sequelize");
const { User, SmsBulk, Rent, Sms } = require("../../database/models");
const { getOneDayBackDate } = require("../../utils/date");
const middlewares = require("../middlewares");
const { isLibrarian } = require("../middlewares/permissions");
const { getListOptions } = require("../middlewares/utils");
const StatServices = require("../../services/StatServices");
const route = Router();

const users_filter_types = {
	all: "all",
	active_reading: "active_reading",
	rent_expired: "rent_expired",
	top_librarians: "top_librarians",
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
				users_filter: Joi.string().valid(...Object.values(users_filter_types)),
				text: Joi.string().max(600).required(),
				phones: Joi.array().items(Joi.string().length(9)),
			}),
		}),
		async (req, res, next) => {
			try {
				const { users_filter, text, phones = [] } = req.body;

				if (!phones.length) {
					if (users_filter === users_filter_types.top_librarians) {
						const librarians = await StatServices.getTopLibrarians({
							select: ["phone"],
						});

						phones.push(...librarians.map((r) => r.phone));
					} else {
						const where = {
							rejected: {
								[Op.not]: true,
							},
						};

						if (users_filter === users_filter_types.active_reading) {
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

				res.status(200).json({ message: `${phones.length} sms created` });
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
					await Sms.update({ status: sms.status }, { where: { id: sms.id } });
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
