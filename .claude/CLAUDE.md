# Library App Backend

NestJS backend for library management system. TypeScript + Prisma ORM + PostgreSQL + Redis + Swagger.

> **IMPORTANT:** This project is being rebuilt from scratch. The old Express.js codebase is still in the repo root (`app/`, `index.js`). The new code will be in `src/` (NestJS API) and `bot/` (grammyJS Telegram bot).

Package manager: **pnpm** (never use npm)

Full specification: **SPEC.md** (the single source of truth for architecture, schema, endpoints, business logic)
Rarity system details: **RARITY_SYSTEM.md** (SQRT auto-detection, rarity levels, zarur blocking)

## Architecture

| Component | Location | Runtime |
|-----------|----------|---------|
| NestJS API | `src/` | Main process, port 3000 |
| Telegram Bot | `bot/` | Separate process, calls API via HTTP |
| SMS Gateway | Part of API | FCM push to Android devices |

- Bot NEVER imports from `src/modules/` — communicates only via HTTP
- Bot uses non-expiring JWT (type: "internal") for API calls
- All admin write operations logged via AuditLog interceptor

## Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Auth | `src/modules/auth/` | JWT signin (username/phone + password) |
| Users | `src/modules/users/` | Admin user CRUD |
| Roles | `src/modules/roles/` | RBAC — role + permissions management |
| Books | `src/modules/books/` | Book CRUD + searchable name |
| BookEditions | `src/modules/book-editions/` | Physical editions (pages, publisher, ISBN) |
| BookRules | `src/modules/book-rules/` | Per-library rental rules (price, duration, rarity) |
| Authors | `src/modules/authors/` | Author CRUD + searchable name |
| Collections | `src/modules/collections/` | Book categories |
| Publishers | `src/modules/publishers/` | Publisher CRUD |
| Stocks | `src/modules/stocks/` | Physical book copies + status |
| Rentals | `src/modules/rentals/` | Rental lifecycle (issue, return, reject) |
| Libraries | `src/modules/libraries/` | Library branches (was "locations") |
| Regions | `src/modules/regions/` | Geographic regions (self-referencing parent/child, replaces old regions+towns) |
| Addresses | `src/modules/addresses/` | Physical addresses |
| Passports | `src/modules/passports/` | User passport documents (1:N with User) |
| Comments | `src/modules/comments/` | Polymorphic comments (stock + rental) |
| Verification | `src/modules/verification/` | Phone SMS verification (Redis-backed) |
| SMS | `src/modules/sms/` | SMS management + bulk sending |
| Gateway | `src/modules/gateway/` | Android SMS gateway + Firebase FCM |
| Stats | `src/modules/stats/` | Statistics (Redis-cached) |
| AuditLog | `src/modules/audit-log/` | Admin operation audit trail |
| Files | `src/modules/files/` | Local file upload/serve |
| Notifications | `src/modules/notifications/` | Telegram channel/group notifications + cron jobs |
| Webhook | `src/modules/webhook/` | Eskiz SMS status callback |
| FrontApp | `src/modules/front-app/` | All client-facing APIs (books, account, stats, auth) |

## API Conventions

- Admin endpoints: `/api/v1/{resource}`
- Client endpoints: `/api/v1/app/{resource}`
- Webhook endpoints: `/api/v1/webhook/{provider}`
- Pagination: `?page=1&size=20` (1-based)
- Sorting: `?sort=createdAt&order=desc`
- Search: `?q=search+term`
- No deletion APIs — records are never deleted from DB

## Database

- ORM: Prisma
- Tables use snake_case (`book_rules`, `user_libraries`)
- Columns use camelCase in Prisma, mapped to snake_case in DB via `@map()`
- Soft deletes via `deletedAt` field
- See SPEC.md Section 6 for full schema with comments

## RBAC

- Permissions are numeric constants in `src/constants/permissions.ts`
- Roles store permissions as `Int[]` array
- Guard checks `@RequirePermissions(PERMISSIONS.CREATE_BOOKS)` decorator
- JWT contains only `sub` (user ID) and `type`

## Config

- NO `@nestjs/config` ConfigService
- Plain function `getConfig()` in `src/config/index.ts`
- All env vars declared there

## Key Business Rules

- **Rental strategy**: PER LIBRARY — max active rentals based on history at that library (5→max2, 12→max3, 25→max4, 40→max5)
- **Auto-blocking**: Daily cron (midnight) + on return — 70 days past issuedAt OR 10 days past dueDate
- **Working days**: dueDate skips weekends and holidays (per Library.schedule JSON)
- **Rarity system**: COMMON (SQRT auto-zarur), UNCOMMON (always zarur), RARE (verified+10 completed), RESTRICTED (verified+50 completed). See RARITY_SYSTEM.md
- **Cross-library users**: Passport check rate-limited (2/min), user linked via UserLibrary join table
- **searchableName**: Auto-generated on insert/update — cyrillic→latin, alphanumeric only
- **Client auth**: Phone + password (or passport series if no password set)
- **No deletion**: All APIs use soft delete or status changes. No DELETE endpoints.

## Environment Variables

DATABASE_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, PORT, JWT_SECRET, JWT_EXPIRATION, BOT_SERVICE_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_DEV_ID, TELEGRAM_ATTACHMENTS_CHANNEL_ID, TELEGRAM_MAIN_GROUP_CHAT_ID, TELEGRAM_MAIN_CHANNEL_CHAT_ID, TELEGRAM_DONATION_CHANNEL_CHAT_ID, TELEGRAM_MAIN_BOT_USERNAME, TELEGRAM_LIBRARY_GROUP_ID, ESKIZ_EMAIL, ESKIZ_PASSWORD, FIREBASE_SERVICE_ACCOUNT_PATH, UPLOAD_DIR, MAX_FILE_SIZE, GATEWAY_SMS_DAILY_LIMIT

---

> **Rules:** See `.claude/rules/`:
> - `coding-rules.md` — 25 general coding rules (docs, organization, NestJS, security, testing)
> - `file-structure.md` — module structure, naming conventions, directory layout
> - `api-patterns.md` — CRUD patterns, pagination, library scoping, Swagger, rate limiting
> - `prisma-rules.md` — schema conventions, query patterns, migrations, performance
> - `bot-rules.md` — bot architecture, error handling, session, text formatting
> - `workflow-rules.md` — autonomous work, scripting, type checking, DB, strict TypeScript
