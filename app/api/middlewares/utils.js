const { Op, Sequelize } = require("sequelize");

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
	const pagination = id?.length
		? {}
		: {
				offset: (page - 1) * size,
				limit: size,
				order: [[sort, order]],
		  };
	const options = { ...pagination, ...extra?.options };

	let where = [];

	if (q) {
		if (extra?.search) {
			where.push(extra.search({ q }));
		} else {
			where.push(
				Sequelize.where(
					Sequelize.fn(
						"concat",
						(Model.rawAttributes[s] && Sequelize.col(`${Model.name}.${s}`)) ||
							"",
						Sequelize.cast(Sequelize.col(`${Model.name}.id`), "varchar")
					),
					{ [Op.iLike]: `%${q}%` }
				)
			);
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
		options.where = where;
	}

	if (getInclude) {
		options.include = getInclude(q);
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
