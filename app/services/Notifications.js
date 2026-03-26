const { default: axios } = require("axios");
const {
	TOKEN,
	MAIN_CHANNEL_CHAT_ID,
	DEV_ID,
	DONATION_CHANNEL_CHAT_ID,
} = require("../config");
const StatServices = require("./StatServices");
const { Rent, Stock } = require("../database/models");
const { Op } = require("sequelize");
const {
	getOneDayBackDate,
	getFirstAndLastDateOfMonth,
	getPreviousMonth,
	getDateMonthInUzbek,
} = require("../utils/date");

function getDonatePostLink() {
	return "https://t.me/kutubxona_hissadorlari/3";
}

function getTextNewUsers(count) {
	if (count) {
		return `🧑‍🚀 Yangi kitobxonlar soni: <b>${count}</b> ta`;
	}

	return "";
}

function getTextDonate() {
	return `👉 <a href="${getDonatePostLink()}">Kutubxonaga hissa qo‘shish</a>`;
}

function daylyStatTextDonationChannel(rents) {
	const returns = rents.filter((r) => r.returnedAt).length;

	return `<b>📊 Bugungi hisobot:</b>

✳️ O’qib qaytarilgan kitoblar: <b>${returns}</b> ta
📖 O’qish uchun olingan kitoblar: <b>${rents.length - returns}</b> ta`;
}

const Notifications = {
	sendMessageFromTelegramBot(chat_id, text, options = {}) {
		return axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
			chat_id: chat_id,
			text: text,
			parse_mode: "HTML",
			disable_web_page_preview: true,
			disable_notification: true,
			...options,
		});
	},
	mainChannel: {
		notifyWarningMessageAboutRentExpires() {
			return axios.post(
				`https://api.telegram.org/bot${TOKEN}/copyMessage`,
				{
					chat_id: MAIN_CHANNEL_CHAT_ID,
					message_id: 1078,
					from_chat_id: MAIN_CHANNEL_CHAT_ID,
				}
			);
		},
		happyFriday() {
			return axios.post(
				`https://api.telegram.org/bot${TOKEN}/copyMessage`,
				{
					chat_id: MAIN_CHANNEL_CHAT_ID,
					message_id: 1102,
					from_chat_id: MAIN_CHANNEL_CHAT_ID,
				}
			);
		},
		async sendStatsOfLastWeek() {
			return Notifications.mainChannel.sendMessageToMainTelegramChannel(
				await Notifications.mainChannel.lastWeekStatsMessage()
			);
		},
		sendMessageToMainTelegramChannel(text, options = {}) {
			return Notifications.sendMessageFromTelegramBot(
				MAIN_CHANNEL_CHAT_ID,
				text,
				options
			);
		},
		/**
		 *
		 * @param {string} header
		 * @param {Awaited<ReturnType<typeof StatServices.getStatByRange>>} stats
		 */
		generateStatsText(header, stats) {
			return `<b>${header}
${new Date(stats.from_date).toLocaleDateString("ru", { timeZone: "Asia/Tashkent" })} - ${new Date(
				stats.untill_date
			).toLocaleDateString("ru", { timeZone: "Asia/Tashkent" })}

📖 O'qish uchun olingan kitoblar soni: ${stats.rents_count}
🧑‍🚀 Yangi kitobxonlar: ${stats.new_users}

📚 Eng ko'p o'qish uchun olingan 10 kitob:
${stats.top_books
	.slice(0, 10)
	.map((book, i) => `${i + 1}. ${book.name} - ${book.count} ta`)
	.join("\n")}

Alhamdulillah!

👉 <a href="https://mehrkutubxonasi.uz/statistika">To'liq statistika</a>

Siz ham kutubxonaga hissa qo'shib ko‘pchilikning bepul ilm olishiga sababchi bo‘lishingiz mumkin

👉 <a href="https://t.me/mehr_kutubxonasi/129">Bepul kutubxona</a>
👉 <a href="https://t.me/kutubxona_hissadorlari/3">Kutubxonaga hissa qo‘shish</a>

✳️ Foydali deb topgan bo‘lsangiz, yaqinlaringizga ham ulashing\n@mehr_kutubxonasi</b>`;
		},
		/**
		 *
		 * @param {Awaited<ReturnType<typeof StatServices.getTopReaders>>} stats
		 * @param {Date} from
		 */
		generateTopReadersStat(stats, from) {
			console.log(stats);

			const icons = ["🥇", "🥈", "🥉"];
			return `<b>🏆 ${getDateMonthInUzbek(
				from
			)} oyida eng ko'p kitob oʻqib topshirgan 10 kitobxon

${stats
	.slice()
	.slice(0, 10)
	.map((user, i) => `${icons[i] || "📘"}${user.lastName} - ${user.count}`)
	.join("\n")}</b>

Familiya va topshirilgan kitoblar soni

<b>✳️ Eslatma</b>
Ro'yxatda boshqa odam uchun o'z nomiga kitob olgan kitobxonalar ham bo'lishi mumkin. Son muhim emas. Muhimi kitobdan manfaat olish!

Alhamdulillah!

✳️ Siz ham kutubxonaga hissa qo'shib ko‘pchilikning bepul ilm olishiga sababchi bo‘lishingiz mumkin

👉 <a href="https://t.me/mehr_kutubxonasi/129">Bepul kutubxona</a>
👉 <a href="https://t.me/kutubxona_hissadorlari/3">Kutubxonaga hissa qo‘shish</a>
👉 <a href="https://mehrkutubxonasi.uz/statistika">To'liq statistika</a>

<b>✳️ Foydali deb topgan bo‘lsangiz, yaqinlaringizga ham ulashing\n@mehr_kutubxonasi</b>
`;
		},

		async lastWeekStatsMessage() {
			const stats = await StatServices.lastWeekStats();
			return this.generateStatsText(
				`📊 Oxirgi haftada kutubxona natijalari`,
				stats
			);
		},

		async prevMonthStatsMessage() {
			const dateRangePrevMonth = getFirstAndLastDateOfMonth(
				getPreviousMonth()
			);

			const stats = await StatServices.getStatByRange({
				from: dateRangePrevMonth.first,
				untill: dateRangePrevMonth.last,
			});

			return this.generateStatsText("📊 O'tgan oy natijalari", stats);
		},

		async prevMonthTopReadersMessage() {
			const dateRangePrevMonth = getFirstAndLastDateOfMonth(
				getPreviousMonth()
			);

			const stats = await StatServices.getTopReaders({
				from: dateRangePrevMonth.first,
				untill: dateRangePrevMonth.last,
				locationId: 1,
			});

			return this.generateTopReadersStat(stats, dateRangePrevMonth.first);
		},

		async prevMonthStatsMessage() {
			const dateRangePrevMonth = getFirstAndLastDateOfMonth(
				getPreviousMonth()
			);

			const stats = await StatServices.getStatByRange({
				from: dateRangePrevMonth.first,
				untill: dateRangePrevMonth.last,
			});

			return this.generateStatsText("📊 O'tgan oy statistikasi", stats);
		},
	},
	superAdminNotifications: {
		async notifyFewBooks() {
			Notifications.sendMessageFromTelegramBot(
				DEV_ID,
				(await StatServices.getFewBooks({ locationId: 1 }))
					.map((result) => {
						return `${result.total}/${
							result.busies
						} - ${result.name.slice(0, 30)}`;
					})
					.join("\n")
					.slice(0, 4000)
			);
		},
	},
	donationChannel: {
		sendDonationDaylyStatsDonationChannel: async () => {
			try {
				const date = new Date();
				const hour = 20;

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
					},
				});

				if (!rents.length) return;

				const new_users_count = await StatServices.getNewUsersCount({
					locationId: 1,
					fromDate: getOneDayBackDate(),
				});

				const text = `${daylyStatTextDonationChannel(
					rents
				)}\n${getTextNewUsers(new_users_count)}\n\n${getTextDonate()}`;

				await Notifications.sendMessageFromTelegramBot(
					DONATION_CHANNEL_CHAT_ID,
					text
				);
			} catch (error) {
				console.error(error);
			}
		},
		sendLastWeekStats: async () => {
			try {
				await Notifications.sendMessageFromTelegramBot(
					DONATION_CHANNEL_CHAT_ID,
					await Notifications.mainChannel.lastWeekStatsMessage()
				);
			} catch (error) {
				console.error(error);
			}
		},

		sendPrevMonthStats: async () => {
			try {
				await Notifications.mainChannel.sendMessageToMainTelegramChannel(
					await Notifications.mainChannel.prevMonthStatsMessage()
				);

				await Notifications.sendMessageFromTelegramBot(
					DONATION_CHANNEL_CHAT_ID,
					await Notifications.mainChannel.prevMonthStatsMessage()
				);
			} catch (error) {
				console.error(error);
			}
		},

		sendPrevMonthTopReadersMessage: async () => {
			try {
				await Notifications.mainChannel.sendMessageToMainTelegramChannel(
					await Notifications.mainChannel.prevMonthTopReadersMessage()
				);
			} catch (error) {
				console.error(error);
			}
		},
	},
};

module.exports = Notifications;
