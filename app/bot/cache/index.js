const { Location, Region, Address } = require("../../database/models");
const { getById } = require("../utils/helpers");
const { MAIN_LOCATION_ID } = require("../../constants/mix");

const map = new Map();

const cacheKeys = {
	locations: "locations",
};

const cache = {
	set: map.set,
	get: map.get,
	setLocations: (locations) => map.set(cacheKeys.locations, locations),
	getLocations: () => map.get(cacheKeys.locations),
};

function getLocation(id) {
	return getById(cache.getLocations(), id);
}

function getUserLocationId(user) {
	return user?.tempLocationId || user?.locationId || MAIN_LOCATION_ID;
}

// inactive locations are not cached, fall back to the main one
function getUserLocation(user) {
	return (
		getLocation(getUserLocationId(user)) || getLocation(MAIN_LOCATION_ID)
	);
}

async function updateLocations() {
	let ls = await Location.findAll({
		raw: true,
		include: [
			{
				model: Region,
				as: "region",
				attributes: ["name"],
			},
			{
				model: Address,
				attributes: ["addressLine", "latitude", "longitude"],
			},
		],
		where: {
			active: true,
		},
		order: [["id", "ASC"]],
		nest: true,
	});

	// console.log(ls);

	cache.setLocations(ls);

	return true;
}

module.exports = {
	updateLocations: updateLocations,
	cache: cache,
	cacheKeys: cacheKeys,
	getLocation: getLocation,
	getUserLocationId: getUserLocationId,
	getUserLocation: getUserLocation,
};
