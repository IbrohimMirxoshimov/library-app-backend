const { Location, Region } = require("../../database/models");
const { getById } = require("../utils/helpers");

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

async function updateLocations() {
	let ls = await Location.findAll({
		raw: true,
		include: {
			model: Region,
			as: "region",
			attributes: ["name"],
		},
		where: {
			active: true,
		},
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
};
