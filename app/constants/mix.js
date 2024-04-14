const NO_IMAGE_URL = "https://telegra.ph/file/ee79afc5d58364c4ff64f.jpg";
const NO_IMAGE_TGID =
	"AgACAgQAAxkDAAIf1mFQJS8LGtwO-q5WxMvVAAEtUE_7YgAC76wxG8mchFKKihtUjSYs5QEAAwIAA3MAAyEE";
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const ONE_MILLIMETER_IN_PIXEL = 3.7795275591;
const SmsProviderType = {
	play_mobile: 1,
	eskiz: 2,
	manual: 3,
};
const SmsStatusEnum = {
	draft: "draft",
	pending: "pending",
	done: "done",
	error: "error",
};
module.exports = {
	ESKIZ_WEBHOOK_ROUTE: "/eskiz",
	NO_IMAGE_URL,
	NO_IMAGE_TGID,
	ONE_DAY_IN_MS,
	ONE_MILLIMETER_IN_PIXEL,
	SmsProviderType,
	SmsStatusEnum,
};
