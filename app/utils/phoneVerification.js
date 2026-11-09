const { PHONE_VERIFICATION_VALID_MONTHS } = require("../constants/mix");

const PhoneVerificationReason = {
	not_verified: "not_verified",
	expired: "expired",
};

/**
 * Asosiy raqam tasdiqlanganligi va 3 oydan eskirmaganligi
 * @param {{ phoneVerified?: Date | string | null }} user
 * @returns {{ verified: boolean, reason?: string }}
 */
function getPhoneVerificationStatus(user, now = new Date()) {
	if (!user.phoneVerified) {
		return {
			verified: false,
			reason: PhoneVerificationReason.not_verified,
		};
	}

	const validUntil = new Date(user.phoneVerified);
	validUntil.setMonth(validUntil.getMonth() + PHONE_VERIFICATION_VALID_MONTHS);

	if (validUntil < now) {
		return { verified: false, reason: PhoneVerificationReason.expired };
	}

	return { verified: true };
}

module.exports = { getPhoneVerificationStatus, PhoneVerificationReason };
