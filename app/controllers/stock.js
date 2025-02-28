const { Op, Sequelize } = require("sequelize");
const { Stock, Book, sequelize } = require("../database/models");
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
			if (!req.body.bookId) {
				throw HttpError(400, "bookId required");
			}

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

			if (!result[0])
				return res.json({ message: "Not found" }).status(404);

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

			if (!result[0])
				return res.json({ message: "Not found" }).status(404);

			return res.json({ message: "Destroyed" }).status(200);
		} catch (e) {
			next(e);
		}
	},
	download: () => async (req, res) => {
		try {
			// Get locationId from authenticated user
			const locationId = req.user.libraryId;

			// Fetch data with joins and count
			const stockData = await sequelize.query(`
SELECT 
    b.name AS book_name,
    b.language AS book_language,
    COUNT(s.id) AS stock_count,
    a.name AS author_name
FROM books b
INNER JOIN stocks s ON b.id = s."bookId" AND (s."deletedAt" IS NULL AND s."locationId" = ${locationId})
LEFT JOIN authors a ON b."authorId" = a.id AND (a."deletedAt" IS NULL) 
WHERE (b."deletedAt" IS NULL)
GROUP BY b.name, a.name, b.language;`);
			// Define CSV headers
			const headers = [
				{ id: "book_name", title: "Kitob" },
				{ id: "stock_count", title: "Soni" },
				{ id: "author_name", title: "Muallif" },
				{ id: "book_language", title: "Til" },
			];

			// Generate CSV content
			const csvContent = convertToCSV(stockData[0], headers);

			// Set response headers for CSV download
			res.setHeader("Content-Type", "text/csv");
			res.setHeader(
				"Content-Disposition",
				"attachment; filename=kitoblar.csv"
			);

			// // Send CSV file
			res.send(csvContent);
			// res.json(stockData[0]);
		} catch (error) {
			console.error("Error generating stock report:", error);
			res.status(500).json({
				error: "Failed to generate stock report",
				details: error.message,
			});
		}
	},
};

// Utility function to convert data to CSV
function convertToCSV(data, headers) {
	// Convert headers object to CSV header row
	const headerRow = headers.map((h) => `"${h.title}"`).join(",");

	// Convert data to CSV rows
	const rows = data.map((item) => {
		return headers
			.map((header) => {
				const value = item[header.id];
				// Handle values that might contain commas or quotes
				if (value === null || value === undefined) {
					return '""';
				}
				// Escape quotes and wrap field in quotes
				const escaped = String(value).replace(/"/g, '""');
				return `"${escaped}"`;
			})
			.join(",");
	});

	// Combine header and rows
	return headerRow + "\n" + rows.join("\n");
}

module.exports = StockController;
