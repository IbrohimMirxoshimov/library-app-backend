const path = require("path");
const { sequelize, Rent, Book } = require("../database/models");
const fs = require("fs/promises");
const { pgFormatDate } = require("../utils/pgUtils");
const {
	getOneMonthBackDate,
	getOneWeekBackDate,
	getOneDayBackDate,
} = require("../utils/date");
const { Op } = require("sequelize");
const User = require("../database/models/User");
const Stock = require("../database/models/Stock");

const StatServices = {
	async getTopReadingBooks(
		locationId = 1,
		size = 10,
		from = getOneMonthBackDate(),
		untill = new Date()
	) {
		return sequelize
			.query(
				`SELECT sum(s.count::int) as count, books.name, books.id
FROM (
	SELECT stocks."bookId", count(rents.id) 
	FROM rents 
	LEFT JOIN stocks 
	ON rents."stockId" = stocks.id 
	WHERE rents.rejected = false and stocks."locationId" = :locationId and 
	rents."createdAt" between :from and :untill
	GROUP BY stocks."bookId"
) s
LEFT JOIN books
ON s."bookId" = books.id
GROUP BY books.id
ORDER BY count DESC
LIMIT :size`,
				{
					replacements: {
						from,
						untill,
						locationId,
						size,
					},
				}
			)
			.then((r) => r[0]);
	},
	getRentsCount({
		locationId = 1,
		fromDate = getOneMonthBackDate(),
		untillDate = new Date(),
	}) {
		return Rent.count({
			where: {
				rejected: {
					[Op.not]: true,
				},
				createdAt: {
					[Op.between]: [fromDate, untillDate],
				},
			},
			include: {
				model: Stock,
				as: Stock,
				where: {
					locationId: locationId,
				},
				paranoid: false,
			},
		});
	},
	/**
	 * @param {{ from?: Date, untill?: Date, select?: string[], size?: number }} filter
	 * @returns
	 */
	async getTopReaders(filter = {}) {
		return (
			await sequelize.query(
				`SELECT ${[
					...(filter.select || []),
					'"lastName"',
					"count(rents.id)",
					"users.id as user_id",
				].join(", ")}
FROM users
RIGHT JOIN rents
ON users.id = rents."userId"
WHERE rents.rejected = false 
and TIMESTAMPDIFF(HOUR, rents."leasedAt", rents."returnedAt") > 12
and rents."returnedAt" between :from and :untill
and rents."deletedAt" is null 
GROUP BY users.id
ORDER BY count DESC 
LIMIT :size`,
				{
					replacements: {
						from: filter.from || new Date(2020),
						untill: filter.untill || new Date(),
						size: filter.size || 10,
					},
				}
			)
		)[0];
	},
	async getStatsFromDB(locationId = 1) {
		// top librarian
		// LEFT(users."firstName",1) as "firstName",
		const top_librarians = await this.getTopReaders({
			size: 30,
		});

		// gender
		const [gender] = await sequelize.query(
			`SELECT users.gender, count(users.id)
			FROM users
			WHERE users.phone is not null and users.gender is not null
			GROUP BY users.gender`
		);

		// librarians
		const [[{ count: librarians_count }]] = await sequelize.query(
			`SELECT count(users.id)
			FROM users
			WHERE users.phone is not null`
		);

		// books count
		const [[{ count: books_count }]] = await sequelize.query(
			`SELECT count(s.id) from (
				SELECT id
				FROM stocks
				WHERE "locationId" = ${locationId} and "deletedAt" is null
			) s`
		);

		// rents count
		const rents_count = await this.getRentsCount({
			locationId: locationId,
			fromDate: new Date(2021, 1, 1),
		});

		// reading books
		const [[{ count: reading_books_count }]] = await sequelize.query(
			`SELECT count(rents.id)
			FROM rents
			WHERE rents."returnedAt" is null and rents."deletedAt" is null and rents.rejected = false`
		);

		// expired leases
		const [[{ count: expired_leases }]] = await sequelize.query(
			`SELECT count("rent".id) AS "count" FROM "rents" AS "rent" 
			LEFT JOIN stocks
			ON stocks.id = "rent"."stockId" 
			WHERE "rent"."deletedAt" IS NULL 
			AND stocks."locationId" = ${locationId} 
			AND "rent"."returnedAt" IS NULL 
			AND "rent"."deletedAt" IS NULL 
			AND "rent"."rejected" = false 
			AND "rent"."returningDate" < ${pgFormatDate(new Date())}`
		);

		// avarage count dayly leasing books of last month
		const [[{ count: dayly_leasing_books_avarage_count_of_last_month }]] =
			await sequelize.query(
				`SELECT count(id) FROM "rents"
			WHERE "deletedAt" IS NULL
			AND ("createdAt" BETWEEN ${pgFormatDate(
				getOneMonthBackDate()
			)} AND ${pgFormatDate(new Date())})`
			);

		// leased_books_count_of_last_month
		const [[{ count: leased_books_count_of_last_month }]] =
			await sequelize.query(
				`SELECT count(id) FROM "rents"
			WHERE "deletedAt" IS NULL
			AND ("createdAt" BETWEEN ${pgFormatDate(
				getOneMonthBackDate()
			)} AND ${pgFormatDate(new Date())})`
			);

		// leased_books_count_of_last_week
		const [[{ count: leased_books_count_of_last_week }]] =
			await sequelize.query(
				`SELECT count(id) FROM "rents"
			WHERE "deletedAt" IS NULL
			AND ("createdAt" BETWEEN ${pgFormatDate(
				new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
			)} AND ${pgFormatDate(new Date())})`
			);

		// leased_books_count_of_last_24_hours
		const [[{ count: leased_books_count_of_last_24_hours }]] =
			await sequelize.query(
				`SELECT count(id) FROM "rents"
			WHERE "deletedAt" IS NULL
			AND ("createdAt" BETWEEN ${pgFormatDate(
				new Date(Date.now() - 1000 * 60 * 60 * 24)
			)} AND ${pgFormatDate(new Date())})`
			);

		// top books
		const top_books = await this.getTopReadingBooks(
			locationId,
			100,
			new Date(2021, 3, 10)
		);

		// top books last week
		const top_books_last_week = await this.getTopReadingBooks(
			locationId,
			30,
			getOneWeekBackDate()
		);

		const one_month_leased_rents_by_day = await Rent.findAll({
			attributes: [
				[
					sequelize.fn(
						"date_trunc",
						"day",
						sequelize.col("createdAt")
					),
					"day",
				],
				[sequelize.literal(`COUNT(id)`), "count"],
			],
			where: {
				createdAt: {
					[Op.between]: [getOneMonthBackDate(), new Date()],
				},
			},
			raw: true,
			group: ["day"],
			order: [[sequelize.literal("day"), "ASC"]],
		});

		const one_month_returned_rents_by_day = await Rent.findAll({
			attributes: [
				[
					sequelize.fn(
						"date_trunc",
						"day",
						sequelize.col("returnedAt")
					),
					"day",
				],
				[sequelize.literal(`COUNT(id)`), "count"],
			],
			where: {
				returnedAt: {
					[Op.between]: [getOneMonthBackDate(), new Date()],
				},
			},
			raw: true,
			group: ["day"],
			order: [[sequelize.literal("day"), "ASC"]],
		});

		const few_books = await this.getFewBooks({ locationId });

		return {
			top_librarians: top_librarians,
			gender: gender.reduce(
				(pv, { gender, count }) => ({ ...pv, [gender]: count }),
				{}
			),
			reading_books_count: reading_books_count,
			librarians_count: librarians_count,
			books_count: books_count,
			top_books: top_books,
			rents_count: rents_count,
			expired_leases: expired_leases,
			dayly_leasing_books_avarage_count_of_last_month: Math.round(
				parseInt(dayly_leasing_books_avarage_count_of_last_month) / 26
			),
			leased_books_count_of_last_month: leased_books_count_of_last_month,
			leased_books_count_of_last_week: leased_books_count_of_last_week,
			leased_books_count_of_last_24_hours:
				leased_books_count_of_last_24_hours,
			one_month_leased_rents_by_day: one_month_leased_rents_by_day,
			one_month_returned_rents_by_day: one_month_returned_rents_by_day,
			top_books_last_week: top_books_last_week,
			new_users_count_last_month: await this.getNewUsersCount({
				locationId,
				fromDate: getOneMonthBackDate(),
			}),
			new_users_count_last_24_hours: await this.getNewUsersCount({
				locationId,
				fromDate: getOneDayBackDate(),
			}),
			few_books: few_books,
		};
	},
	cached_path: path.resolve(__dirname, "../../data.json"),
	async cacheStats() {
		let stats = await this.getStatsFromDB();
		await fs.writeFile(this.cached_path, JSON.stringify(stats));
	},
	async getStats() {
		return fs
			.readFile(this.cached_path)
			.then((data) => JSON.parse(data.toString()));
	},
	setCachingStatsCron() {
		const CACHE_UPDATE_TIME = 1000 * 60 * 60 * 4;
		// this.cacheStats().catch(console.error);
		setInterval(() => {
			this.cacheStats().catch(console.error);
		}, CACHE_UPDATE_TIME);
	},
	getNewUsersCount({
		locationId = 1,
		fromDate = getOneMonthBackDate(),
		untillDate = new Date(),
	}) {
		return User.count({
			where: {
				createdAt: {
					[Op.between]: [fromDate, untillDate],
				},
				locationId: locationId,
				phone: {
					[Op.not]: null,
				},
				passportId: {
					[Op.not]: null,
				},
			},
		});
	},
	async getFewBooks({ locationId = 1, cached = false } = {}) {
		if (cached) return this.getStats().then((r) => r.few_books);
		// 3 tadan ko'p lekin 1 ta qolgan
		// va umuman qolmagan kitoblar ro'yxatini oladigan statistika
		// LIMIT 50
		const books = await Book.findAll({
			where: { few: 1 },
			attributes: ["id", "name"],
			include: {
				model: Stock,
				as: Stock,
				where: {
					locationId: locationId,
				},
				// paranoid: false,
			},
		});

		const required_books = (
			await sequelize.query(`SELECT count(s."bookId") total, s."bookId", b.name, sum(s.busy::int) busies 
		FROM stocks s
		INNER JOIN books b
		ON b.id = "bookId"
		WHERE b.few != 0 AND (b.few = 1 OR (s."deletedAt" IS NULL AND s."locationId" = ${locationId}))
		GROUP BY s."bookId", b.name
		HAVING 
			count("bookId") = sum(busy::int) 
			or (count("bookId") > 3 AND count("bookId") - sum(busy::int) = 1) 
			or (count("bookId") > 5 AND (count("bookId") - sum(busy::int) < 4))
		ORDER BY total DESC
		LIMIT 120`)
		)[0];

		const ids = required_books.map((b) => b.bookId);

		return [
			...required_books,
			...books
				.filter((b) => !ids.includes(b.id))
				.map((b) => ({
					name: b.name,
					few: 1,
					total: b.stocks.length,
					busies: b.stocks.filter((s) => s.busy).length,
					bookId: b.id,
				})),
		];
	},
	async lastWeekStats() {
		const date = getOneWeekBackDate();

		return {
			from_date: date,
			untill_date: new Date(),
			new_users: await this.getNewUsersCount({
				locationId: 1,
				fromDate: date,
			}),
			top_books: await this.getTopReadingBooks(1, 30, date),
			rents_count: await this.getRentsCount({
				locationId: 1,
				fromDate: date,
			}),
		};
	},
	/**
	 *
	 * @param {{from: Date, untill: Date}} filter
	 * @returns
	 */
	async getStatByRange(filter) {
		return {
			from_date: filter.from,
			untill_date: filter.untill,
			new_users: await this.getNewUsersCount({
				locationId: 1,
				fromDate: filter.from,
				untillDate: filter.untill,
			}),
			top_books: await this.getTopReadingBooks(
				1,
				10,
				filter.from,
				filter.untill
			),
			rents_count: await this.getRentsCount({
				locationId: 1,
				fromDate: filter.from,
				untillDate: filter.untill,
			}),
		};
	},
	async lastMonthStats() {
		const date = getOneMonthBackDate();

		return {
			from_date: date,
			untill_date: new Date(),
			range_name: "oy",
			new_users: await this.getNewUsersCount({
				locationId: 1,
				fromDate: date,
			}),
			top_books: await this.getTopReadingBooks(1, 30, date),
			rents_count: await this.getRentsCount({
				locationId: 1,
				fromDate: date,
			}),
		};
	},
};

module.exports = StatServices;
