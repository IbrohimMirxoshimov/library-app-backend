const { Markup } = require("telegraf");
const texts = require("../../constants/texts");
const { MAIN_LOCATION_ID } = require("../../constants/mix");
const { getUserLocation } = require("../cache");
const { escapeHtml } = require("../utils/helpers");
const { searchButton, backButton } = require("../utils/keyboards");

function getRentInfoText(location) {
	const { rent_info } = texts;
	const lines = [
		rent_info.title,
		`🏛 <b>${escapeHtml(`${location.name} - ${location.region.name}`)}</b>`,
		rent_info.body,
	];

	const { addressLine, latitude, longitude } = location.address || {};
	if (addressLine) {
		const map =
			latitude && longitude
				? ` (<a href="https://maps.google.com/?q=${latitude},${longitude}">xarita</a>)`
				: "";
		lines.push(rent_info.address + escapeHtml(addressLine) + map);
	}
	if (location.link)
		lines.push(rent_info.contact + escapeHtml(location.link));

	lines.push(rent_info.notes);

	return lines.join("\n\n");
}

function sendGettingRentInfo(ctx) {
	const reply_markup = Markup.inlineKeyboard([
		[searchButton(ctx)],
		[backButton()],
	]).reply_markup;
	const location = getUserLocation(ctx.session?.user);

	if (ctx.callbackQuery) ctx.answerCbQuery().catch(() => {});

	// the main library keeps its detailed post in the channel
	if (location.id === MAIN_LOCATION_ID) {
		return ctx.telegram.copyMessage(ctx.from.id, "-1001437994129", 2, {
			reply_markup,
		});
	}

	return ctx.telegram.sendMessage(ctx.from.id, getRentInfoText(location), {
		parse_mode: "HTML",
		reply_markup,
		link_preview_options: { is_disabled: true },
	});
}

module.exports = {
	sendGettingRentInfo,
};
