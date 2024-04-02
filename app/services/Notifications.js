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
const { getOneDayBackDate } = require("../utils/date");

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
			return axios.post(`https://api.telegram.org/bot${TOKEN}/copyMessage`, {
				chat_id: MAIN_CHANNEL_CHAT_ID,
				message_id: 1078,
				from_chat_id: MAIN_CHANNEL_CHAT_ID,
			});
		},
		happyFriday() {
			return axios.post(`https://api.telegram.org/bot${TOKEN}/copyMessage`, {
				chat_id: MAIN_CHANNEL_CHAT_ID,
				message_id: 1102,
				from_chat_id: MAIN_CHANNEL_CHAT_ID,
			});
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
		getLastDateStatsText({
			new_users,
			top_books,
			rents_count,
			range_name,
			from_date,
			untill_date,
		}) {
			return `<b>📊 Oxirgi ${range_name}da kutubxona natijalari
${new Date(from_date).toLocaleDateString("ru")} - ${new Date(
				untill_date
			).toLocaleDateString("ru")}

📖 O'qish uchun olingan kitoblar soni: ${rents_count}
🧑‍🚀 Yangi kitobxonlar: ${new_users}

📚 Eng ko'p o'qish uchun olingan 10 kitob:
${top_books
	.slice(0, 10)
	.map((book, i) => `${i + 1}. ${book.name} - ${book.count} ta`)
	.join("\n")}

Alhamdulillah!

👉 <a href="https://mehrkutubxonasi.uz/statistika">To'liq statistika</a>

Siz ham kutubxonaga hissa qo'shib ko‘pchilikning bepul ilm olishiga sababchi bo‘lishingiz mumkin

👉 <a href="https://t.me/mehr_kutubxonasi/129">Bepul kutubxona</a>
👉 <a href="https://t.me/kutubxona_hissadorlari/3">Kutubxonaga hissa qo‘shish</a>

Foydali deb topgan bo‘lsangiz, yaqinlaringizga ham ulashing\n@mehr_kutubxonasi</b>`;
		},
		async lastWeekStatsMessage() {
			const stats = await StatServices.lastWeekStats();
			return this.getLastDateStatsText(stats);
		},
	},
	superAdminNotifications: {
		async notifyFewBooks() {
			Notifications.sendMessageFromTelegramBot(
				DEV_ID,
				(await StatServices.getFewBooks({ locationId: 1 }))
					.map((result) => {
						return `${result.total}/${result.busies} - ${result.name.slice(
							0,
							30
						)}`;
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
					},
				});

				if (!rents.length) return;

				const new_users_count = await StatServices.getNewUsersCount({
					locationId: 1,
					fromDate: getOneDayBackDate(),
				});

				const text = `${daylyStatTextDonationChannel(rents)}\n${getTextNewUsers(
					new_users_count
				)}\n\n${getTextDonate()}`;

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
	},
};

module.exports = Notifications;
