const { Router } = require("express");
const { ESKIZ_WEBHOOK_ROUTE } = require("../../constants/mix");
const UserStatus = require("../../constants/UserStatus");
const User = require("../../database/models/User");
const Sms = require("../../database/models/Sms");
const express = require("express");
const EskizStatuses = {
	DELIVERED: "DELIVERED",
	ACCEPTED: "ACCEPTED",
	STORED: "STORED",
	REJECTED: "REJECTED",
};

const EskizStatusMapWithSmsStatus = {
	DELIVERED: "done",
	REJECTED: "error",
};

module.exports = () => {
	const route = Router();

	route.post(
		ESKIZ_WEBHOOK_ROUTE,
		express.urlencoded({ extended: true }),
		async (req, res, next) => {
			try {
				/**
				 * @type {{
				 * callback_url: "https://example.com",
				 * country: "UZ",
				 * message_id: "48837643",
				 * phone_number: "998001234567",
				 * sms_count: "1",
				 * status: "DELIVERED",
				 * status_date: "2000-01-01 00:00:00",
				 * user_sms_id: "user_custom_id"
				 * }}
				 */
				const data = req.body;

				if (
					data.status === EskizStatuses.DELIVERED ||
					data.status === EskizStatuses.REJECTED
				) {
					const message_id = data.user_sms_id;

					if (!message_id) return;

					if (data.status === EskizStatuses.REJECTED) {
						await User.update(
							{
								blockingReason: `${data.phone_number} raqamiga sms yuborib bo'lmadi`,
								status: UserStatus.blocked,
							},
							{
								where: {
									phone: data.phone_number.slice(3),
								},
							}
						);
					}

					await Sms.update(
						{
							status: EskizStatusMapWithSmsStatus[data.status],
						},
						{
							where: {
								provider_message_id: message_id,
							},
						}
					);
				}

				res.send().status(200);
			} catch (e) {
				next(e);
			}
		}
	);

	return route;
};
