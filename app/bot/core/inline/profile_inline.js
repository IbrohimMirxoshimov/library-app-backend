const { NO_IMAGE_URL, ONE_DAY_IN_MS } = require("../../../constants/mix");
const AccountServices = require("../../../services/app/AccountServices");

function isMyBooksQuery(query) {
	return query.match(/my_books_(\d{0,1})/);
}
const getRamainedDays = (rent) => {
	let remain = new Date(rent.returningDate) - new Date();
	let remainDays = Math.floor(remain / ONE_DAY_IN_MS);

	return remainDays + 1;
};

const dateString = (date) => {
	return new Date(date).toLocaleDateString("ru");
};

function getRemainedText(rent) {
	let remained = getRamainedDays(rent);

	if (remained > 5) {
		return `🟢 ${remained} kun qoldi`;
	}
	if (remained < 0) {
		return `⚫️ ${remained} muddati o'tib ketdi`;
	}

	return `🔴 ${remained} kun qoldi. Vaqtida qaytarish lozim`;
}
function getRentDateRange(rent) {
	let t = `${dateString(rent.leasedAt)} - ${dateString(rent.returningDate)}`;
	if (rent.returnedAt) {
		return `${t}\n${
			rent.returningDate > rent.returnedAt
				? "✅ vaqtida qatarilgan"
				: "☑️ kechiktirilgan"
		}`;
	}

	return `${t}\n` + getRemainedText(rent);
}
async function answerMyBooksQuery(ctx) {
	let [, returned] = ctx.inlineQuery.query.match(/my_books_(\d{0,1})/);
	let { rows } = await AccountServices.getUserBooks(
		ctx.session.user.id,
		returned === "1"
	);

	// no result
	if (!rows?.length) {
		return ctx.answerInlineQuery([
			{
				id: 1213882378,
				type: "article",
				title: "Ma'lumot topilmadi",
				input_message_content: {
					message_text: "Hech qanday kitoblar topilmadi",
					parse_mode: "HTML",
				},
			},
		]);
	}

	// map inline result
	rows = rows.slice(0, 50).map((rent, i) => ({
		id: rent.id,
		type: "article",
		title: rent.stock.book.name,
		description: getRentDateRange(rent),
		input_message_content: { message_text: "b_" + rent.stock.book.id },
		thumb_url: rent.stock.book.image || NO_IMAGE_URL,
	}));

	return ctx.answerInlineQuery(rows, {
		cache_time: 60,
	});
}

module.exports = {
	isMyBooksQuery: isMyBooksQuery,
	answerMyBooksQuery: answerMyBooksQuery,
};
