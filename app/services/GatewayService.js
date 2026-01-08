const admin = require("firebase-admin");
const { Device, Sms, SmsBulk } = require("../database/models");
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
					recipients: [sms.phone],
					message: sms.text,
				}),
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

			const createdSms = await Sms.bulkCreate(messages);

			const sendPush = async () => {
				for (const sms of createdSms) {
					await this.pushSendSms(sms.id);

					const jitter = Math.floor(Math.random() * 8000);

					await new Promise((resolve) =>
						setTimeout(resolve, 5000 + jitter)
					);
				}
			};

			sendPush();

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

module.exports = GatewayService;
