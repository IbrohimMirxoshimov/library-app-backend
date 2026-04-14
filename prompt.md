1. working hour holidays endi library ga yozilishi kerak. 
2. front-app uchun alohida module qilish va barcha unga aloqador API larni o'sha joyga joylash kerak. 
3. regions bo'ladi      
  faqat. towns bo'lmaydi. regions bir birga parent/child qilib bog'lanadi. 
  4. bitta bookda ko'p author bo'lishi mumkin. 
  5. book-groups kerak emas. 
  6. permissions module alohida shart     
  emas menimcha? role modulga joylasa bo'ladi. 
  7. account yoki public deganlari ham barchasi front app moduleda bo'lsin. 
  8. config servisni ishlatma nestjsda gi. menga         
  yoqmaydi. o'rniga oddiy function call bilan barcha configni qaytardigan oddiy funksiya qilib qo'y. 
  9. bot bo'limini alohida qilamiz. botda conversations ishlatmaymiz adashmasam.           
  telegrafda scane nomli tushuncha bo'lar edi. lekin grammyda boshqa narsa adashmasam o'shani ishatish kerak menimcha. yana uni ko'ramiz. sen izlanib ko'r webda. 
  
  # DB: 
  - userda fullname     kerak emas. phone number bittasi column qolganlari array bo'lishi kerak istalgancha saqlash mumkin    
  bo'lsin. columndagi asosiysi bo'ladi. agar u o'zgarsa phone verified ketadi verfy qilish uchun eskiz orqali kod yuborishi va tasdiqlashi kerak bo'ladi. bu alohida API kerak tasdiqlash  
  uchun. 
  - user regionga bog'lanmaydi. address ga bog'lanadi fqat. adressda region town boshqa narsalar bo'ladi. 
  - Keyin user ko'p libraryda bo'lishi mumkin. Shu katta o'zgarish bo'ladi bizda. ya'ni user deganda mijozni etyapman. ammo user admin bo'lsa faqat bitta library da bo'ladi. buni saqlash uchun alohida column qilish kerak. 
  - permission constata bo'ladi. value number bo'lishi kerak. roleda array bo'lib saqlanishi kerak. keyin shu constatalarni guard decartorga beriladi.
  - Library da region bolmaydi addressga yozish kerak region town h.k
  - Book uchun yana yengi mantiq qo'shish kerak. Book Rules nomli. Book rules book va library bog'lanadi. Uni ichida price, rent duration, few (shuni nomini o'zgartirish kerak) -> noyobligi haqida ham daraja uchun qandaydir column qo'shish kerak. yani agar bu kamyob, qimmat, yoki qandaydir belgilangan bo'lsa userlarni qaysidir shartlar asosida beriladigan bo'ladi. yani hozir few qisman shuni qilyapti. unda zarur kitob yoki defolt tizim sifatida ishlatish mumkin shunga noyob degan enum ham qo'shish kerak. yani shu fewni o'zgartirish va rivojlantirish kerak. Hullas book rule kutubxonani shu kitob bo'yicha qonun qoidalari.
  - bookda authors bo'lishi kerak, bookgroup kerak emas. image -> images qilish kerak. array. searchable_name ham kerak. bu name va authors nameni ni crildlan lotinga va x va h -> h, faqat raqam va harf qoldirishi kerak. va index kerak. book uchun tags qo'shish shart. string array. lang qo'shish kerak. enum.
  - book_models table kerak. unda pages (bookdan olib tashlanadi), printed at (bookdan olib tashlanadi), publisher (bookdan olib tashlanadi), isbn (bookda ham qoladi), images (bookda ham qoladi) bo'ladi. undan tashqari nashr raqamini ham kirtadigan joy kerak stringda.
  - Authorda searchable name kerak huddi book kabi. images kerak. 
  - Piblisherda image kerak. 
  - stokda book, book_model (optinal), book_rule ko'rsatilishi kerak. lokatsiyaga qarab book rule tanlanadi. 
  - stockda comment yozish (audit log bilan qilsa bo'lar balki) imkoni kerak. yani aynan shu kitobni qayergadir nimadir ob'lgan bo'lsa sana va matn bilan yozib ketiladi. undan tasqari boshqa hodisalarni ham yozish mumkin bo'ladi masalan kitob yo'qoldi, tamirga yuborildi shu kabi narsalar uchun
  - stock uchun status kerak, yo'qoldi, tamirda, aktiv, o'g'irlandi va h.k.
  -  Rentni tubdan o'zgartiramiz. Ammmo migration uchun nima qaysi ekanlgini bilib ol. Rent → Rental 
  ┌─────┬────────────────┬──────────────────────┬────────────────────────────────────────────────────────────────────────────────────┐                                                     
  │  #  │    Eski nom    │      Yangi nom       │                                        Izoh                                        │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 1   │ rent (table)   │ rentals              │ "Rental" kutubxona terminologiyasida to'g'riroq                                    │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
  │ 2   │ id             │ id                   │ O'zgarmaydi                                                                        │                                                     
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 3   │ leasedAt       │ issuedAt             │ Kitob berilgan sana. "Issue" — kutubxonada kitob berish standarti                  │                                                     
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 4   │ returningDate  │ dueDate              │ Qaytarish muddati. "Due date" — universal kutubxona atamasi                        │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 5   │ returnedAt     │ returnedAt           │ Kitob qaytarilgan sana. Allaqachon to'g'ri                                         │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 6   │ customId (Int) │ referenceId (String) │ Qo'lda yoziladigan identifikator. String chunki raqam+harf aralash bo'lishi mumkin │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 7   │ rejected       │ rejected             │ Qoladi. Rad etilgan ijara                                                          │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 8   │ —              │ note (String?)       │ Yangi. Ixtiyoriy izoh (masalan: "kitob shikastlangan")                             │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 9   │ userId         │ readerId             │ Kitobxon. "Reader" kutubxona kontekstida aniqroq                                   │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 10  │ stockId        │ stockId              │ O'zgarmaydi                                                                        │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 11  │ locationId     │ libraryId            │ "Library" deb nomlaymiz endi                                                       │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 12  │ —              │ issuedById (Int)     │ Yangi. Kitobni kim bergan (kutubxonachi)                                           │
  ├─────┼────────────────┼──────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤                                                     
  │ 13  │ —              │ returnedById (Int?)  │ Yangi. Kitobni kim qabul qilgan                                                    │
  └─────┴────────────────┴──────────────────────┴─────────────────────
  - JWT. jwt ichida faqat userga aloqador faqat id bo'ladi. boshqa data qo'shma. non-expireing uchun ham id kerak. fqat mayli type orqali expire qilmasliging mumkin.
  - Permissionsi aytganimdan consatat qlib bir const qilishing va boshqa joylarda import qilbi ishlatishing kerak. 
  - check-phone api kerak emas. 
  - api/v1/auth/signup kerak emas. 
  - /api/v1/auth/refresh kerak emas.
  - rentals va stockdagi comment qismini alohid comment table ochib o'shani ishlatgan holda qil. audit logni comment sifatida ishlatma. 
  - reject qilishda doim reason kiritishi kerak. va stock ham status o'zgarishi kerak. stock hech qachon o'chirilmasligi shart. 
  - bazada hech narsa o'chmaydi. umuman o'chirish uchun API qilma. Kerak bo'lsa keyin bazilarig o'chirish qo'shamiz
  - Imkon boricha bitta pattern ishaltishga harakat qil. ayniqsa listlar uchun. filter qilish uchun. pagination uchun generxlar ishlatish kerak. interface bilan maintable kod qilish kerak.
  - shu statsini ham eskidek qilmasdan optimizatsiya qilish kerak
  - Internal Endpoints (bot service token only) bu API nega kerak. olib tashla. telegram bo'yivha olishni front-appga chiqar.
  - Automatic blocking occurs when: bunisi kerak emas -> SMS delivery rejected (via Eskiz webhook) 
  - 7.4 Few Books Detection yuqorida aytganimdek buni reviojlantirish kerak. 
  - *Conversations** — Multi-step interactive flows (replaces Telegraf scenes) agar shu yaxshi optimezed bo'lsa unda mayli shu uslubda qil. yoki router uslubida qil.
  - 8.4 Admin Bot Commands bular umuman kerak emas. hammasiga api qilishga vaqt yo'q. Yani front-app uchun kerak bo'ladigan narsalardan tasqari admin uchun narsalar kerak emas. 
  - 14. Logging bu kerak emas. faqat log levellarni qil. debug payti kerak bo'ladi. prodda kamroq og chiqqani maqqul. Bizda o'zi audit log yetadi adminlar uchun. developer uchun oddiy log ham bo'laveradi. kodlar orasidagi. requestdagi loglar kerak emas hzoircha. 