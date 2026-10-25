const { MAIN_BOT_USERNAME } = require("../config");

const texts = {
	search: "🔎 Kitob qidirish",
	rent: "📚 Kitob ijaraga olish tartibi",
	register: "📚 Ro'yxatdan o'tish",
	will_free: "⏳ Bo'shash vaqtlari",
	definition_search:
		"Kitob qidirmoqchi bo'lsangiz quyidagi <b>Kitob qidirish</b> tugmasini bosing va o'zingizga kerakli kitob nomini yozing.\n\n<b>Maslahat:</b>\nx va h harflarini to'g'ri yozishga harakat qiling. Yoki u harflarni qatnashtirmasdan kitob nomi bo'lagidan yozsangiz yaxshiroq. \nMasalan: <b>Hadis va hayot</b> emas <b>adis</b> deb yozsangiz ham kitobni topib beradi.",
	greeting: "Assalomu alaykum. Ilm va ehson kutubxonasi botiga hush kelibsiz.",
	if_you_authed:
		"Agar siz kutubxonadan ro'yxatdan o'tgan bo'lsangiz kutubxonachi bilan bog'lanib telefon raqamingiz va passport seriyangiz to'g'ri ekanligini aniqlashtirib oling. Keyin qayta kirishingiz mumkin bo'ladi\n\nAgar avval kitob olgan bo'lsangiz demak siz ro'yxatdan o'tgansiz. Qayta ro'yxatdan o'tmang\n\nAks holda royxatdan o'tishingiz kerak. Quyidagi tugmani bosib ro'yxatdan o'tishingiz va kutubxona a'zosi bo'lishingiz mumkin. So'ng kitob olish imkoniyati bo'ladi",
	chl: "🏛 Kutubxonani o'zgartirish",
	stats: "📊 Statistika",
	send_phone_correctly:
		"Iltimos raqamingizni shu shaklda yuboring: 991234567\n\n/start - asosiy menyuga qaytish",
	send_passport_correctly:
		"Iltimos passport seriyangizni shu shaklda yuboring: AA1234567\n\n/start - asosiy menyuga qaytish",
	send_phone_registred:
		"Telefon raqamingizni yuboring. \nKutubxonadan ro'yxatdan o'tgan telefon raqam bo'lsa o'sha raqamni yuboring\n\nShu shaklda: 991234567",
	phone_template: "Shu shaklda: 991234567",
	phone_number_verification_message: "Telefon raqamingizni tasdiqlash kodi:",
	menu: {
		text: {
			my_profile: "🚪 Profilim",
		},
		data: {
			my_profile: "my_profile",
		},
	},
	back: "◀️ Orqaga",
	update: "🔄 Yangilash",
	cb_data: {
		back: "back",
		register: "register",
		update: "update",
	},
	stat: {
		general: "<b>📊 Kutubxona statistikasi</b>",
		top_librarians:
			"<b>🧑‍🚀 Top 10 kitobxon</b>\n<i>Eng ko'p kitob o'qiganlik bo'yicha</i>",
		males: "<b>👨‍🏫 Erkaklar: </b>",
		females: "<b>🧑‍🏫 Ayollar: </b>",
		librarians_count: "<b>🧑‍🚀 Kitobxonlar: </b>",
		books_count: "<b>📚 Barcha kitoblar: </b>",
		rents_count:
			"<b>📖 Umumiy o'qish uchun berilgan kitoblar (ijaralar) soni: </b>",
		reading_books_count: "<b>📖 Ayni vaqtda o'qilayotgan kitoblar: </b>",
		expired_leases:
			"<b>⚠️ Ayni vaqtda kelishilgan muddatda qaytarilmagan kitoblar: </b>",
		dayly_leasing_books_avarage_count_of_last_month:
			"<b>📖 Kunlik beriladigan kitoblar soni (o'rtacha): </b>",
		leased_books_count_of_last_month:
			"<b>📖 Oxirgi oyda berilgan kitoblar: </b>",
		leased_books_count_of_last_week:
			"<b>📖 Oxirgi haftada berilgan kitoblar: </b>",
		leased_books_count_of_last_24_hours:
			"<b>📖 Oxirgi 24 soat ichida berilgan kitoblar: </b>",
		new_users_count_of_last_24_hours:
			"<b>🧑‍🚀 Oxirgi 24 soat yangi kitobxonlar: </b>",
		top_books:
			"<b>📚 Top 20 kitoblar</b>\n<i>Eng ko'p o'qilganlik bo'yicha</i>",
		footer: `<b>${MAIN_BOT_USERNAME}</b>`,
	},
	rent_info: {
		title: "✳️ <b>Kitob olmoqchi bo'lsangiz</b>",
		body: "Agar siz birinchi marta kitob olmoqchi bo'lsangiz ro'yxatdan o'tishingiz kerak bo'ladi. Buning uchun kutubxonaga pasportingizni olib boring.\n\nKutubxonaga borishdan avval kutubxonachiga quyidagi ma'lumotlarni yozib qoldiring:\n— ism, familiya;\n— yashash manzilingiz (tuman, ko'cha, uy raqami);\n— telefon raqamingiz;\n— olmoqchi bo'lgan kitobingiz nomi.",
		address: "📍 <b>Manzil:</b> ",
		contact: "👤 <b>Kutubxonachi bilan bog'lanish:</b> ",
		notes:
			"⚠️ <b>Eslatma</b>\n— Kitoblar ro'yxatini, band yoki band emasligini <b>🔎 Kitob qidirish</b> tugmasi orqali bilib olishingiz mumkin.\n— Kitob olish mutlaqo bepul.",
	},
	need_reg: `Siz botdan ro'yxatdan o'tmagansiz. Botga kiring va startni bosing\n${MAIN_BOT_USERNAME}`,
	warn_change_library:
		"⚠️ Eslatma. Kutubxonani o'zgartirilganda 1 daqiqadan (60 soniya) so'ng kitob qidirish ma'lumotlari yangilanadi!",
};

module.exports = texts;
