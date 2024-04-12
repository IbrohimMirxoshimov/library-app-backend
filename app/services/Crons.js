const { Op } = require("sequelize");
const { Stock, Book, Rent, Sms, SmsBulk, User } = require("../database/models");
const { MAIN_GROUP_CHAT_ID, MAIN_BOT_USERNAME } = require("../config");
const Notifications = require("./Notifications");
const StatServices = require("./StatServices");
const RentServices = require("./RentServices");
const { sendSmsViaEskiz, SmsTemplates } = require("../helpers/SmsProviderApi");
const { SmsProviderType } = require("../constants/mix");
const UserStatus = require("../constants/UserStatus");
const CronJob = require("cron").CronJob;

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
		`<b>Jami:\n✳️ ${returns} ta\n📖 ${rents.length - returns} ta\n\n***</b>\n`
	);

	return rows.join("\n");
}

const Crons = {
	groupNotifications: {
		send(text) {
			return Notifications.sendMessageFromTelegramBot(MAIN_GROUP_CHAT_ID, text);
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
									[Op.between]: [new Date(date - 1000 * 60 * 60 * hour), date],
								},
							},
							{
								createdAt: {
									[Op.between]: [new Date(date - 1000 * 60 * 60 * hour), date],
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
						include: { as: "book", model: Book, attributes: ["name"] },
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
					Notifications.mainChannel.sendStatsOfLastWeek().catch((err) => {
						console.error(err);
					});
				},
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
	async rentExpiresBulkSms() {
		try {
			const locationId = 1;
			const { rows } = await RentServices.report(locationId);

			const rents_uniq_by_phone = Object.values(
				rows.reduce((pv, cv) => ({ ...pv, [cv.user.phone]: cv }), {})
			);

			if (rents_uniq_by_phone.length === 0) return;
			console.log(rents_uniq_by_phone.length);
			return;

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
				text: SmsTemplates.rentExpiredWithCustomLink.getText(
					"Ahmedev Ahmad",
					"000000000"
				),
				userId: librarian.id,
			});

			for (const rent of rents_uniq_by_phone) {
				const text = SmsTemplates.rentExpiredWithCustomLink.getText(
					`${rent.user.firstName} ${rent.user.lastName}`,
					rent.user.phone
				);

				const res = await sendSmsViaEskiz({
					phone_number: `998${rent.user.phone}`,
					text: text,
				}).catch((e) => {
					console.error(e, rent.user.phone, text);
				});

				await Sms.create({
					phone: rent.user.phone,
					userId: librarian.id,
					text,
					provider: SmsProviderType.eskiz,
					provider_message_id: res.message_id,
					smsbulkId: smsbulk.id,
					status: res ? "pending" : "error",
				});
			}
		} catch (error) {
			console.error("rentExpiresBulkSms error");
			console.error(error);
		}

		// webhhok dan status kelsa statusni o'zgartirish
		// api/app/expired-rents-by-phone route yasash
	},
	rentExpiresBulkSmsCron() {
		// for test
		Crons.rentExpiresBulkSms();
		const job = new CronJob(
			// At 06:00 on Monday, Wednesday, and Saturday
			"0 6 * * 1,3,6",
			this.rentExpiresBulkSms,
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
		this.mainChannelNotifications.warningAboutRentExpires();
		this.mainChannelNotifications.lastWeekStats();
		this.rentExpiresBulkSmsCron();
		this.superAdminNotifications();
		StatServices.setCachingStatsCron();
	},
};

module.exports = Crons;
