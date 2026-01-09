# SMS Gateway Integratsiyasi va Yangilanishlar Hisoboti

Ushbu hujjatda SMS Gateway tizimini integratsiya qilish va optimallashtirish bo'yicha amalga oshirilgan barcha o'zgarishlar jamlangan.

## 1. Maqsad

Asosiy maqsad - Android qurilmalar orqali SMS yuborish va qabul qilish imkoniyatini yaratish, hamda mavjud backend tizimi bilan Android ilova (Textbee) o'rtasidagi statuslar muvofiqligini ta'minlash.

## 2. Amalga Oshirilgan O'zgarishlar

### A. Joi Validation O'zgarishlari (`app/api/routes/gateway.js`)

-   **Unknown Keys**: Gateway so'rovlarida qo'shimcha (noma'lum) kalitlar kelganda xato bermasligi uchun `.unknown()` qo'shildi.
-   **Statuslar**: Android ilovadan kelayotgan statuslar (katta harflarda) moslashtirildi. Validator endi quyidagilarni qabul qiladi:
    -   `SENT`, `DELIVERED`, `FAILED`, `DELIVERY_FAILED`

### B. SMS Statuslarini Map qilish (`app/services/GatewayService.js`)

-   Android ilovadan kelayotgan katta harfli statuslar backend'ning `SmsStatusEnum` qiymatlariga to'g'ri map qilindi:
    -   `SENT` -> `sent`
    -   `DELIVERED` -> `delivered`
    -   `FAILED` va `DELIVERY_FAILED` -> `error`

### C. Individual SMS Yuborish Imkoniyati

-   **Yangi Servis**: `app/services/SmsService.js` yaratildi. U individual SMS yaratish va uni Gateway orqali yuborish (Firebase Push) logikasini o'z ichiga oladi.
-   **Yangi Route**: `app/api/routes/sms.js` fayliga `POST /send-single` endpoint-i qo'shildi.

### D. Android Ilova bilan Muvofiqlashtirish

-   `SMSStatusReceiver.java` o'rganildi va u yerdagi status nomlari backend'ga ko'chirildi.
-   `receiveSms` metodida telefon raqamidan `+998` prefiksini olib tashlash va kelgan vaqtni (`receivedAtInMillis`) to'g'ri formatlash yo'lga qo'yildi.

## 3. Yangi API dan Foydalanish

### Individual SMS yuborish

Foydalanuvchi o'ziga tegishli (faol) gateway qurilmasi orqali SMS yuborishi mumkin.

**Endpoint:** `POST /api/sms/send-single`
**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
	"phone": "991234567",
	"text": "Salom, bu test xabari!"
}
```

### E. Pending SMS API va Push Notification Optimizatsiyasi (2026-01-09)

**Muammo:** Qurilmada internet bo'lmaganida, har bir SMS uchun alohida push notification yuborilardi. Internet qayta ulanganda 100+ push birdan kelib, Android OS push'larni bloklardi.

**Yechim:**

1. **Bitta Push Notification** - Endi faqat bitta push yuboriladi: `{"type": "PENDING_SMS_AVAILABLE"}`
2. **Yangi API Endpoint** - Android app o'zi pending SMS'larni paginated oladi va delay bilan yuboradi

**Yangi metod:** `pushPendingSmsNotification(userId)` - Faqat bitta push yuboradi

**Yangi API:**

**Endpoint:** `GET /gateway/devices/{deviceId}/pending-sms`
**Headers:** `Authorization: Bearer <token>`
**Query Params:**

-   `page` - Sahifa raqami (1 dan boshlanadi, default: 1)
-   `size` - Sahifadagi elementlar soni (default: 10, max: 50)

**Response:**

```json
{
	"items": [
		{
			"id": "123",
			"phone": "901234567",
			"text": "SMS matni"
		}
	],
	"page": 1,
	"size": 10,
	"totalElements": 150,
	"totalPages": 15,
	"last": false
}
```

**Android Flow:**

1. Backend SMS'larni yaratadi va bitta `PENDING_SMS_AVAILABLE` push yuboradi
2. Android app push'ni qabul qiladi
3. App `GET /gateway/devices/{deviceId}/pending-sms` orqali pending SMS'larni oladi
4. App SMS'larni delay bilan birma-bir yuboradi
5. `last: false` bo'lsa keyingi page'ni so'raydi

## 4. Muhim Eslatmalar

-   SMS yuborish uchun kamida bitta qurilma ro'yxatdan o'tgan va `enabled: true` holatida bo'lishi kerak.
-   Gateway orqali yuborilayotgan barcha SMS-lar bazada `provider: 4` (gateway) sifatida belgilanadi.
-   Pending SMS API chaqirilganda, qaytarilgan SMS'lar avtomatik ravishda `deviceId` bilan yangilanadi.
