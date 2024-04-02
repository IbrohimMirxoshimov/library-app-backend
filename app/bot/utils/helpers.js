const texts = require("../../constants/texts");
const { Location } = require("../../database/models");
const UserApi = require("../fetch/UserApi");
const { searchMarkup } = require("./keyboards");

function mainSend(ctx) {
	if (ctx.callbackQuery && ctx.callbackQuery.message?.text) {
		return ctx.editMessageText(
			"Kerakli buyruqni tanlashingiz mumkin!",
			searchMarkup(ctx)
		);
	}

	return ctx.reply("Kerakli buyruqni tanlashingiz mumkin!", searchMarkup(ctx));
}

function getById(list, id) {
	return list.find((i) => i.id === id);
}

function sendHelp(ctx) {
	return ctx.replyWithHTML(texts.definition_search, searchMarkup(ctx));
}

async function getLocations() {
	return Location.findAll({
		raw: true,
	});
}

function getDeepLink(text) {
	let t = text.split(" ");

	if (t.length > 1) {
		return t[1];
	}

	return;
}
async function authUser(ctx) {
	ctx.session.user = (
		await UserApi.add({
			firstName: ctx.from.first_name?.slice(0, 100) || "tg",
			telegramId: "" + ctx.from.id,
			locationId: ctx.session.locationId || 1,
			tempLocationId: ctx.session.tempLocationId || 1,
		})
	).toJSON();

	ctx.session.authing = false;
}

function successFullRegistration(ctx) {
	return ctx.replyWithHTML(
		`Aziz kitobxonimiz ${makeBold(
			ctx.session.user.firstName + " " + ctx.session.user.lastName
		)}. 
Endi siz bizning kitobxon maqomidasiz🥳
Kutubxonaga borishingiz va kitob olishingiz mumkin. 

🆔 Sizning kitobxonalik raqamingiz: ${makeBold(ctx.session.user.id)}

✳️ <b>Profilim</b> tugmasi orqali o'qigan yoki o'qiyotgan kitoblaringiz ko'rish ham mumkin.
❗️${makeBold(
			"Muhim"
		)}. Kitob olgan paytingizda kutubxona asosiy kaniladigan chiqmasligingiz va shu botni bloklamasligingiz shart. Sizga muhim habarlar yuborilishi mumkin.`,
		searchMarkup(ctx)
	);
}

function makeBold(text) {
	return `<b>${text}</b>`;
}

function leaveSceneAndSendToMain(ctx) {
	ctx.scene.leave();
	return mainSend(ctx);
}

module.exports = {
	authUser: authUser,
	getDeepLink: getDeepLink,
	getLocations: getLocations,
	mainSend: mainSend,
	sendHelp: sendHelp,
	getById: getById,
	successFullRegistration: successFullRegistration,
	makeBold: makeBold,
	leaveSceneAndSendToMain: leaveSceneAndSendToMain,
};
