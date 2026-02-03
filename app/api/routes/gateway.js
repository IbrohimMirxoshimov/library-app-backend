const { Router } = require("express");
const GatewayService = require("../../services/GatewayService");
const { celebrate, Joi } = require("celebrate");
const isAuth = require("../middlewares/isAuth");
const route = Router();

module.exports = (app) => {
	app.use("/gateway", route);

	/**
	 * Gateway uchun global so'rov loger-i.
	 * Har bir kelgan so'rovning methodi, manzili va body-sini console-ga chiqaradi.
	 */
	// route.use((req, res, next) => {
	// 	console.log(
	// 		`[GATEWAY LOG] ${new Date().toISOString()} ${req.method} ${
	// 			req.originalUrl
	// 		}`
	// 	);
	// 	if (Object.keys(req.body).length > 0) {
	// 		console.log("[GATEWAY BODY]", JSON.stringify(req.body, null, 2));
	// 	}
	// 	next();
	// });

	// Qurilmani ro'yxatdan o'tkazish
	route.post(
		"/devices",
		isAuth,
		celebrate({
			body: Joi.object({
				brand: Joi.string().allow(""),
				model: Joi.string().allow(""),
				buildId: Joi.string().allow(""),
				fcmToken: Joi.string().required(),
				enabled: Joi.boolean().optional(),
			}).unknown(),
		}),
		async (req, res, next) => {
			try {
				const result = await GatewayService.registerDevice(
					req.user.id,
					req.body
				);
				return res.status(200).json({ data: result });
			} catch (error) {
				next(error);
			}
		}
	);

	// Qurilma ma'lumotlarini yangilash
	route.patch(
		"/devices/:id",
		isAuth,
		celebrate({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				brand: Joi.string().allow(""),
				model: Joi.string().allow(""),
				buildId: Joi.string().allow(""),
				enabled: Joi.boolean().optional(),
			}).unknown(),
		}),
		async (req, res, next) => {
			try {
				const result = await GatewayService.updateDevice(
					req.params.id,
					req.user.id,
					req.body
				);

				return res.status(200).json({ data: result });
			} catch (error) {
				next(error);
			}
		}
	);

	// SMS qabul qilish
	route.post(
		"/devices/:id/receive-sms",
		isAuth,
		celebrate({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				sender: Joi.string().required(),
				message: Joi.string().required(),
				receivedAtInMillis: Joi.number().optional(),
			}).unknown(),
		}),
		async (req, res, next) => {
			try {
				await GatewayService.receiveSms(
					req.params.id,
					req.user.id,
					req.body
				);

				return res.status(200).json({ success: true });
			} catch (error) {
				next(error);
			}
		}
	);

	// SMS holatini yangilash
	route.patch(
		"/devices/:id/sms-status",
		isAuth,
		celebrate({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				smsId: Joi.number().required(),
				status: Joi.string()
					.valid("SENT", "DELIVERED", "FAILED", "DELIVERY_FAILED")
					.required(),
				errorMessage: Joi.string().allow(null, ""),
				errorCode: Joi.any().optional(),
			}).unknown(),
		}),
		async (req, res, next) => {
			try {
				const result = await GatewayService.updateSmsStatus(
					req.params.id,
					req.body
				);

				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		}
	);

	// Pending SMS larni olish (paginated)
	route.get(
		"/devices/:deviceId/pending-sms",
		isAuth,
		celebrate({
			params: Joi.object({
				deviceId: Joi.number().required(),
			}),
			query: Joi.object({
				page: Joi.number().integer().min(0).default(0),
				size: Joi.number().integer().min(1).max(50).default(10),
			}),
		}),
		async (req, res, next) => {
			try {
				const result = await GatewayService.getPendingSms(
					req.params.deviceId,
					req.user.id,
					parseInt(req.query.page),
					parseInt(req.query.size)
				);
				console.log(result.items.length);

				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		}
	);
};
