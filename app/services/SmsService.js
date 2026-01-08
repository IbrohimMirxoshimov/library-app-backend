const { Sms } = require("../database/models");
const { SmsStatusEnum, SmsProviderType } = require("../constants/mix");
const GatewayService = require("./GatewayService");

const SmsService = {
	/**
	 * Bitta foydalanuvchiga bitta SMS yuborish (Gateway orqali).
	 */
	async sendSingleSms(userId, locationId, { phone, text }) {
		// SMS ni bazada yaratish
		const sms = await Sms.create({
			phone: phone.replace("+998", ""),
			text,
			userId,
			locationId,
			status: SmsStatusEnum.draft,
			provider: SmsProviderType.gateway,
		});

		// Gateway-ga push yuborish
		const sent = await GatewayService.pushSendSms(sms.id);

		if (!sent) {
			return {
				success: false,
				message: "Qurilmaga push yuborishda xatolik yuz berdi",
				smsId: sms.id,
			};
		}

		return {
			success: true,
			smsId: sms.id,
		};
	},
};

module.exports = SmsService;
