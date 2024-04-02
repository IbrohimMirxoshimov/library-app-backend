const { Op, Sequelize } = require("sequelize");
const { Stock, Book } = require("../database/models");
const HttpError = require("../utils/HttpError");

function getListOptions(
	{
		size = 10,
		page = 1,
		sort = "updatedAt",
		order = "DESC",
		q = "",
		id,
		filters,
	},
	customWhere
) {
	const pagination = id?.length
		? {}
		: {
				offset: (page - 1) * size,
				limit: size,
				order: [[sort, order]],
		  };
	const options = { ...pagination };

	let where = [];

	if (q) {
		where.push(
			Sequelize.where(
				Sequelize.fn(
					"concat",
					"i",
					Sequelize.cast(Sequelize.col("stocks.id"), "varchar"),
					"b",
					Sequelize.cast(Sequelize.col("book.id"), "varchar"),
					".",
					Sequelize.col("book.name")
				),
				{
					[Op.iLike]: `%${q}%`,
				}
			)
		);
	}

	if (filters) {
		where.push(filters);
	}

	if (customWhere) {
		where.push(customWhere);
	}
	if (id?.length) {
		where.push({
			id: id,
		});
		options.paranoid = false;
	}

	if (where.length) {
		options.where = where;
	}
	options.include = {
		model: Book,
		as: "book",
		paranoid: false,
	};

	return options;
}

const StockController = {
	add: () => async (req, res, next) => {
		try {
			let result = await Stock.create({
				...req.body,
				locationId: req.user.libraryId || 1,
			});

			return res.json(result.toJSON()).status(201);
		} catch (e) {
			next(e);
		}
	},
	getList: () => async (req, res, next) => {
		try {
			// let query = getPermissionFilters(query, req, "librarian")

			const { count, rows } = await Stock.findAndCountAll(
				getListOptions(
					req.query,
					req.user.owner
						? undefined
						: {
								locationId: req.user.libraryId || 1,
						  }
				)
			);
			return res
				.json({
					page: parseInt(req.query.page) || 1,
					items: rows,
					totalCount: count,
				})
				.status(200);
		} catch (e) {
			next(e);
		}
	},
	update: () => async (req, res, next) => {
		try {
			let stock = await Stock.findByPk(req.params.id);

			if (!req.user.owner && stock.locationId !== req.user.libraryId)
				throw HttpError(403);

			delete req.body.busy;
			const result = await Stock.update(
				req.user.owner
					? req.body
					: {
							...req.body,
							locationId: req.user.libraryId || 1,
					  },
				{
					where: { id: req.params.id },
				}
			);

			if (!result[0]) return res.json({ message: "Not found" }).status(404);

			return res.json({ message: "Updated" }).status(200);
		} catch (e) {
			next(e);
		}
	},
	destroy: () => async (req, res, next) => {
		try {
			let stock = await Stock.findByPk(req.params.id);

			if (!req.user.owner && stock.locationId !== req.user.libraryId)
				throw HttpError(403);

			if (stock.busy) {
				return res
					.json({ message: "Bu kitob band. Avval bo'shating" })
					.status(400);
			}

			let result = await Stock.destroy({ where: { id: req.params.id } });

			if (!result[0]) return res.json({ message: "Not found" }).status(404);

			return res.json({ message: "Destroyed" }).status(200);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = StockController;
