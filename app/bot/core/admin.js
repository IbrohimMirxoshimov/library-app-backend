const { report } = require("../../services/RentServices");
const { getReportText } = require("../../utils/rent");
const Book = require("../../database/models/Book");
const { toMatrix } = require("../../utils/array");
const { updateLocations, getLocation } = require("../cache");
const { getBooksWithStocks } = require("../fetch");
const StatServices = require("../../services/StatServices");
const { MAIN_BOT_USERNAME, production, APP_ORIGIN } = require("../../config");
const Notifications = require("../../services/Notifications");
const { Telegraf, Context } = require("telegraf");
const { rentExpiresBulkSms } = require("../../services/Crons");
const Sms = require("../../database/models/Sms");
const { SmsStatusEnum } = require("../../constants/mix");
const SmsBulk = require("../../database/models/SmsBulk");
const { message } = require("telegraf/filters");
const downloadFile = require("../../helpers/downloadFile");
const { join, extname } = require("path");
const { randomUUID } = require("crypto");

const library_private_group_id = "-1001713623437";

/**
 *
 * @param {Telegraf<Context>} ctx
 */
async function isStaffMiddleware(ctx, next) {
	if (!production) {
		return next();
	}

	const is_member = await ctx.telegram
		.getChatMember(library_private_group_id, ctx.from.id)
		.catch((e) => undefined);

	// is member
	if (
		is_member &&
		(is_member.status === "administrator" ||
			is_member.status === "creator" ||
			is_member.status === "member")
	) {
		return next();
	}
}

/**
 *
 * @param {Telegraf<Context>} ctx
 */
async function isAdminMiddleware(ctx, next) {
	const is_member = await ctx.telegram
		.getChatMember(library_private_group_id, ctx.from.id)
		.catch((e) => undefined);

	// is member
	if (
		is_member &&
		(is_member.status === "administrator" || is_member.status === "creator")
	) {
		return next();
	}
}

/**
 *
 * @param {Telegraf<Context>} bot
 */
function adminHandlers(bot) {
	bot.on(message("photo"), isStaffMiddleware, async (ctx) => {
		ctx.session.img = ctx.session.img || {};
		const p = ctx.message.photo;
		const file = await ctx.telegram.getFileLink(
			(p[2] || p[1] || p[0]).file_id
		);

		const image_path = join("files", randomUUID() + extname(file.href));

		await downloadFile(file.href, join(process.env.PWD, image_path));

		const link = `${APP_ORIGIN}/${image_path}`;

		if (ctx.message.reply_to_message) {
			try {
				let bookId =
					ctx.message.reply_to_message.reply_markup.inline_keyboard[0][0].callback_data.split(
						"_"
					)[1];

				if (bookId) {
					let [rows] = await Book.update(
						{
							image: link,
						},
						{ where: { id: bookId } }
					);
					if (rows) {
						return ctx.reply("Biriktirildi");
					}
				}
				return ctx.reply("Muommo");
			} catch (error) {
				console.error(error);
			}
		}

		ctx.session.img[ctx.message.message_id] = link;

		return ctx.replyWithHTML(`<code>${link}</code>`, {
			reply_to_message_id: ctx.message.message_id,
		});
	})
		.hears(/-(\d+)/, isStaffMiddleware, async (ctx) => {
			try {
				let [, bid] = ctx.match;

				// changing book duration
				if (ctx.message.reply_to_message?.text.startsWith("B: ")) {
					const [, bookId] =
						ctx.message.reply_to_message.text.match(/B: (\d+) D:/);
					await Book.update(
						{ rentDuration: parseInt(bid) },
						{ where: { id: parseInt(bookId) } }
					);
					return ctx.reply("Yangilandi");
				}

				// or bind image link to book
				let book = await Book.findByPk(parseInt(bid));
				if (
					!ctx.session.img[ctx.message.reply_to_message.message_id] ||
					!book
				) {
					throw new Error("e");
				}
				await Book.update(
					{
						image: ctx.session.img[
							ctx.message.reply_to_message.message_id
						],
					},
					{ where: { id: bid } }
				);
				return ctx.reply("Biriktirildi: " + book.name);
			} catch (e) {
				console.error(e);
				return ctx.reply("xatolik");
			}
		})
		.hears(
			/\/(ijr_erkak|ijr_ayol|ijr) ?(\d+)? ?(sms)?/,
			isStaffMiddleware,
			async (ctx) => {
				const [, gender, bookId, filterErrorPhones] = ctx.match;
				const filter = {};

				if (gender === "ijr_ayol") {
					filter.gender = "female";
				}

				if (gender === "ijr_erkak") {
					filter.gender = "male";
				}

				if (bookId) {
					filter.bookId = bookId.trim();
				}

				const results = await report(1, filter);

				if (filterErrorPhones) {
					const smsBulk = await SmsBulk.findOne({
						order: [["id", "DESC"]],
						raw: true,
					});

					const smses = await Sms.findAll({
						where: {
							smsbulkId: smsBulk.id,
							status: [
								SmsStatusEnum.error,
								SmsStatusEnum.pending,
							],
						},
						raw: true,
					});

					const mappedIncludedPhones = smses.reduce(
						(pv, cv) => ({
							...pv,
							[cv.phone.slice(3)]: true,
						}),
						{}
					);

					results.rows = results.rows.filter(
						(rent) => mappedIncludedPhones[rent.user.phone]
					);
				}

				const { total, items } = getReportText(results);
				const pages = toMatrix(items, 10);

				if (total === 0) {
					return ctx.reply("Topilmadi");
				}

				for (let i = 0; i < pages.length; i++) {
					const items = pages[i];
					if (i === 0) {
						await ctx.reply(
							`Jami: ${total}\n\n${items.join("\n\n\n")}`
						);
					} else {
						await ctx.reply(items.join("\n\n"));
					}
				}
			}
		)
		.command("update", isStaffMiddleware, async (ctx) => {
			await updateLocations();

			return ctx.reply("Yangilandi");
		})
		.command("send_sms", isAdminMiddleware, async (ctx) => {
			// const smses = await Sms.findAll({
			// 	where: {
			// 		smsbulkId: 160,
			// 		status: [SmsStatusEnum.done, SmsStatusEnum.pending],
			// 	},
			// 	raw: true,
			// });

			rentExpiresBulkSms()
				.then((r) => {
					if (r) {
						return ctx.reply(`SMSlar yuborildi: ${r.totalCount}`);
					}
				})
				.catch((e) => {
					return ctx.reply(`SMS yuborishda xatolik: ${e.message}`);
				});

			return ctx.reply("Sms yuborish boshlandi");
		})
		.command("update_stats", isStaffMiddleware, async (ctx) => {
			await StatServices.cacheStats();

			return ctx.reply("Yangilandi");
		})
		.command("books", async (ctx) => {
			let books = await getBooksWithStocks({
				size: 100,
				locationId: ctx.session.user?.tempLocationId,
			});
			let location = getLocation(ctx.session.user?.tempLocationId);
			let str = `<b>Kutubxona: ${location.name} - ${location.region.name}\n✅ - Bo'sh\n🅱️ - Band\n\nKitoblar ro'yxati: </b>\n`;

			for (const book of books) {
				str =
					str +
					`${book.stocks.some((s) => !s.busy) ? "✅" : "🅱️"} - ${
						book.name
					}\n`;
				if (str.length > 3900) break;
			}

			str =
				str +
				`\nBarcha kitoblarimiz va ularning bo'shash vaqtlarini ${MAIN_BOT_USERNAME} orqali ko'rishingiz mumkin`;

			return ctx.replyWithHTML(str);
		})
		.command("week", isStaffMiddleware, async (ctx) =>
			ctx.replyWithHTML(
				await Notifications.mainChannel.lastWeekStatsMessage(),
				{
					disable_web_page_preview: true,
				}
			)
		)
		.command("month", isStaffMiddleware, async (ctx) =>
			ctx.replyWithHTML(
				await Notifications.mainChannel.prevMonthStatsMessage(),
				{
					disable_web_page_preview: true,
				}
			)
		)
		.command("month_top_readers", isStaffMiddleware, async (ctx) =>
			ctx.replyWithHTML(
				await Notifications.mainChannel.prevMonthTopReadersMessage(),
				{
					disable_web_page_preview: true,
				}
			)
		)
		.command("few", isStaffMiddleware, async () =>
			Notifications.superAdminNotifications.notifyFewBooks()
		);
}

module.exports = { adminHandlers: adminHandlers };
