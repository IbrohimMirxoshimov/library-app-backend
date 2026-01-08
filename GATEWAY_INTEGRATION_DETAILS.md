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

## 4. Muhim Eslatmalar

-   SMS yuborish uchun kamida bitta qurilma ro'yxatdan o'tgan va `enabled: true` holatida bo'lishi kerak.
-   Gateway orqali yuborilayotgan barcha SMS-lar bazada `provider: 4` (gateway) sifatida belgilanadi.
