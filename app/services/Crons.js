const { Op } = require("sequelize");
const { Stock, Book, Rent, Sms, SmsBulk, User } = require("../database/models");
const { MAIN_GROUP_CHAT_ID, MAIN_BOT_USERNAME } = require("../config");
const Notifications = require("./Notifications");
const StatServices = require("./StatServices");
const RentServices = require("./RentServices");
const {
	SmsTemplates,
	sendBatchSmsViaEskiz,
} = require("../helpers/SmsProviderApi");
const { SmsProviderType } = require("../constants/mix");
const UserStatus = require("../constants/UserStatus");
const { toMatrix } = require("../utils/array");
const GatewayService = require("./GatewayService");
const CronJob = require("cron").CronJob;
const fs = require("fs").promises;
const path = require("path");

// Fayl bilan ishlash uchun utility funksiyalar SmsGatewayService ga ko'chirildi

function getStatusEmoji(rent) {
	if (rent.returnedAt) {
		return "✳️";
	}

	return "📖";
}

function getTime(rent) {
	return rent.updatedAt.toTimeString().slice(0, 5);
}

function getBookName(rent) {
	if (!rent.stock.book) {
		console.log(rent);
	}
	return rent.stock.book.name;
}

function makeContent(rents) {
	let rows = [];
	let text_length = 0;
	const returns = rents.filter((r) => r.returnedAt).length;

	for (let i = 0; i < rents.length; i++) {
		const rent = rents[i];

		if (text_length > 3800) {
			rows.push(`Yana ${rents.length - i} kitoblar olingan/berilgan`);
			break;
		}

		let text = `${getStatusEmoji(rent)} ${getTime(rent)} – <b>${getBookName(
			rent
		)}</b>`;

		text_length += text.length;

		rows.push(text);
	}

	rows.unshift(
		`<b>Jami:\n✳️ ${returns} ta\n📖 ${
			rents.length - returns
		} ta\n\n***</b>\n`
	);

	return rows.join("\n");
}

const Crons = {
	groupNotifications: {
		send(text) {
			return Notifications.sendMessageFromTelegramBot(
				MAIN_GROUP_CHAT_ID,
				text
			);
		},
		makeText(rents, hour) {
			const preHeader =
				hour > 9
					? `Bugun olingan va berilgan kitoblar`
					: `Olingan va berilgan kitoblar\nOxirgi ${hour} soat ichida`;
			const header = `<b>${preHeader}</b>\n<b>✳️ -> Kitob o’qib qaytarildi\n📖 -> Kitob o’qish uchun topshirildi\n\n***\n\n</b>`;
			const footer = `\n\n<b>Kitoblar ro’yxatini quyidagi bot orqali ko’rish mumkin\n👉 ${MAIN_BOT_USERNAME}\nSayt: mehrkutubxonasi.uz</b>`;

			const content = makeContent(rents);

			return header + content + footer;
		},
		async job(hour = 1) {
			try {
				const date = new Date();

				const rents = await Rent.findAll({
					where: {
						[Op.or]: [
							{
								returnedAt: {
									[Op.between]: [
										new Date(date - 1000 * 60 * 60 * hour),
										date,
									],
								},
							},
							{
								createdAt: {
									[Op.between]: [
										new Date(date - 1000 * 60 * 60 * hour),
										date,
									],
								},
							},
						],
						deletedAt: {
							[Op.is]: null,
						},
					},
					include: {
						model: Stock,
						as: "stock",
						attributes: ["id", "locationId"],
						where: { locationId: 1 },
						paranoid: false,
						include: {
							as: "book",
							model: Book,
							attributes: ["name"],
						},
					},
					order: [["updatedAt", "ASC"]],
				});

				if (!rents.length) return;

				await this.send(this.makeText(rents, hour));
			} catch (error) {
				console.error(error);
			}
		},
		startSendingRentLeaseAndReturnInfoEveryHourCron() {
			const job = new CronJob(
				"0 0 10-18 * * *",
				() => this.job(1),
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
		startSendingRentLeaseAndReturnInfoEveryDaylyCron() {
			const job = new CronJob(
				"0 0 19 * * *",
				() => this.job(13),
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
	},
	donationChannel: {
		sendDonationDaylyStatsDonationChannelCron() {
			const job = new CronJob(
				"0 0 19 * * *",
				Notifications.donationChannel.sendDonationDaylyStatsDonationChannel,
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
		sendLastWeekStatsCron() {
			const job = new CronJob(
				"0 9 * * 5",
				Notifications.donationChannel.sendLastWeekStats,
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
	},
	mainChannelNotifications: {
		warningAboutRentExpires() {
			// every Sunday on 8:00
			const job = new CronJob(
				"0 8 * * 0",
				() => {
					Notifications.mainChannel
						.notifyWarningMessageAboutRentExpires()
						.catch((err) => {});
				},
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
		lastWeekStats() {
			// every Friday on 10:00
			const job = new CronJob(
				"0 10 * * 5",
				() => {
					Notifications.mainChannel
						.sendStatsOfLastWeek()
						.catch((err) => {
							console.error(err);
						});
				},
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
		sendPrevMonthStats() {
			// every month 1 on 10:05
			const job = new CronJob(
				"5 10 1 * *",
				Notifications.donationChannel.sendPrevMonthStats,
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
		sendPrevMonthTopReaders() {
			// every month 1 on 10:05
			const job = new CronJob(
				"5 13 1 * *",
				Notifications.donationChannel.sendPrevMonthTopReadersMessage,
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
		happyFridayCron() {
			// every Friday on 8:00
			const job = new CronJob(
				"0 0 8 * * 5",
				() => {
					Notifications.mainChannel.happyFriday().catch((err) => {});
				},
				null,
				true,
				"Asia/Tashkent"
			);
			job.start();
		},
	},
	async superAdminNotifications() {
		const job = new CronJob(
			"0 0 20 * * *",
			() =>
				Notifications.superAdminNotifications
					.notifyFewBooks()
					.catch((e) => console.error(e)),
			null,
			true,
			"Asia/Tashkent"
		);
		return job.start();
	},
	async rentExpiresBulkSms(phonesToSkip) {
		try {
			const locationId = 1;
			const { rows } = await RentServices.report(locationId);

			const rents_phone_map = rows.reduce(
				(pv, cv) => ({ ...pv, [cv.user.phone]: cv }),
				{}
			);

			if (phonesToSkip) {
				phonesToSkip.forEach((phone) => {
					delete rents_phone_map[phone];
				});
			}

			const rents_uniq_by_phone = Object.values(rents_phone_map);

			if (rents_uniq_by_phone.length === 0) return;

			const [librarian] = await User.findAll({
				where: {
					librarian: true,
					libraryId: locationId,
					status: UserStatus.active,
				},
				order: [["id", "ASC"]],
				raw: true,
			});

			const smsbulk = await SmsBulk.create({
				attributes: ["id"],
				text: SmsTemplates.rentExpiredWithCustomLink.getText({
					fullName: "Ism",
					url_param: "Raqam",
				}),
				userId: librarian.id,
			});

			await sendBatchSmsViaEskiz({
				messages: rents_uniq_by_phone.map((rent) => {
					const text =
						SmsTemplates.rentExpiredWithCustomLinkNew.getText({
							fullName: `${rent.user.firstName} ${rent.user.lastName}`,
							url_param: rent.user.phone,
							shortFullName: `${rent.user.lastName} ${rent.user.firstName[0]}`,
						});

					return {
						phone_number: `998${rent.user.phone}`,
						text: text,
					};
				}),
			})
				.then(async (messages) => {
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
								status: message.error_reason
									? "error"
									: "pending",
							};
						})
					);
				})
				.catch(async (error) => {
					console.error(error);
					await Sms.create({
						phone: "ERROR",
						userId: librarian.id,
						smsbulkId: smsbulk.id,
						error_reason: error.message,
						status: "error",
					});
				});

			return {
				totalCount: rents_uniq_by_phone.length,
			};
		} catch (error) {
			console.error("rentExpiresBulkSms error");
			console.error(error);
		}

		// webhhok dan status kelsa statusni o'zgartirish
		// api/app/expired-rents-by-phone route yasash
	},
	rentExpiresBulkSmsCron() {
		// for test
		// Crons.rentExpiresBulkSms();
		const job = new CronJob(
			// At 06:00 on Thursday and Sunday
			"0 6 * * 4,0",
			this.rentExpiresBulkSms,
			null,
			true,
			"Asia/Tashkent"
		);
		job.start();
	},
	createSmsForExpiredRentsCron() {
		const job = new CronJob(
			// At 09:00 every day
			"0 9 * * *",
			() => {
				GatewayService.createSmsForExpiredRents();
			},
			null,
			true,
			"Asia/Tashkent"
		);
		job.start();
	},
	pushPendingSmsNotificationCron() {
		const job = new CronJob(
			// At minute 5 past every hour from 9 through 22
			"5 9-22 * * *",
			() => {
				GatewayService.pushPendingSmsNotification();
			},
			null,
			true,
			"Asia/Tashkent"
		);
		job.start();
	},
	loadCrons() {
		this.groupNotifications.startSendingRentLeaseAndReturnInfoEveryDaylyCron();
		this.groupNotifications.startSendingRentLeaseAndReturnInfoEveryHourCron();
		this.donationChannel.sendDonationDaylyStatsDonationChannelCron();
		this.donationChannel.sendLastWeekStatsCron();
		this.mainChannelNotifications.sendPrevMonthStats();
		this.mainChannelNotifications.sendPrevMonthTopReaders();
		this.mainChannelNotifications.warningAboutRentExpires();
		this.mainChannelNotifications.lastWeekStats();
		// this.rentExpiresBulkSmsCron();
		this.createSmsForExpiredRentsCron();
		this.superAdminNotifications();
		this.pushPendingSmsNotificationCron();
	},
};

module.exports = Crons;
