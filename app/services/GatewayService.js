const admin = require("firebase-admin");
const { Op } = require("sequelize");
const { Device, Sms, SmsBulk, sequelize } = require("../database/models");
const {
	SmsProviderType,
	SmsStatusEnum,
	GATEWAY_SMS_DAILY_LIMIT,
} = require("../constants/mix");
const RentServices = require("./RentServices");
const { SmsTemplates } = require("../helpers/SmsProviderApi");
const fs = require("fs").promises;
const path = require("path");

// Fayl bilan ishlash uchun utility'lar
const PENDING_RENTS_FILE = path.join(
	__dirname,
	"../../files/pending-expired-rents.json"
);

/**
 * Fayldan qolgan telefon raqamlarini o'qish.
 */
async function readPendingRents() {
	try {
		const data = await fs.readFile(PENDING_RENTS_FILE, "utf8");
		return JSON.parse(data);
	} catch (error) {
		return [];
	}
}

/**
 * Qolgan telefon raqamlarini faylga saqlash.
 */
async function writePendingRents(phoneNumbers) {
	try {
		await fs.writeFile(
			PENDING_RENTS_FILE,
			JSON.stringify(phoneNumbers, null, 2)
		);
	} catch (error) {
		console.error("Faylga yozishda xatolik:", error);
		throw error;
	}
}

let fcmInitialized = false;

/**
 * Firebase Admin SDK ni ishga tushirish.
 */
const initFCM = () => {
	if (fcmInitialized) return true;
	try {
		const serviceAccount = require("../../firebase-service-account.json");
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
		});
		fcmInitialized = true;
		return true;
	} catch (error) {
		console.error("Firebase admin ishga tushirishda xatolik:", error);
		return false;
	}
};

const GatewayService = {
	/*
	 * Qurilmani ro'yxatdan o'tkazish yoki mavjud bo'lsa yangilash.
	 * Bearer token (JWT) orqali kelgan userId asosida ishlaydi.
	 */
	async registerDevice(userId, dto) {
		// Foydalanuvchining buildId bo'yicha qurilmasini izlaymiz (agar buildId bo'lsa)
		let device;
		if (dto.fcmToken) {
			device = await Device.findOne({
				where: { userId, fcmToken: dto.fcmToken },
			});
		}

		if (device) {
			await device.update({
				brand: dto.brand,
				model: dto.model,
				fcmToken: dto.fcmToken,
				enabled: true,
			});
		} else {
			device = await Device.create({
				userId,
				brand: dto.brand,
				model: dto.model,
				buildId: dto.buildId,
				fcmToken: dto.fcmToken,
			});
		}

		return {
			_id: device.id,
			brand: device.brand,
			model: device.model,
			enabled: true,
		};
	},

	/**
	 * Qurilma ma'lumotlarini yangilash.
	 */
	async updateDevice(deviceId, userId, dto) {
		const device = await Device.findOne({
			where: { id: deviceId, userId },
		});
		if (!device) {
			throw new Error("Qurilma topilmadi yoki sizga tegishli emas");
		}

		await device.update(dto);
		return {
			_id: device.id,
			brand: device.brand,
			model: device.model,
			enabled: dto.enabled,
		};
	},

	/**
	 * Kelgan SMS ni bazaga saqlash.
	 */
	async receiveSms(
		deviceId,
		deviceUserId,
		{ sender, message, receivedAtInMillis }
	) {
		return await Sms.create({
			phone: sender.replace("+998", ""),
			text: message,
			receivedAt: receivedAtInMillis
				? new Date(receivedAtInMillis)
				: new Date(),
			deviceId: deviceId,
			userId: deviceUserId,
			status: SmsStatusEnum.delivered,
			provider: 4, // gateway
		});
	},

	/**
	 * SMS holatini yangilash.
	 */
	async updateSmsStatus(
		deviceId,
		{ smsId, status, errorMessage, errorCode }
	) {
		const sms = await Sms.findByPk(smsId);
		if (!sms) {
			throw new Error("SMS topilmadi");
		}

		// Bekkend statuslariga o'tkazish
		let newStatus = SmsStatusEnum.draft;
		if (status === "SENT") newStatus = SmsStatusEnum.sent;
		else if (status === "DELIVERED") newStatus = SmsStatusEnum.delivered;
		else if (status === "FAILED" || status === "DELIVERY_FAILED")
			newStatus = SmsStatusEnum.error;

		await sms.update({
			status: newStatus,
			error_reason:
				errorMessage || (errorCode ? `Xato kodi: ${errorCode}` : null),
			deviceId: deviceId,
		});

		return { success: true };
	},

	/**
	 * Push xabarni telefonga yuborish.
	 */
	async pushSendSms(smsId) {
		if (!initFCM()) return false;

		const sms = await Sms.findByPk(smsId);
		if (!sms) return false;

		let device = await Device.findOne({
			where: { userId: sms.userId, enabled: true },
			order: [["updatedAt", "DESC"]],
		});

		if (!device || !device.fcmToken) return false;

		const message = {
			data: {
				smsData: JSON.stringify({
					smsId: sms.id.toString(),
					recipients: ["+998" + sms.phone],
					message: sms.text,
				}),
			},
			android: {
				priority: "high",
				ttl: 3600 * 1000 * 2, // 2 soat
			},
			token: device.fcmToken,
		};

		try {
			await admin.messaging().send(message);
			await sms.update({ deviceId: device.id });
			return true;
		} catch (error) {
			console.error("Push yuborishda xato:", error);
			return false;
		}
	},

	/**
	 * Pending SMS mavjudligi haqida bitta push yuborish.
	 * Android app bu pushni qabul qilganda o'zi pending SMS larni oladi.
	 */
	async pushPendingSmsNotification(userId) {
		if (!initFCM()) return false;

		const device = await Device.findOne({
			where: { userId, enabled: true },
			order: [["updatedAt", "DESC"]],
		});

		if (!device || !device.fcmToken) return false;

		const message = {
			data: {
				type: "PENDING_SMS_AVAILABLE",
			},
			token: device.fcmToken,
			android: {
				priority: "high",
				ttl: 3600 * 1000 * 2, // 2 soat
			},
		};

		try {
			await admin.messaging().send(message);
			console.log(
				`PENDING_SMS_AVAILABLE push yuborildi userId: ${userId}`
			);
			return true;
		} catch (error) {
			console.error("Pending SMS push yuborishda xato:", error);
			return false;
		}
	},

	/**
	 * Pending SMS larni paginated olish.
	 * Android app bu API orqali draft SMS larni oladi va birma-bir yuboradi.
	 * Agar draft SMS yo'q bo'lsa, 1 soatdan ko'proq vaqt o'tgan pending SMS larni qaytaradi.
	 */
	async getPendingSms(deviceId, userId = 190, page = 1, size = 10) {
		const offset = (page - 1) * size;

		// Avval draft SMS larni qidiramiz
		const { rows } = await Sms.findAndCountAll({
			where: {
				userId,
				status: SmsStatusEnum.draft,
				provider: SmsProviderType.gateway,
				createdAt: {
					[Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
				},
			},
			order: [["updatedAt", "ASC"]],
			limit: size,
			offset,
		});

		// const uniquePhones = [...new Set(rows.map((s) => s.phone))];

		// 3. Shu raqamlar bo'yicha overdue rentlarni tekshiramiz
		// const overdueUsersWithRent = await sequelize.query(
		// 	`SELECT DISTINCT u.phone
		// 	FROM users u
		// 	INNER JOIN rents r ON u.id = r."userId"
		// 	WHERE u.phone IN (:phones)
		// 	  AND r."returnedAt" IS NULL
		// 	  AND r."returningDate" < NOW()
		// 	  AND r."deletedAt" IS NULL
		// 	  AND u."deletedAt" IS NULL
		// 	`,
		// 	{
		// 		replacements: { phones: uniquePhones },
		// 		type: sequelize.QueryTypes.SELECT,
		// 	}
		// );

		// const validPhones = overdueUsersWithRent.map((u) => u.phone);

		// 4. Faqat overdue renti bor SMS larni ajratamiz
		const filteredDraftSms = rows;
		// .filter((sms) =>
		// 	validPhones.includes(sms.phone)
		// );

		// SMS larni deviceId bilan yangilaymiz
		const smsIds = filteredDraftSms.map((sms) => sms.id);

		if (smsIds.length > 0) {
			await Sms.update(
				{ deviceId, status: SmsStatusEnum.pending },
				{ where: { id: smsIds } }
			);
		}

		return {
			items: filteredDraftSms.map((sms) => ({
				id: sms.id.toString(),
				phone: "+998" + sms.phone,
				text: sms.text,
			})),
			page,
			size,
		};
	},

	/**
	 * Kunlik cron logic - muddati o'tgan ijara uchun SMS yaratish.
	 */
	async createSmsForExpiredRents() {
		try {
			const locationId = 1;
			const { rows } = await RentServices.report(locationId);

			const newRentsByPhone = {};
			rows.forEach((rent) => {
				newRentsByPhone[rent.user.phone] = rent;
			});

			const pendingPhones = await readPendingRents();
			const validPendingPhones = pendingPhones.filter((phone) =>
				newRentsByPhone.hasOwnProperty(phone)
			);

			let todayPhones = [];
			let remainingPhones = [];

			if (validPendingPhones.length >= GATEWAY_SMS_DAILY_LIMIT) {
				todayPhones = validPendingPhones.slice(
					0,
					GATEWAY_SMS_DAILY_LIMIT
				);
				remainingPhones = validPendingPhones.slice(
					GATEWAY_SMS_DAILY_LIMIT
				);
			} else {
				todayPhones = [...validPendingPhones];
				const needed = GATEWAY_SMS_DAILY_LIMIT - todayPhones.length;
				const newPhones = Object.keys(newRentsByPhone).filter(
					(phone) => !validPendingPhones.includes(phone)
				);
				todayPhones = [...todayPhones, ...newPhones.slice(0, needed)];
				remainingPhones = newPhones.slice(needed);
			}

			await writePendingRents(remainingPhones);

			if (todayPhones.length === 0) return { totalCount: 0 };

			const mainLibrarianId = 190;
			const smsbulk = await SmsBulk.create({
				text: "Avto yasalgan",
				userId: mainLibrarianId,
			});

			const messages = todayPhones.map((phone) => {
				const rent = newRentsByPhone[phone];
				return {
					phone: phone,
					userId: mainLibrarianId,
					text: SmsTemplates.rentExpiredWithCustomLinkNew.getText({
						fullName: `${rent.user.firstName} ${rent.user.lastName}`,
						url_param: rent.user.phone,
						shortFullName: `${rent.user.lastName} ${rent.user.firstName[0]}`,
					}),
					smsbulkId: smsbulk.id,
					status: SmsStatusEnum.draft,
					provider: SmsProviderType.gateway,
				};
			});

			await Sms.bulkCreate(messages);

			setTimeout(() => {
				// Bitta push yuborish - Android app o'zi pending SMS larni oladi
				this.pushPendingSmsNotification(mainLibrarianId);
			}, 5000);

			return {
				totalCount: todayPhones.length,
				pendingCount: remainingPhones.length,
			};
		} catch (error) {
			console.error("Cron xatolik:", error);
			throw error;
		}
	},
};

// GatewayService.getPendingSms(8, 190);
// GatewayService.pushPendingSmsNotification(190);

async function sendTestPushMessage() {
	initFCM();

	const device = await Device.findOne({
		where: { userId: 190, enabled: true },
		order: [["updatedAt", "DESC"]],
	});

	if (!device || !device.fcmToken) return false;

	await admin.messaging().send({
		data: {
			smsData: JSON.stringify({
				smsId: "12",
				recipients: ["998843566"],
				message: "Hello",
			}),
		},
		android: {
			priority: "high",
			ttl: 3600 * 1000, // 1 soat
		},
		token: device.fcmToken,
	});
}

module.exports = GatewayService;
