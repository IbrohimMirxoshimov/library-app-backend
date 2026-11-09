const { Op } = require("sequelize");
const { UserLocation, Location } = require("../database/models");
const UserStatus = require("../constants/UserStatus");

// kitobxonning kutubxonaga bog'liq maydonlari (user_locations da saqlanadi)
const LIBRARY_FIELDS = ["status", "blockingReason", "balance", "extra", "verified"];

const DEFAULTS = {
	status: UserStatus.active,
	blockingReason: null,
	balance: 0,
	extra: null,
	verified: false,
};

function isStaff(user) {
	return Boolean(user && (user.librarian || user.owner || user.moderator));
}

// body dan kutubxona maydonlarini ajratib oladi (body dan o'chiriladi)
function takeLibraryFields(body) {
	const fields = {};
	for (const key of LIBRARY_FIELDS) {
		if (body[key] !== undefined) fields[key] = body[key];
		delete body[key];
	}
	if (fields.balance !== undefined)
		fields.balance = parseInt(fields.balance) || 0;
	if (fields.status !== undefined)
		fields.status =
			parseInt(fields.status) === UserStatus.blocked
				? UserStatus.blocked
				: UserStatus.active;
	if (fields.verified !== undefined) fields.verified = Boolean(fields.verified);
	return fields;
}

function getLink(userId, locationId, options = {}) {
	return UserLocation.findOne({ where: { userId, locationId }, ...options });
}

async function setLibraryFields(userId, locationId, fields, options = {}) {
	if (!locationId || !Object.keys(fields).length) return;

	const [link] = await UserLocation.findOrCreate({
		where: { userId, locationId },
		transaction: options.transaction,
	});
	await link.update(fields, { transaction: options.transaction });
	return link;
}

// kitobxonlar (plain obyektlar) ga berilgan kutubxonadagi qiymatlarni qo'yadi.
// libraryId bo'lmasa (owner) har birining asosiy kutubxonasi olinadi.
// otherLibraryBlocks - boshqa kutubxonalardagi bloklar (ogohlantirish uchun)
async function applyLibraryFields(users, libraryId) {
	const readers = users.filter((u) => u && !isStaff(u));
	if (!readers.length) return users;

	const links = await UserLocation.findAll({
		where: { userId: { [Op.in]: readers.map((u) => u.id) } },
		raw: true,
	});

	const blockedLocationIds = [
		...new Set(
			links
				.filter((l) => l.status === UserStatus.blocked)
				.map((l) => l.locationId)
		),
	];
	const locations = blockedLocationIds.length
		? await Location.findAll({
				where: { id: blockedLocationIds },
				attributes: ["id", "name"],
				raw: true,
		  })
		: [];
	const locationName = Object.fromEntries(locations.map((l) => [l.id, l.name]));

	for (const user of readers) {
		const current = libraryId || user.locationId;
		const userLinks = links.filter((l) => l.userId === user.id);
		const link = userLinks.find((l) => l.locationId === current);

		for (const key of LIBRARY_FIELDS) {
			user[key] = link ? link[key] : DEFAULTS[key];
		}

		user.otherLibraryBlocks = userLinks
			.filter(
				(l) => l.locationId !== current && l.status === UserStatus.blocked
			)
			.map((l) => ({
				locationId: l.locationId,
				name: locationName[l.locationId] || String(l.locationId),
				blockingReason: l.blockingReason,
			}));
	}

	return users;
}

module.exports = {
	LIBRARY_FIELDS,
	DEFAULTS,
	isStaff,
	takeLibraryFields,
	getLink,
	setLibraryFields,
	applyLibraryFields,
};
