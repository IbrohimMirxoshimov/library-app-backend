const toMatrix = (arr, width = 2) =>
	arr.reduce(
		(rows, key, index) =>
			(index % width == 0
				? rows.push([key])
				: rows[rows.length - 1].push(key)) && rows,
		[]
	);

function groupBy(list, keyGetter) {
	const map = new Map();
	list.forEach((item) => {
		const key = keyGetter(item);
		const collection = map.get(key);
		if (!collection) {
			map.set(key, [item]);
		} else {
			collection.push(item);
		}
	});
	return map;
}

const LENGTH_SHOWING_DAYS = 17;

function getAviableDays() {
	const date = new Date();

	// before 5 hours can order room
	date.setHours(date.getHours() + 5);
	const todayIsAviable = new Date().getDate() === date.getDate();
	const days = [];

	for (let i = 0; i < LENGTH_SHOWING_DAYS; i++) {
		let monthDay = date.getDate();
		let dayStr = addZero(monthDay);
		let monthStr = addZero(date.getMonth() + 1);

		days.push(dayStr + "." + monthStr);

		date.setDate(monthDay + 1);
	}

	return { days, todayIsAviable };
}

function addZero(number) {
	if (number < 10) {
		return "0" + number;
	}
	return number;
}

function makeObject(arr, keyGetter) {
	let object = {};
	arr.forEach((e) => {
		object[keyGetter(e)] = e;
	});

	return object;
}

module.exports = {
	toMatrix: toMatrix,
	groupBy: groupBy,
	getAviableDays: getAviableDays,
	makeObject: makeObject,
};
