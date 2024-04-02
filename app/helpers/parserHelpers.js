function checkHeader(headerIncoming, headerSettings) {
	return !headerSettings.filter((h, i) => h !== headerIncoming[i]).length;
}

function setObject(object, value) {
	object[value] = value;
}

function getObjectId(list, name) {
	return getObject(list, name).id;
}

function getObject(list, name) {
	return list.find((p) => p.name === name);
}

function makeArrayWithId(object) {
	return Object.values(object).map((name, i) => ({ id: i + 1, name }));
}

module.exports = {
	checkHeader: checkHeader,
	setObject: setObject,
	getObjectId: getObjectId,
	getObject: getObject,
	makeArrayWithId: makeArrayWithId,
};
