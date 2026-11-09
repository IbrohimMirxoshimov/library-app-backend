const { Op } = require("sequelize");
const { searchWhere, searchRankOrder } = require("../../utils/search");

function getListOptions(
	{
		size = 10,
		page = 1,
		sort = "updatedAt",
		order = "DESC",
		q = "",
		s = "name",
		id,
		filters,
	},
	extra = {},
	Model,
	getInclude,
	customWhere
) {
	// qs turns arrays with more than 20 items into objects ({ "0": .., "21": .. })
	if (id && !Array.isArray(id)) {
		id = typeof id === "object" ? Object.values(id) : String(id).split(",");
	}

	const pagination = id?.length
		? {}
		: {
				offset: (page - 1) * size,
				limit: size,
				order: [[sort, order]],
		  };
	const options = { ...pagination, ...extra?.options };

	let where = [];
	let searchOrder = null;

	if (q) {
		if (extra?.search) {
			const searchCondition = extra.search({ q });
			if (searchCondition) where.push(searchCondition);
			searchOrder = extra.searchOrder?.({ q }) || null;
		} else {
			// "{name} {id}" bo'yicha normallashtirilgan qidiruv (s ustuni bo'lmasa faqat id)
			const attribute = Model.rawAttributes[s];
			const column =
				attribute && `coalesce("${Model.name}"."${attribute.field || s}"::text, '')`;
			const idSql = `"${Model.name}"."id"::text`;
			const searchCondition = searchWhere(q, (norm) =>
				column ? `${norm(column)} || ' ' || ${idSql}` : idSql
			);
			if (searchCondition) where.push(searchCondition);
			searchOrder = column ? searchRankOrder(q, [column]) : null;
		}
	}

	if (id?.length) {
		where.push({
			id: id,
		});
		options.paranoid = false;
	}

	if (filters) {
		let nullables = Object.entries(filters)
			.filter(([key, v]) => v == 0)
			.map(([key, v]) => [
				key,
				{
					[Op.is]: null,
				},
			]);

		where.push({ ...filters, ...Object.fromEntries(nullables) });
	}

	if (customWhere) {
		where.push(customWhere);
	}

	if (where.length) {
		options.where = { [Op.and]: where };
	}

	if (getInclude) {
		options.include = getInclude(q);
	}

	// qidiruvda eng mos (nomi so'rov bilan boshlanadigan) natijalar birinchi
	if (searchOrder && options.order) {
		options.order = [searchOrder, ...options.order];
	}

	return options;
}

function clearEmptyKeys(object) {
	let newObject = {};
	for (const key in object) {
		if (Object.hasOwnProperty.call(object, key)) {
			const element = object[key];
			if (element) {
				newObject[key] = element;
			}
		}
	}

	return newObject;
}

function listResponse(res, page, rows, totalCount) {
	return res
		.json({
			page: parseInt(page) || 1,
			items: rows,
			totalCount: totalCount,
		})
		.status(200);
}

module.exports = {
	listResponse: listResponse,
	getListOptions: getListOptions,
	clearEmptyKeys: clearEmptyKeys,
};
