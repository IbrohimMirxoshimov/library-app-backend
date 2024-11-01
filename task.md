# Kechikkan ijaralar bilan ishlash

1. Botga ijara olish uchun filter kamanda qo'shish. Oxirigi yuborilgan smsda error bo'lgan ijaralarni olishga.
2. Ijaralarga telefon qilish uchun imoniyat qo'shish kerak

# Stock uchun holat qo'shish kerak

### Baza

1. Holat
    - Active
    - Taqiqlangan
    - Ta'mir talab
    - Yo'qolgan
2. Shikastlangan haqida description

### Qayerlarga ta'sir qiladi

1. Public API da faqat active holatdagi stocklar chiqishi kerak
2. id bo'yicha stock qidirishda ham faqat activlar chiqadi yoki filter qo'shib berish kerak
3. stock hammasi chiqaveradi
4. statistika
5. add rent agar ta'sirli joyi bo'lsa. ko'rish kk

# Inventarizatsiya bo'limi

1. Yasash
2. record qo'shish
3. Tugallash
4. List

# Kitob

1. Kitobga oid o'zgarishlar log saqlanishi
2. Hamma kitoblarni muddatini eng kamida 10 kun qilish
3. Agar kitob 20 kundan kam bo'lsa warning chiqarish

# Kitob uzaytirish

1. Holatni olib tashlaymiz
2. Kechiktirilgan kitob bo'lsa ko'rsatib turish
3. Kitobimni uzaytirish
    - Kitobni tanlang
    - Nima sababdan kechiktiryapsiz? [sabablar]
    - Necha kunda o'qib bo'lasiz [1,2,3,4,5,6,7]
    - Ogohlantirish va tashakkur -> Profile

# Verifikatsiya user

1. Uchta telefon raqam olish
2. Sms kod bilan tasdiqlash (eskiz)
3. Qolgan raqamlarga sms yuborish (app)
4. Botga ulash
    - Verifikatsiya kod kelganda link ham keladi. Botga kriish uchun
    - agar interneti bo'lmasa telefonni tochkasiga ulanish
5. Passportni rasmga olish. kopiyani to'xtatish.
6. MI home 360 kamerasini olish

# Migration to TS

1. Nestjsga ogirish
    - permission based

# Ball tizimga o'tish

1. Ball +
    - qo'shilganda
    - kitobni topshirganda
    - qo'lda
2. Ball -
    - kitob kechiktirilganda har bir kuniga kitobning muhimligiga qarab
    - qoidalarni buzganda
    - qo'lda
3. Ball bilan tekshirish joylar
    - kitob olayotganda
    - har bir kitobni balli bo'ladi bu narx + tarxidagi zarurlikka qarab bir marta o'rnatib olinadi
    - blok qilish olib tashlanadi
        - o'rniga ball bilan tekshiriladi
        - ball yetsa kitob oladi. Yoki pul to'lab ball olishi mumkin.
        - pulni olganda pulga mos ball ayirilb tashaladi.

# Ijaralarni lokatsiyaga bog'lash
1. Hozir rent -> stock -> location. vazifa rent -> location
2. Tasir qiladigan joylar
    - statistika
    - add rent
    - update rent
    - rent list filter
    - qidirib ko'rish kerak boshqalarini
3. rent listga filter qo'shish kerak admin uchun

# Ijaraga berish
1. eskisni ijaraga berish
2. Agar stockda muammolar bo'lsa uni chek qo'g'ozlga yozish
3. Stockdagi muammolarni print qilib yopishtirib qo'yish

# Baza nomlar
1. Book nomlarini bosh harfini katta qilish. Agar so'zning hammasi kattada bo'lsa Title kase ga ogirish, tutuq belgi vahakzaolarni ' almashtirish
2. Kitobxon nomarida ham yuqoridagi amalni bajarish