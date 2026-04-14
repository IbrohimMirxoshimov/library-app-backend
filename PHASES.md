# Implementation Phases

> Har bir faza tugagandan keyin ishlaydigan, test qilinadigan holat bo'lishi kerak.
> Fazalar ketma-ket bajariladi — har biri oldinigiga bog'liq.

---

## Phase 1: Project Foundation

**Maqsad:** NestJS loyiha skeleti, DB, auth — hamma narsa uchun asos.

### 1.1 Project Setup
- [x] NestJS loyiha yaratish (pnpm, TypeScript strict)
- [x] `nest-cli.json`, `tsconfig.json` sozlash
- [x] `.env.example`, `.gitignore`
- [x] `src/config/index.ts` — `getConfig()` + `validateConfig()`
- [x] CORS, global validation pipe, exception filter
- [x] Graceful shutdown hooks
- [x] Swagger setup (`/api/docs`)

### 1.2 Database & Prisma
- [x] `prisma/schema.prisma` — TO'LIQ schema (barcha modellar, enumlar, commentlar)
- [x] `prisma/seed.ts` — default roles (owner, moderator, librarian) + admin user
- [x] `src/modules/prisma/` — PrismaModule, PrismaService (onModuleDestroy)
- [x] `src/constants/permissions.ts` — barcha permission konstantalari

### 1.3 Redis
- [x] `src/modules/redis/` — RedisModule, RedisService

### 1.4 Auth & RBAC
- [x] `src/modules/auth/` — AuthModule, AuthController, AuthService
- [x] JWT strategy (`jwt.strategy.ts`) — faqat `sub` + `type` dan user yuklash
- [x] Internal auth guard (bot service token)
- [x] `src/common/guards/jwt-auth.guard.ts` — global guard
- [x] `src/common/guards/permissions.guard.ts` — permission check
- [x] `src/common/decorators/` — `@CurrentUser()`, `@RequirePermissions()`, `@Public()`
- [x] `POST /api/v1/auth/signin` — admin login (username/phone + password)
- [x] Rate limiting (Redis-based)
- [x] `GET /api/v1/health` — health check endpoint

### 1.5 Common Infrastructure
- [x] `src/common/dto/pagination-query.dto.ts` — generic pagination DTO
- [x] `src/common/dto/paginated-response.dto.ts` — generic response wrapper
- [x] `src/common/interceptors/audit-log.interceptor.ts`
- [x] `src/common/interceptors/transform.interceptor.ts`
- [x] `src/common/utils/string.utils.ts` — cyrillic2latin, searchableName generator
- [x] `src/common/utils/phone.utils.ts` — phone normalization
- [x] `src/common/utils/date.utils.ts` — working day calculation

### 1.6 E2E Test Setup
- [x] Jest + Supertest konfiguratsiyasi
- [x] `test/e2e/setup.ts` — test DB, seed, cleanup
- [x] `test/e2e/auth.e2e-spec.ts` — signin, invalid credentials, rate limit

**Natija:** Login qilish, JWT olish, permission guard ishlashi, health check, Swagger.

---

## Phase 2: Core Entity Modules

**Maqsad:** Asosiy CRUD modullar — kitoblar, mualliflar, kutubxonalar, userlar.

### 2.1 Roles Module
- [x] `src/modules/roles/` — CRUD roles + permissions boshqarish
- [x] `test/e2e/roles.e2e-spec.ts`

### 2.2 Regions Module
- [x] `src/modules/regions/` — CRUD, parent/child hierarchy
- [x] Tree query (parent + children)

### 2.3 Addresses Module
- [x] `src/modules/addresses/` — AddressService (CRUD, regionId bilan)

### 2.4 Libraries Module
- [x] `src/modules/libraries/` — CRUD, schedule JSON validation
- [x] Address relation boshqarish

### 2.5 Users Module
- [x] `src/modules/users/` — Admin CRUD
- [x] `POST /users/check-passport` — cross-library lookup (rate limited 2/min)
- [x] `POST /users/link-library` — UserLibrary join
- [x] Library-scoped filtering (admin faqat o'z kutubxonasi userlari)
- [x] Password hashing (bcrypt)
- [x] `test/e2e/users.e2e-spec.ts`

### 2.6 Passports Module
- [x] `src/modules/passports/` — CRUD passports for user

### 2.7 Authors Module
- [x] `src/modules/authors/` — CRUD, searchableName auto-generation
- [x] Duplicate detection via searchableName

### 2.8 Publishers Module
- [x] `src/modules/publishers/` — CRUD

### 2.9 Collections Module
- [x] `src/modules/collections/` — CRUD, sort ordering

### 2.10 Books Module
- [x] `src/modules/books/` — CRUD, many-to-many authors
- [x] `searchableName` auto-generation (name + authors)
- [x] Duplicate detection
- [x] Image array boshqarish
- [x] Tags, language enum
- [x] `test/e2e/books.e2e-spec.ts`

### 2.11 Book Editions Module
- [x] `src/modules/book-editions/` — CRUD, book + publisher link

### 2.12 Book Rules Module
- [x] `src/modules/book-rules/` — CRUD, unique [bookId, libraryId]
- [x] Rarity enum validation

### 2.13 Audit Log Module
- [x] `src/modules/audit-log/` — View logs (GET list, GET detail)
- [x] Interceptor integration test

**Natija:** Barcha asosiy entitylarni CRUD qilish, role/permission boshqarish, audit log.

---

## Phase 3: Stock & Rental System

**Maqsad:** Kutubxona asosiy funksiyasi — kitob berish va qaytarish.

### 3.1 Stocks Module
- [x] `src/modules/stocks/` — CRUD
- [x] Auto-assign bookRuleId (lookup yoki create)
- [x] Status management (ACTIVE, LOST, DAMAGED, etc.)
- [x] Library-scoped filtering
- [ ] CSV export (`GET /stocks/export`)
- [x] `test/e2e/stocks.e2e-spec.ts`

### 3.2 Comments Module
- [x] `src/modules/comments/` — polymorphic (stockId/rentalId)
- [x] GET list by entity, POST add comment

### 3.3 Rentals Module — Core
- [x] `src/modules/rentals/` — Create, Return, Reject, Edit
- [x] **Rental strategy** (per library, max active limits)
- [x] **Rarity check** (UNCOMMON/RARE/RESTRICTED rules)
- [x] **SQRT auto-detection** for COMMON books
- [x] **"Zarur" blocking** — cannot hold 2 zarur books
- [x] **Working day calculation** (Library.schedule — weekends + holidays)
- [x] **Pre-validation** (`POST /rentals/check`)
- [x] **Return** with auto-blocking check (70d/10d)
- [x] **Reject** with mandatory reason + stock status change
- [x] **Edit** dueDate with comment logging
- [x] `issuedById`, `returnedById` tracking
- [x] Transaction support (Prisma transaction)
- [x] `test/e2e/rentals.e2e-spec.ts` — full lifecycle

### 3.4 Rental Report
- [x] `GET /rentals/report` — expired rentals (dueDate o'tganlar)
- [x] Gender, bookId, library filter

**Natija:** Kitob berish, qaytarish, rad etish, rarity tizimi to'liq ishlaydi.

---

## Phase 4: Front-App Module

**Maqsad:** Mobil/web ilova uchun barcha client API'lar.

### 4.1 Front Auth
- [x] `POST /app/auth/signin` — phone + password/passport
- [x] Rate limit (10/min)

### 4.2 Front Books
- [x] `GET /app/books` — paginated, filterable, faqat ACTIVE stocks
- [x] `GET /app/books/filters` — collections, authors
- [x] `GET /app/books/:id` — detail + availability + rarity info
- [x] `GET /app/books/:id/statuses` — rental statuses at library

### 4.3 Front Account
- [x] `GET /app/account` — profile (sensitive fields excluded)
- [x] `PATCH /app/account` — update profile
- [x] `GET /app/account/books` — user's rentals (active/returned)
- [ ] `POST /app/account/verify-phone` — send verification code (Phase 5 da)
- [ ] `POST /app/account/confirm-phone` — confirm code (Phase 5 da)

### 4.4 Front Other
- [x] `GET /app/collections`
- [x] `GET /app/libraries` — active libraries list
- [x] `GET /app/users/telegram/:telegramId` — user lookup (bot/auth)
- [x] `POST /app/expired-rental-info` — rate limited (5/hour)

### 4.5 Front Stats
- [x] `GET /app/stats` — public statistics (Redis cached)
- [x] `POST /app/stats/by-range` — custom date range

### 4.6 E2E Tests
- [x] `test/e2e/account.e2e-spec.ts`

**Natija:** Mobil ilova to'liq ishlaydi — login, kitob qidirish, profil, ijaralar.

---

## Phase 5: SMS, Gateway, Verification

**Maqsad:** SMS tizimi, Android gateway, telefon tasdiqlash.

### 5.1 Verification Module
- [x] `src/modules/verification/` — Redis-based code storage (5 min TTL)
- [x] Eskiz SMS provider integration
- [x] `POST /verification/send-code`, `POST /verification/verify`
- [x] `test/e2e/verification.e2e-spec.ts`

### 5.2 SMS Module
- [x] `src/modules/sms/` — CRUD, bulk SMS, conversations
- [x] SMS filter types (active_reading, rent_expired, etc.)
- [x] Conversations view (latest per phone)

### 5.3 Gateway Module
- [x] `src/modules/gateway/` — device registration, FCM push
- [x] `firebase.service.ts` — Firebase Admin SDK setup
- [x] Pending SMS endpoint (paginated)
- [x] SMS status update (SENT/DELIVERED/FAILED mapping)
- [x] Daily SMS limit enforcement

### 5.4 Webhook Module
- [x] `src/modules/webhook/` — Eskiz callback
- [x] Status mapping (DELIVERED/REJECTED → SmsStatus enum)

### 5.5 Files Module
- [x] `src/modules/files/` — local file upload
- [x] ServeStaticModule for `/uploads/`
- [x] Format validation (PNG, JPG, PDF)
- [x] UUID filename generation

**Natija:** SMS yuborish, qabul qilish, Android gateway, fayl yuklash ishlaydi.

---

## Phase 6: Stats & Cron Jobs

**Maqsad:** Statistika, avtomatik xabarnomalar, cron joblar.

### 6.1 Stats Module
- [x] `src/modules/stats/` — optimized queries, Redis cache (1 hour)
- [x] Admin stats endpoint
- [x] Top readers, top books, gender breakdown
- [x] Few books list (SQRT + rarity-based)
- [x] Weekly/monthly/daily counts

### 6.2 Notifications Module
- [x] `src/modules/notifications/telegram-notification.service.ts`
- [x] Telegram Bot API integration (native fetch)

### 6.3 Cron Jobs
- [x] `group-notifications.cron.ts` — hourly/daily TG group messages
- [x] `channel-notifications.cron.ts` — weekly/monthly channel posts
- [x] `donation-notifications.cron.ts` — donation channel stats
- [x] `sms-notifications.cron.ts` — create expired SMS, push pending, bulk SMS
- [x] **Auto-block cron** — daily midnight, overdue rental blocking

**Natija:** Statistika, Telegram xabarnomalar, avtomatik blokirovka ishlaydi.

---

## Phase 7: Telegram Bot

**Maqsad:** grammyJS bot to'liq ishlaydi.

### 7.1 Bot Foundation
- [x] `bot/src/main.ts` — entry point
- [x] `bot/src/bot.ts` — Bot instance
- [x] `bot/src/config/` — bot config
- [x] `bot/src/api/client.ts` — HTTP client (JWT, timeout 10s, global error catch)
- [x] `bot/src/context/custom-context.ts` — extended context type
- [x] `bot/src/session/` — Redis-backed session
- [x] `bot/tsconfig.json`
- [x] `package.json` scripts: `start:bot`, `build:bot`

### 7.2 Middleware
- [x] `auth.middleware.ts` — load user from API, create if needed
- [x] `private-chat.middleware.ts` — filter private chats
- [x] `error-handler.middleware.ts` — catch errors, send "Uzr" message

### 7.3 API Clients
- [x] `books.api.ts`, `users.api.ts`, `rentals.api.ts`, `stats.api.ts`, `libraries.api.ts`

### 7.4 Composers
- [x] `start.composer.ts` — /start, /yordam
- [x] `search.composer.ts` — /qidirish
- [x] `rent-info.composer.ts` — /kitob
- [x] `stats.composer.ts` — /natija
- [x] `about.composer.ts` — /haqida
- [x] `few-books.composer.ts` — /zarur
- [x] `donation.composer.ts` — /hissa

### 7.5 Inline Search
- [x] `book-search.inline.ts` — kitob qidirish
- [x] `my-books.inline.ts` — my_0 (o'qiyotgan), my_1 (o'qigan)
- [x] Book detail (image, availability, "when free")

### 7.6 Conversations
- [x] `location.conversation.ts` — kutubxona tanlash (composer sifatida)
- [x] `profile.conversation.ts` — profil ko'rish (composer sifatida)

### 7.7 Utilities
- [x] Keyboards, formatters, pagination, member check
- [x] Library cache (in-memory)

**Natija:** Telegram bot to'liq ishlaydi — qidirish, profil, statistika, inline.

---

## Phase 8: Data Migration

**Maqsad:** Eski bazadan yangi tizimga ma'lumotlarni ko'chirish.

### 8.1 Migration Script
- [x] SQL migration script (SPEC.md Section 16 tartibida)
- [x] Step 1-15 ketma-ket bajarish
- [x] bcrypt password hashing
- [ ] Book image download → local (production da qilinadi)
- [x] Role mapping (boolean → roleId)
- [x] BookRule creation from old Book fields

### 8.2 Data Validation
- [x] Record count comparison (old vs new)
- [x] FK integrity check
- [ ] Critical query test (rental report, stats, search) — production da
- [ ] User login test (migrated passwords) — production da

### 8.3 Rollback Plan
- [x] Eski bazaning backup (pg_dump)
- [x] Rollback script (agar xatolik bo'lsa eskisiga qaytarish)

**Natija:** Barcha ma'lumotlar yangi tizimga ko'chirilgan, tekshirilgan.

---

## Phase 9: Deploy & Launch

**Maqsad:** Production'ga chiqarish.

### 9.1 Server Setup
- [x] Hetzner VPS — Node.js 24, PostgreSQL, Redis o'rnatish
- [x] PM2 ecosystem.config.js (api + bot)
- [ ] Nginx reverse proxy (optional, SSL) — serverda qilinadi
- [ ] Environment variables sozlash — serverda qilinadi

### 9.2 Deploy
- [x] Build + deploy script (deploy.sh)
- [ ] Eski app to'xtatish — serverda qilinadi
- [ ] Migration ishga tushirish — serverda qilinadi
- [ ] Yangi app + bot ishga tushirish — serverda qilinadi
- [ ] Health check, Swagger tekshirish — serverda qilinadi

### 9.3 Old Codebase Archival
- [ ] `mkdir _legacy && mv app/ index.js data.json nodemon.json firebase-service-account.json migrations/ _legacy/`
- [ ] `_legacy/` ni `.gitignore` ga qo'shish
- [ ] Commit: "archive old Express codebase to _legacy/"

### 9.4 Monitoring
- [ ] PM2 monitoring — serverda qilinadi
- [ ] Error loglar tekshirish — serverda qilinadi
- [ ] Bot ishlayotganini tasdiqlash — serverda qilinadi
- [ ] Cron joblar ishlayotganini tasdiqlash — serverda qilinadi

**Natija:** Yangi tizim production'da ishlayapti. Eski kod `_legacy/` da arxivlangan va gitignore qilingan.

---

## Qisqacha

| Faza | Nima | Taxminiy hajm |
| ---- | ---- | ------------- |
| 1 | Foundation (NestJS, Prisma, Auth, RBAC) | Eng katta — asos |
| 2 | Core Entities (Books, Users, Libraries, ...) | Katta — ko'p module |
| 3 | Stock & Rental (asosiy business logic) | O'rta — murakkab mantiq |
| 4 | Front-App (client API) | O'rta — mavjud servicelarni chaqirish |
| 5 | SMS, Gateway, Files | O'rta — tashqi integratsiyalar |
| 6 | Stats & Cron | O'rta — query + scheduler |
| 7 | Telegram Bot | Katta — alohida process |
| 8 | Data Migration | O'rta — bir martalik |
| 9 | Deploy & Launch | Kichik — ops |
