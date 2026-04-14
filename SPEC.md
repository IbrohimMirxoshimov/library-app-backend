# Library Management System — Full Specification v2

> This document is the single source of truth for rebuilding the library management system from scratch.
> Every section includes references to the OLD codebase so migration context is clear.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Coding Rules & Conventions](#3-coding-rules--conventions)
4. [Project Structure](#4-project-structure)
5. [Configuration](#5-configuration)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Modules & Endpoints](#8-api-modules--endpoints)
9. [Core Business Logic](#9-core-business-logic)
10. [Telegram Bot](#10-telegram-bot)
11. [SMS System & Gateway](#11-sms-system--gateway)
12. [Cron Jobs](#12-cron-jobs)
13. [File Storage](#13-file-storage)
14. [Caching Strategy](#14-caching-strategy)
15. [Testing](#15-testing)
16. [Data Migration Plan](#16-data-migration-plan)
17. [Deployment](#17-deployment)
18. [Future Enhancements](#18-future-enhancements)

---

## 1. Project Overview

A comprehensive library management system for managing books, rentals, users, and multiple library branches.

### System Components

| Component | Description | Process |
| --------- | ----------- | ------- |
| **NestJS API** | REST API for admin panel and client apps | Main process (port 3000) |
| **Telegram Bot** | grammyJS bot for book search, stats, user interaction | Separate process, calls API via HTTP |
| **SMS Gateway** | Android-based SMS sending via Firebase FCM push | Part of API |

### Key Principles

- Permission-based access control (RBAC) with numeric constants
- Audit logging for all admin write operations
- API-first: bot communicates via HTTP to API, never directly to DB
- Swagger documentation for all endpoints
- E2E test coverage
- No deletion — records are never deleted from DB
- Generic, reusable patterns for CRUD, pagination, filtering
- Maintainable, well-commented code throughout
- Environment variable validation on startup — missing required vars = app won't start
- Graceful shutdown (close DB connections, finish in-flight requests)
- CORS configured for frontend origins

---

## 2. Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Runtime | Node.js 24 LTS |
| Framework | NestJS (latest) |
| ORM | Prisma (latest) |
| Database | PostgreSQL |
| Cache / Session | Redis |
| Queue | BullMQ (via @nestjs/bullmq) — only where clearly needed |
| Cron | @nestjs/schedule |
| Auth | JWT (@nestjs/jwt, passport-jwt) |
| Validation | class-validator, class-transformer |
| API Docs | Swagger (@nestjs/swagger) |
| Bot | grammyJS (separate process) |
| Push Notifications | Firebase Admin SDK (FCM) |
| File Storage | Local filesystem + NestJS ServeStaticModule |
| Package Manager | pnpm |
| Testing | Jest + Supertest (E2E) |

---

## 3. Coding Rules & Conventions

### 3.1 General

1. **Language**: Code, comments, docs, variable names — all in English. Communication with user in Uzbek.
2. **Package manager**: Always use `pnpm`. Never `npm`.
3. **Constants**: Centralize all constants in `src/constants/`. Never hardcode magic numbers or strings.
4. **No duplicate code**: Extract shared logic to common modules/utilities.
5. **NestJS patterns**: Modules → Controllers → Services → DTOs. Every endpoint has Swagger decorators.
6. **Prisma**: All DB operations via Prisma. Run `pnpm prisma generate` after schema changes.
7. **Comments**: Every database column, every non-trivial function, every business rule must have a comment explaining WHY, not just WHAT.
8. **CLAUDE.md**: Keep updated when adding features, endpoints, or changing architecture.

### 3.2 Code Style

- Use `class-validator` decorators for all DTOs
- Use `@ApiProperty()` on every DTO field for Swagger
- Group imports: Node.js → NestJS → Third-party → Local
- Prefer `const` over `let`, never use `var`
- Use TypeScript strict mode
- Prefer early returns over deeply nested conditionals
- One class per file, filename matches class name (kebab-case)

### 3.3 API Conventions

- All admin endpoints: `/api/v1/{resource}`
- All client (front-app) endpoints: `/api/v1/app/{resource}`
- Webhook endpoints: `/api/v1/webhook/{provider}`
- Use plural nouns for resources: `/books`, `/rentals`, `/users`
- Pagination: `?page=1&size=20` (1-based page)
- Sorting: `?sort=createdAt&order=desc`
- Search: `?q=search+term`
- Filtering: `?status=ACTIVE&libraryId=1`

### 3.4 Generic Patterns

All list endpoints MUST use a shared generic pagination/filter interface:

```typescript
// Shared interface for all list queries
interface PaginationQuery {
  page?: number;    // Default: 1
  size?: number;    // Default: 20, max: 100
  sort?: string;    // Column name
  order?: 'asc' | 'desc';
  q?: string;       // Search query
}

// Shared response format
interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### 3.5 Error Handling

- Use NestJS built-in exceptions: `BadRequestException`, `NotFoundException`, `ForbiddenException`
- Error messages should be user-friendly (in Uzbek where shown to end users)
- Never expose internal errors to clients

### 3.6 Logging

- Use NestJS built-in `Logger` class
- Log levels: `error`, `warn`, `log`, `debug`, `verbose`
- Production: only `error`, `warn`, `log`
- Development: all levels
- No request/response logging middleware — keep it simple
- Use `Logger` in services for business-critical operations (rent creation, user blocking, SMS sending)

---

## 4. Project Structure

```
library-app/
├── prisma/
│   ├── schema.prisma                          # Database schema with comments
│   ├── migrations/                            # Prisma migrations
│   └── seed.ts                                # Default roles, permissions, admin user
│
├── src/
│   ├── main.ts                                # App bootstrap
│   ├── app.module.ts                          # Root module
│   │
│   ├── config/
│   │   └── index.ts                           # Plain config function (NO ConfigService)
│   │
│   ├── constants/
│   │   ├── permissions.ts                     # Permission numeric constants
│   │   └── rental.ts                          # Rental strategy constants (max active limits)
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts      # @CurrentUser() extracts user from JWT
│   │   │   ├── permissions.decorator.ts       # @RequirePermissions(PERM.CREATE_BOOKS)
│   │   │   └── public.decorator.ts            # @Public() skips auth guard
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts              # JWT verification guard
│   │   │   └── permissions.guard.ts           # Checks user role permissions
│   │   ├── interceptors/
│   │   │   ├── audit-log.interceptor.ts       # Logs admin write operations
│   │   │   └── transform.interceptor.ts       # Wraps responses in standard format
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts       # Global exception filter
│   │   ├── dto/
│   │   │   ├── pagination-query.dto.ts        # Shared pagination DTO
│   │   │   └── paginated-response.dto.ts      # Shared paginated response
│   │   ├── interfaces/
│   │   │   └── request-user.interface.ts      # JWT payload type
│   │   ├── services/
│   │   │   └── base-crud.service.ts           # Generic CRUD service base
│   │   └── utils/
│   │       ├── string.utils.ts                # cyrillic2latin, searchable name generator
│   │       ├── date.utils.ts                  # Working days, date ranges
│   │       └── phone.utils.ts                 # Phone normalization (+998 removal)
│   │
│   ├── modules/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts              # Prisma client wrapper
│   │   │
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts               # Redis client wrapper
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts             # POST /signin only
│   │   │   ├── auth.service.ts                # Login, token generation
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts            # JWT strategy (extracts user)
│   │   │   └── dto/
│   │   │       └── signin.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts            # Admin user CRUD
│   │   │   ├── users.service.ts               # User business logic
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       ├── update-user.dto.ts
│   │   │       └── query-user.dto.ts
│   │   │
│   │   ├── roles/
│   │   │   ├── roles.module.ts
│   │   │   ├── roles.controller.ts            # Role CRUD
│   │   │   ├── roles.service.ts               # Role + permission management
│   │   │   └── dto/
│   │   │       ├── create-role.dto.ts
│   │   │       └── update-role.dto.ts
│   │   │
│   │   ├── books/
│   │   │   ├── books.module.ts
│   │   │   ├── books.controller.ts            # Admin book CRUD
│   │   │   ├── books.service.ts
│   │   │   └── dto/
│   │   │       ├── create-book.dto.ts
│   │   │       ├── update-book.dto.ts
│   │   │       └── query-book.dto.ts
│   │   │
│   │   ├── book-editions/
│   │   │   ├── book-editions.module.ts
│   │   │   ├── book-editions.controller.ts
│   │   │   ├── book-editions.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── book-rules/
│   │   │   ├── book-rules.module.ts
│   │   │   ├── book-rules.controller.ts
│   │   │   ├── book-rules.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── authors/
│   │   │   ├── authors.module.ts
│   │   │   ├── authors.controller.ts
│   │   │   ├── authors.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── collections/
│   │   │   ├── collections.module.ts
│   │   │   ├── collections.controller.ts
│   │   │   ├── collections.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── publishers/
│   │   │   ├── publishers.module.ts
│   │   │   ├── publishers.controller.ts
│   │   │   ├── publishers.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── stocks/
│   │   │   ├── stocks.module.ts
│   │   │   ├── stocks.controller.ts
│   │   │   ├── stocks.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── rentals/
│   │   │   ├── rentals.module.ts
│   │   │   ├── rentals.controller.ts
│   │   │   ├── rentals.service.ts             # Core rental business logic
│   │   │   └── dto/
│   │   │       ├── create-rental.dto.ts
│   │   │       ├── return-rental.dto.ts
│   │   │       ├── reject-rental.dto.ts
│   │   │       └── query-rental.dto.ts
│   │   │
│   │   ├── libraries/
│   │   │   ├── libraries.module.ts
│   │   │   ├── libraries.controller.ts
│   │   │   ├── libraries.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── regions/
│   │   │   ├── regions.module.ts
│   │   │   ├── regions.controller.ts
│   │   │   ├── regions.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── addresses/
│   │   │   ├── addresses.module.ts
│   │   │   └── addresses.service.ts
│   │   │
│   │   ├── passports/
│   │   │   ├── passports.module.ts
│   │   │   ├── passports.controller.ts
│   │   │   ├── passports.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── comments/
│   │   │   ├── comments.module.ts
│   │   │   ├── comments.service.ts            # Polymorphic comments for stock & rental
│   │   │   └── dto/
│   │   │
│   │   ├── verification/
│   │   │   ├── verification.module.ts
│   │   │   ├── verification.controller.ts
│   │   │   ├── verification.service.ts        # Redis-based code storage
│   │   │   └── dto/
│   │   │
│   │   ├── sms/
│   │   │   ├── sms.module.ts
│   │   │   ├── sms.controller.ts
│   │   │   ├── sms.service.ts
│   │   │   ├── sms-bulk.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── gateway/
│   │   │   ├── gateway.module.ts
│   │   │   ├── gateway.controller.ts
│   │   │   ├── gateway.service.ts
│   │   │   ├── firebase.service.ts            # FCM push notifications
│   │   │   └── dto/
│   │   │
│   │   ├── stats/
│   │   │   ├── stats.module.ts
│   │   │   ├── stats.controller.ts            # Admin stats
│   │   │   └── stats.service.ts               # Redis-cached, optimized queries
│   │   │
│   │   ├── audit-log/
│   │   │   ├── audit-log.module.ts
│   │   │   ├── audit-log.controller.ts        # View logs (admin only)
│   │   │   └── audit-log.service.ts
│   │   │
│   │   ├── files/
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts            # Upload endpoints
│   │   │   └── files.service.ts               # Local file operations
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── telegram-notification.service.ts  # Send to Telegram channels
│   │   │   └── cron/
│   │   │       ├── group-notifications.cron.ts
│   │   │       ├── channel-notifications.cron.ts
│   │   │       ├── donation-notifications.cron.ts
│   │   │       └── sms-notifications.cron.ts
│   │   │
│   │   ├── webhook/
│   │   │   ├── webhook.module.ts
│   │   │   └── webhook.controller.ts          # Eskiz SMS status callback
│   │   │
│   │   └── front-app/
│   │       ├── front-app.module.ts            # All client-facing APIs
│   │       ├── controllers/
│   │       │   ├── front-books.controller.ts      # Browse, search, filter books
│   │       │   ├── front-stats.controller.ts      # Public statistics
│   │       │   ├── front-account.controller.ts    # User profile, my books
│   │       │   ├── front-collections.controller.ts
│   │       │   ├── front-libraries.controller.ts  # Library list for selection
│   │       │   ├── front-auth.controller.ts       # Client signin
│   │       │   ├── front-rental-info.controller.ts # Expired rent check by phone
│   │       │   └── front-user.controller.ts       # Telegram user lookup
│   │       ├── services/
│   │       │   ├── front-books.service.ts
│   │       │   ├── front-account.service.ts
│   │       │   └── front-stats.service.ts
│   │       └── dto/
│
├── bot/                                        # SEPARATE PROCESS — never imports from src/modules
│   ├── src/
│   │   ├── main.ts                            # Bot entry point
│   │   ├── bot.ts                             # grammyJS Bot instance
│   │   ├── config/
│   │   │   └── index.ts                       # Bot config
│   │   ├── api/
│   │   │   ├── client.ts                      # HTTP client with JWT token
│   │   │   ├── books.api.ts                   # API calls for books
│   │   │   ├── users.api.ts                   # API calls for users
│   │   │   ├── rentals.api.ts                 # API calls for rentals
│   │   │   ├── stats.api.ts                   # API calls for stats
│   │   │   └── libraries.api.ts               # API calls for libraries
│   │   ├── context/
│   │   │   └── custom-context.ts              # Extended grammyJS context type
│   │   ├── session/
│   │   │   ├── session.ts                     # Redis-backed session setup
│   │   │   └── session.interface.ts           # Session data type
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts             # Load/create user from API
│   │   │   ├── private-chat.middleware.ts     # Only process private chats
│   │   │   └── error-handler.middleware.ts    # Catch and log bot errors
│   │   ├── composers/
│   │   │   ├── index.ts                       # Root composer
│   │   │   ├── start.composer.ts              # /start, /yordam
│   │   │   ├── search.composer.ts             # /qidirish
│   │   │   ├── rent-info.composer.ts          # /kitob
│   │   │   ├── stats.composer.ts              # /natija
│   │   │   ├── about.composer.ts              # /haqida
│   │   │   ├── few-books.composer.ts          # /zarur
│   │   │   └── donation.composer.ts           # /hissa
│   │   ├── conversations/
│   │   │   ├── location.conversation.ts       # Library selection multi-step
│   │   │   └── profile.conversation.ts        # Profile view
│   │   ├── inline/
│   │   │   ├── book-search.inline.ts          # Inline book search
│   │   │   └── my-books.inline.ts             # User's books inline query
│   │   ├── keyboards/
│   │   │   ├── main-menu.keyboard.ts
│   │   │   ├── book-detail.keyboard.ts
│   │   │   └── common.keyboard.ts
│   │   ├── utils/
│   │   │   ├── format.utils.ts                # Text formatting helpers
│   │   │   ├── pagination.utils.ts            # Telegram message pagination
│   │   │   └── member-check.utils.ts          # Channel membership check
│   │   └── cache/
│   │       └── library.cache.ts               # In-memory library list
│   └── tsconfig.json
│
├── uploads/                                    # Local file storage (gitignored)
│   ├── books/
│   └── passports/
│
├── test/
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts
│   │   ├── books.e2e-spec.ts
│   │   ├── rentals.e2e-spec.ts
│   │   ├── users.e2e-spec.ts
│   │   ├── stocks.e2e-spec.ts
│   │   └── setup.ts                           # Test DB setup & teardown
│   └── jest-e2e.json
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
└── CLAUDE.md
```

---

## 5. Configuration

**NO `@nestjs/config` ConfigService.** Use a plain function:

```typescript
// src/config/index.ts

import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Returns all app configuration from environment variables.
 * Called once at startup and imported where needed.
 */
export function getConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // Redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRATION || '12d',
    },

    // Bot service token (non-expiring, used by bot to call API)
    botServiceToken: process.env.BOT_SERVICE_TOKEN!,

    // Telegram
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      devId: process.env.TELEGRAM_DEV_ID!,
      attachmentsChannelId: process.env.TELEGRAM_ATTACHMENTS_CHANNEL_ID!,
      mainGroupChatId: process.env.TELEGRAM_MAIN_GROUP_CHAT_ID!,
      mainChannelChatId: process.env.TELEGRAM_MAIN_CHANNEL_CHAT_ID!,
      donationChannelChatId: process.env.TELEGRAM_DONATION_CHANNEL_CHAT_ID!,
      mainBotUsername: process.env.TELEGRAM_MAIN_BOT_USERNAME!,
      libraryGroupId: process.env.TELEGRAM_LIBRARY_GROUP_ID!,
    },

    // SMS - Eskiz
    eskiz: {
      email: process.env.ESKIZ_EMAIL!,
      password: process.env.ESKIZ_PASSWORD!,
    },

    // Firebase
    firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json',

    // File uploads
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB

    // Gateway
    gatewaySmsDaily: parseInt(process.env.GATEWAY_SMS_DAILY_LIMIT || '220', 10),
  } as const;
}

export type AppConfig = ReturnType<typeof getConfig>;

/**
 * Validates that all required environment variables are present.
 * Called once at app startup in main.ts.
 * Throws and prevents app from starting if any required var is missing.
 */
export function validateConfig(config: AppConfig): void {
  const required: (keyof AppConfig)[] = [
    'databaseUrl', 'botServiceToken',
  ];
  // Also validate nested: config.jwt.secret, config.telegram.botToken, etc.
  // Throw descriptive error listing all missing vars at once.
}
```

### CORS Configuration

```typescript
// In main.ts
app.enableCors({
  origin: getConfig().appOrigin, // Frontend URL
  credentials: true,
});
```

### Graceful Shutdown

```typescript
// In main.ts
app.enableShutdownHooks(); // NestJS built-in — calls onModuleDestroy() lifecycle hooks
// PrismaService implements onModuleDestroy to disconnect
// Redis module implements onModuleDestroy to quit connection
```

---

## 6. Database Schema

### 6.1 Full Prisma Schema

> Every column has a comment explaining its purpose.
> References to OLD codebase noted where applicable.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================
// ENUMS
// =============================================

/// User gender
enum Gender {
  MALE
  FEMALE
}

/// User account status
enum UserStatus {
  ACTIVE   // Can use the system normally
  BLOCKED  // Cannot rent books (auto or manual)
}

/// Stock physical condition/status
enum StockStatus {
  ACTIVE     // Available for rental
  INACTIVE   // Temporarily unavailable
  BANNED     // Prohibited from circulation
  REPAIRING  // Sent for repair
  LOST       // Missing/unaccounted for
  STOLEN     // Confirmed stolen
  DAMAGED    // Physically damaged, not usable
}

/// SMS delivery status
enum SmsStatus {
  DRAFT      // Created, not yet sent
  PENDING    // Queued for sending
  SENT       // Sent to provider/device
  DELIVERED  // Confirmed delivered
  ERROR      // Failed to deliver
}

/// SMS provider/channel
enum SmsProvider {
  PLAY_MOBILE  // PlayMobile API
  ESKIZ        // Eskiz API
  MANUAL       // Manually recorded
  GATEWAY      // Android device gateway via FCM
}

/// Book language
enum BookLanguage {
  UZ  // O'zbek (lotin)
  OZ  // O'zbek (kirill)
  RU  // Rus
  EN  // Ingliz
  AR  // Arab
}

/// Book rarity level — determines rental eligibility rules
enum BookRarity {
  COMMON      // Oddiy — anyone can rent
  UNCOMMON    // Kam tarqalgan — verified users preferred
  RARE        // Noyob — strict conditions apply
  RESTRICTED  // Cheklangan — special permission required
}

// CommentEntityType enum removed — using direct FK relations instead

// =============================================
// AUTH & RBAC
// =============================================

/// System user — both library members (readers) and staff
/// OLD: app/database/models/User.js
model User {
  id             Int        @id @default(autoincrement())

  /// First name (capitalized on save)
  firstName      String
  /// Last name (capitalized on save)
  lastName       String
  /// Login username (optional, for admin panel login)
  /// OLD: username field, used in auth.SignIn
  username       String?    @unique
  /// Primary phone number (9 digits without +998 prefix)
  /// OLD: phone field in users table
  phone          String?
  /// Additional phone numbers (relatives, emergency contacts)
  /// OLD: extraPhone, extraPhone2 — now unlimited array
  extraPhones    String[]   @default([])
  /// User gender for statistics and filtering
  gender         Gender?
  /// Date of birth
  birthDate      DateTime?
  /// Hashed password for admin panel login
  /// OLD: stored as plain text — MUST hash in new system
  password       String?
  /// Whether user's identity has been verified by librarian
  /// OLD: verified field
  verified       Boolean    @default(false)
  /// Whether primary phone number is confirmed via SMS code
  /// OLD: phoneVerified field
  phoneVerified  Boolean    @default(false)
  /// Account status — ACTIVE or BLOCKED
  /// OLD: status (1=active, 0=blocked) — now enum
  status         UserStatus @default(ACTIVE)
  /// User's monetary balance (in so'm)
  /// OLD: balance field
  balance        Int        @default(0)
  /// Reason why user was blocked (set when status=BLOCKED)
  /// OLD: blockingReason field
  blockingReason String?
  /// Telegram user ID for bot integration
  /// OLD: telegramId field
  telegramId     String?    @unique
  /// Arbitrary extra data (JSON)
  extra          Json?

  /// Role determines permissions — null means regular reader with no admin access
  /// OLD: owner/moderator/librarian boolean fields → now single roleId
  roleId         Int?
  role           Role?      @relation(fields: [roleId], references: [id])

  /// For ADMIN users: the single library they manage
  /// Regular readers use UserLibrary join table instead
  /// OLD: libraryId (was locationId)
  adminLibraryId Int?
  adminLibrary   Library?   @relation("AdminLibrary", fields: [adminLibraryId], references: [id])

  /// User's physical address
  /// OLD: addressId
  addressId      Int?
  address        Address?   @relation(fields: [addressId], references: [id])

  /// Who created this user record
  /// OLD: creatorId
  creatorId      Int?
  creator        User?      @relation("UserCreator", fields: [creatorId], references: [id])
  createdUsers   User[]     @relation("UserCreator")

  // === Reverse relations ===
  passports      Passport[]
  libraries      UserLibrary[]    // Libraries this reader belongs to
  rentalsAsReader Rental[]        @relation("RentalReader")
  rentalsIssued  Rental[]         @relation("RentalIssuer")
  rentalsReturned Rental[]        @relation("RentalReturner")
  devices        Device[]
  smsMessages    Sms[]
  smsBulks       SmsBulk[]
  createdBooks   Book[]           @relation("BookCreator")
  createdAuthors Author[]         @relation("AuthorCreator")
  comments       Comment[]        @relation("CommentAuthor")
  auditLogs      AuditLog[]

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  deletedAt      DateTime?  // Soft delete — never actually delete

  @@index([phone])
  @@index([telegramId])
  @@index([adminLibraryId])
  @@map("users")
}

/// Join table: which readers belong to which libraries
/// A reader can be member of multiple libraries.
/// An admin user does NOT use this — they use adminLibraryId instead.
model UserLibrary {
  id        Int      @id @default(autoincrement())

  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  libraryId Int
  library   Library  @relation(fields: [libraryId], references: [id])

  /// When the reader was added to this library
  joinedAt  DateTime @default(now())

  @@unique([userId, libraryId])
  @@map("user_libraries")
}

/// RBAC Role — groups permissions together
/// OLD: owner/moderator/librarian booleans on User
model Role {
  id          Int     @id @default(autoincrement())
  /// Human-readable role name (e.g. "owner", "moderator", "librarian")
  name        String  @unique
  /// Optional description of what this role is for
  description String?
  /// Array of permission numeric values from PERMISSIONS constant
  /// Stored as integer array, checked by PermissionsGuard
  permissions Int[]   @default([])

  users       User[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("roles")
}

// =============================================
// PASSPORT — separate from User, 1:N
// =============================================

/// User's passport/ID document information
/// OLD: passportId, pinfl, passportImage fields on User table
/// Now separate table because one user can have multiple passport records
model Passport {
  id         Int      @id @default(autoincrement())
  /// Passport series and number (e.g. "AA1234567")
  /// OLD: passportId on users table
  passportId String   @unique
  /// Personal identification number
  /// OLD: pinfl on users table
  pinfl      String?  @unique
  /// Local file path to passport image/scan
  /// OLD: passportImage — was Telegram channel link, now local file
  image      String?
  /// Whether this is the currently active passport
  isActive   Boolean  @default(true)

  userId     Int
  user       User     @relation(fields: [userId], references: [id])

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@map("passports")
}

// =============================================
// LIBRARY (was "location" in old system)
// =============================================

/// A library branch/location
/// OLD: app/database/models/Location.js — renamed from "location" to "library"
model Library {
  id          Int      @id @default(autoincrement())
  /// Library branch name (e.g. "Mehr kutubxonasi — Chilonzor")
  name        String   @unique
  /// External link (website, social media)
  link        String?
  /// Whether this library is currently operating
  active      Boolean  @default(true)
  /// Additional info about the library
  description String?

  /// Working schedule configuration (JSON)
  /// TypeScript interface (used with typed-json Prisma pattern):
  ///   interface LibrarySchedule {
  ///     weekends: string[];        // Day names: ["friday", "sunday"]
  ///     holidays: string[];        // ISO dates: ["2026-01-01", "2026-03-08", "2026-03-21"]
  ///   }
  /// Example: { "weekends": ["friday", "sunday"], "holidays": ["2026-01-01", "2026-03-21"] }
  /// Used for dueDate calculation — skips weekends and holidays.
  /// OLD: was hardcoded in app/utils/helpers.js (getLibraryHolidays, getReturningDateIfIsNotWorkingDay)
  /// NOTE: Use a TypeScript interface + validator in code. If Prisma doesn't support
  /// typed JSON natively, use /// [[[LibrarySchedule]]] pattern or runtime validation.
  schedule    Json?

  /// Physical address
  addressId   Int?     @unique
  address     Address? @relation(fields: [addressId], references: [id])

  // === Reverse relations ===
  adminUsers  User[]       @relation("AdminLibrary")
  members     UserLibrary[]
  stocks      Stock[]
  rentals     Rental[]
  devices     Device[]
  bookRules   BookRule[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@map("libraries")
}

// =============================================
// ADDRESS & REGIONS
// =============================================

/// Physical address
/// OLD: app/database/models/Address.js
model Address {
  id          Int      @id @default(autoincrement())
  /// ISO country code
  countryCode String   @default("uz")
  /// Full address text
  addressLine String?
  /// Street name
  street      String?
  /// House/building number
  home        String?
  /// GPS latitude
  latitude    Float?
  /// GPS longitude
  longitude   Float?

  /// Region this address belongs to (e.g. "Toshkent shahri")
  regionId    Int?
  region      Region?  @relation(fields: [regionId], references: [id])

  // === Reverse relations ===
  users       User[]
  library     Library?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("addresses")
}

/// Geographic region with self-referencing parent/child hierarchy
/// OLD: app/database/models/Region.js + app/database/models/Town.js
/// Towns are now child regions (parentId points to parent region)
model Region {
  id        Int      @id @default(autoincrement())
  /// Region or town/district name
  name      String   @unique
  /// Parent region ID — null means top-level region
  /// Towns/districts reference their parent region here
  /// OLD: Town had regionId — now unified in one table
  parentId  Int?
  parent    Region?  @relation("RegionHierarchy", fields: [parentId], references: [id])
  children  Region[] @relation("RegionHierarchy")

  addresses Address[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@map("regions")
}

// =============================================
// BOOKS
// =============================================

/// A book title (not a physical copy — that's Stock)
/// OLD: app/database/models/Book.js
model Book {
  id             Int           @id @default(autoincrement())
  /// Book title — NOT unique (different books can share names)
  /// Duplicate check done manually via searchableName in service layer
  /// OLD: name field (was @unique)
  name           String
  /// Book description/summary
  description    String?
  /// Cover images (local file paths)
  /// OLD: image (single URL) — now array of local paths
  images         String[]      @default([])
  /// ISBN code (also stored on editions)
  isbn           String?
  /// Book language
  /// OLD: language (string "uz") — now enum
  language       BookLanguage  @default(UZ)
  /// Searchable name — auto-generated from name + author names
  /// Cyrillic → Latin, only alphanumeric, x/h → h
  /// Used for fast search with index
  /// OLD: search was done via SQL LOWER + LIKE on name
  searchableName String?
  /// Sort order for display
  /// OLD: sort field
  sort           Int           @default(0)
  /// Tags for categorization (free-form strings)
  tags           String[]      @default([])

  /// Collection this book belongs to (e.g. "Badiiy adabiyot")
  /// OLD: collectionId
  collectionId   Int?
  collection     Collection?   @relation(fields: [collectionId], references: [id])
  /// Who added this book to the system
  /// OLD: creatorId
  creatorId      Int?
  creator        User?         @relation("BookCreator", fields: [creatorId], references: [id])

  // === Many-to-many with authors ===
  authors        BookAuthor[]
  // === Physical editions of this book ===
  editions       BookEdition[]
  // === Physical copies ===
  stocks         Stock[]
  // === Library-specific rules ===
  rules          BookRule[]

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  // TODO: Add pg_trgm GIN index on searchableName for fast partial text search
  // For now, basic B-tree index. Will add trigram index when performance requires it.
  @@index([searchableName])
  @@map("books")
}

/// Join table: Book ↔ Author (many-to-many)
/// OLD: Book had single authorId — now supports multiple authors
model BookAuthor {
  id       Int    @id @default(autoincrement())

  bookId   Int
  book     Book   @relation(fields: [bookId], references: [id])
  authorId Int
  author   Author @relation(fields: [authorId], references: [id])

  /// Author's role for this book (e.g. "author", "translator", "editor")
  role     String @default("author")

  @@unique([bookId, authorId])
  @@map("book_authors")
}

/// A specific edition/print run of a book
/// OLD: pages, printedAt, isbn were on Book table directly
/// Now separate to support multiple editions of the same title
model BookEdition {
  id             Int        @id @default(autoincrement())
  /// Number of pages in this edition
  /// OLD: pages on books table
  pages          Int?
  /// Publication/print date
  /// OLD: printedAt on books table
  printedAt      DateTime?
  /// ISBN for this specific edition
  isbn           String?
  /// Edition/print run number (e.g. "2-nashr", "3rd edition")
  editionNumber  String?
  /// Cover/content images for this edition
  images         String[]   @default([])

  /// Which book title this is an edition of
  bookId         Int
  book           Book       @relation(fields: [bookId], references: [id])
  /// Publisher of this edition
  /// OLD: publishingId on books table (was called "publishing")
  publisherId    Int?
  publisher      Publisher? @relation(fields: [publisherId], references: [id])

  stocks         Stock[]

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  deletedAt      DateTime?

  @@map("book_editions")
}

/// Library-specific rules for a book — price, rental duration, rarity
/// NEW: did not exist in old system
/// OLD logic was: Book.rentDuration (global), Book.price (global), Book.few (global threshold)
/// Now each library can have different rules for the same book
model BookRule {
  id           Int        @id @default(autoincrement())
  /// Rental price in so'm for this book at this library
  /// OLD: Book.price (was global 50000 default)
  price        Int        @default(50000)
  /// Max rental duration in days
  /// OLD: Book.rentDuration (was global 15 default)
  rentDuration Int        @default(15)
  /// How rare/valuable this book is — affects who can rent it
  /// OLD: Book.few field (threshold number) → now explicit rarity level
  rarity       BookRarity @default(COMMON)

  bookId       Int
  book         Book       @relation(fields: [bookId], references: [id])
  libraryId    Int
  library      Library    @relation(fields: [libraryId], references: [id])

  stocks       Stock[]

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([bookId, libraryId])
  @@map("book_rules")
}

/// Book author
/// OLD: app/database/models/Author.js
model Author {
  id             Int          @id @default(autoincrement())
  /// Author's full name
  name           String
  /// Searchable name — same logic as Book.searchableName
  searchableName String?
  /// Author photo/images
  images         String[]     @default([])

  creatorId      Int?
  creator        User?        @relation("AuthorCreator", fields: [creatorId], references: [id])

  books          BookAuthor[]

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  @@index([searchableName])
  @@map("authors")
}

/// Book collection/category
/// OLD: app/database/models/Collection.js
model Collection {
  id        Int      @id @default(autoincrement())
  /// Collection name (e.g. "Badiiy adabiyot", "Ilmiy")
  name      String   @unique
  /// Display order
  sort      Int      @default(0)

  books     Book[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@map("collections")
}

/// Book publisher
/// OLD: app/database/models/Publishing.js — renamed to "Publisher"
model Publisher {
  id        Int           @id @default(autoincrement())
  /// Publisher name
  name      String        @unique
  /// Publisher logo
  image     String?

  editions  BookEdition[]

  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  deletedAt DateTime?

  @@map("publishers")
}

// =============================================
// STOCK & RENTAL
// =============================================

/// A physical copy of a book at a specific library
/// OLD: app/database/models/Stock.js
model Stock {
  id            Int         @id @default(autoincrement())
  /// Whether this copy is currently rented out
  /// OLD: busy field
  busy          Boolean     @default(false)
  /// Physical condition/availability status
  /// OLD: did not exist — stocks were just soft-deleted
  status        StockStatus @default(ACTIVE)

  /// Which book title this is a copy of
  bookId        Int
  book          Book        @relation(fields: [bookId], references: [id])
  /// Which specific edition (optional — may not be tracked)
  bookEditionId Int?
  bookEdition   BookEdition? @relation(fields: [bookEditionId], references: [id])
  /// Library-specific rules that apply to this copy
  /// Auto-selected based on book + library when stock is created
  bookRuleId    Int?
  bookRule      BookRule?   @relation(fields: [bookRuleId], references: [id])
  /// Which library holds this copy
  /// OLD: locationId
  libraryId     Int
  library       Library     @relation(fields: [libraryId], references: [id])

  rentals       Rental[]
  comments      Comment[]   @relation("StockComments")

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?   // Never actually deleted, use status instead

  @@index([libraryId, busy])
  @@index([bookId])
  @@index([libraryId, bookId])
  @@map("stocks")
}

/// A book rental transaction
/// OLD: app/database/models/Rent.js — renamed from "rent" to "rentals"
model Rental {
  id           Int       @id @default(autoincrement())
  /// When the book was issued to the reader
  /// OLD: leasedAt
  issuedAt     DateTime
  /// When the book is due to be returned
  /// OLD: returningDate
  dueDate      DateTime
  /// When the book was actually returned (null = still out)
  /// OLD: returnedAt
  returnedAt   DateTime?
  /// Manual reference ID (can be alphanumeric)
  /// OLD: customId (was Int)
  referenceId  String?
  /// Whether this rental was rejected/cancelled
  /// OLD: rejected field
  rejected     Boolean   @default(false)
  /// Optional note (e.g. "kitob shikastlangan", reject reason)
  /// NEW field
  note         String?

  /// The reader who borrowed the book
  /// OLD: userId
  readerId     Int
  reader       User      @relation("RentalReader", fields: [readerId], references: [id])
  /// Which physical copy was rented
  stockId      Int
  stock        Stock     @relation(fields: [stockId], references: [id])
  /// Which library this rental belongs to
  /// OLD: locationId
  libraryId    Int
  library      Library   @relation(fields: [libraryId], references: [id])
  /// Librarian who issued the book
  /// NEW field
  issuedById   Int
  issuedBy     User      @relation("RentalIssuer", fields: [issuedById], references: [id])
  /// Librarian who accepted the return (null until returned)
  /// NEW field
  returnedById Int?
  returnedBy   User?     @relation("RentalReturner", fields: [returnedById], references: [id])

  comments     Comment[] @relation("RentalComments")

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  @@index([readerId])
  @@index([libraryId])
  @@index([dueDate])
  @@map("rentals")
}

// =============================================
// COMMENT — polymorphic, for Stock and Rental
// =============================================

/// Comment/note attached to a stock item or rental
/// OLD: app/database/models/Comment.js — was only for rent
/// Now supports both Stock and Rental via nullable FKs (exactly one must be set)
model Comment {
  id         Int       @id @default(autoincrement())
  /// Comment text
  text       String

  /// FK to stock (null if this comment is for a rental)
  stockId    Int?
  stock      Stock?    @relation("StockComments", fields: [stockId], references: [id])
  /// FK to rental (null if this comment is for a stock)
  rentalId   Int?
  rental     Rental?   @relation("RentalComments", fields: [rentalId], references: [id])

  /// Who wrote this comment — FK to User
  authorId   Int?
  author     User?     @relation("CommentAuthor", fields: [authorId], references: [id])

  createdAt  DateTime  @default(now())

  @@index([stockId])
  @@index([rentalId])
  @@map("comments")
}

// =============================================
// SMS SYSTEM
// =============================================

/// Individual SMS message record
/// OLD: app/database/models/Sms.js
model Sms {
  id                Int         @id @default(autoincrement())
  /// Recipient phone number (9 digits)
  phone             String
  /// SMS text content
  text              String?
  /// Current delivery status
  /// OLD: status (string) — now enum
  status            SmsStatus   @default(DRAFT)
  /// Error description if delivery failed
  /// OLD: error_reason
  errorReason       String?
  /// Which provider sent this SMS
  /// OLD: provider (number 1-4) — now enum
  provider          SmsProvider?
  /// Provider's message ID for tracking
  /// OLD: provider_message_id
  providerMessageId String?
  /// When the SMS was received (for incoming SMS via gateway)
  receivedAt        DateTime?

  /// User this SMS is related to
  userId            Int?
  user              User?       @relation(fields: [userId], references: [id])
  /// Bulk send batch this SMS belongs to
  smsBulkId         Int?
  smsBulk           SmsBulk?    @relation(fields: [smsBulkId], references: [id])
  /// Device that sent/will send this SMS
  deviceId          Int?
  device            Device?     @relation(fields: [deviceId], references: [id])

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([userId, phone, updatedAt])
  @@index([userId, updatedAt])
  @@map("sms")
}

/// Bulk SMS sending batch
/// OLD: app/database/models/SmsBulk.js
model SmsBulk {
  id        Int      @id @default(autoincrement())
  /// Template text for this batch
  text      String

  userId    Int
  user      User     @relation(fields: [userId], references: [id])

  messages  Sms[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@map("sms_bulks")
}

// =============================================
// DEVICE (SMS GATEWAY)
// =============================================

/// Android device registered for SMS gateway
/// OLD: app/database/models/Device.js
model Device {
  id        Int      @id @default(autoincrement())
  /// Device brand (e.g. "Samsung")
  brand     String?
  /// Device model (e.g. "Galaxy S21")
  model     String?
  /// Android build ID
  buildId   String?
  /// Firebase Cloud Messaging token for push notifications
  fcmToken  String
  /// Whether this device is active for SMS sending
  enabled   Boolean  @default(true)

  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  libraryId Int?
  library   Library? @relation(fields: [libraryId], references: [id])

  smsMessages Sms[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@map("devices")
}

// =============================================
// AUDIT LOG
// =============================================

/// Tracks all admin write operations for accountability
/// OLD: did not exist — comments table partially served this purpose
model AuditLog {
  id         Int      @id @default(autoincrement())
  /// What operation was performed (CREATE, UPDATE, DELETE)
  action     String
  /// Which table/entity was affected (e.g. "books", "rentals")
  resource   String
  /// ID of the affected record
  resourceId Int
  /// State before the change (null for CREATE)
  oldData    Json?
  /// State after the change (null for DELETE)
  newData    Json?
  /// Client IP address
  ip         String?
  /// Client user agent string
  userAgent  String?

  /// Who performed the action
  userId     Int
  user       User     @relation(fields: [userId], references: [id])

  createdAt  DateTime @default(now())

  @@index([resource, resourceId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 6.2 Column Rename Mapping (Old → New)

| Old Table | Old Column | New Table | New Column | Notes |
| --------- | ---------- | --------- | ---------- | ----- |
| `users` | `owner` (bool) | `users` | `roleId` (FK) | Map to "owner" role |
| `users` | `moderator` (bool) | `users` | `roleId` (FK) | Map to "moderator" role |
| `users` | `librarian` (bool) | `users` | `roleId` (FK) | Map to "librarian" role |
| `users` | `locationId` | `users` | `adminLibraryId` | Only for admin users |
| `users` | `libraryId` | — | — | Removed, use UserLibrary |
| `users` | `passportId` | `passports` | `passportId` | Moved to separate table |
| `users` | `passportImage` | `passports` | `image` | Moved to separate table |
| `users` | `pinfl` | `passports` | `pinfl` | Moved to separate table |
| `users` | `fullName` | — | — | Removed, computed when needed |
| `users` | `extraPhone` | `users` | `extraPhones[0]` | Merged into array |
| `users` | `extraPhone2` | `users` | `extraPhones[1]` | Merged into array |
| `users` | `tempLocationId` | — | — | Removed, use bot session |
| `users` | `status` (0/1) | `users` | `status` (enum) | ACTIVE/BLOCKED |
| `location` | * | `libraries` | * | Table renamed |
| `rent` | `leasedAt` | `rentals` | `issuedAt` | Column renamed |
| `rent` | `returningDate` | `rentals` | `dueDate` | Column renamed |
| `rent` | `customId` (Int) | `rentals` | `referenceId` (String) | Type changed |
| `rent` | `userId` | `rentals` | `readerId` | Column renamed |
| `rent` | `locationId` | `rentals` | `libraryId` | Column renamed |
| `publishing` | * | `publishers` | * | Table renamed |
| `booksGroups` | * | — | — | Table removed |
| `town` | * | `regions` | * (parentId) | Merged into regions |
| `comments` | * | `comments` | * | Migrated to new polymorphic comments table |
| `news` | * | — | — | Table removed |
| `books` | `authorId` | `book_authors` | * | Now many-to-many |
| `books` | `image` | `books` | `images[]` | Now array |
| `books` | `pages` | `book_editions` | `pages` | Moved |
| `books` | `printedAt` | `book_editions` | `printedAt` | Moved |
| `books` | `price` | `book_rules` | `price` | Per-library now |
| `books` | `rentDuration` | `book_rules` | `rentDuration` | Per-library now |
| `books` | `few` | `book_rules` | `rarity` | Now enum (COMMON/UNCOMMON/RARE/RESTRICTED) |
| `books` | `booksGroupId` | — | — | Removed |
| `stocks` | `locationId` | `stocks` | `libraryId` | Column renamed |
| `sms` | `error_reason` | `sms` | `errorReason` | camelCase |
| `sms` | `provider_message_id` | `sms` | `providerMessageId` | camelCase |
| `sms` | `provider` (int) | `sms` | `provider` (enum) | Now enum |
| `sms` | `status` (string) | `sms` | `status` (enum) | Now enum |

---

## 7. Authentication & Authorization

### 7.1 JWT Token

**Single token type with `type` field:**

```typescript
// Regular user token (expires in 12 days)
{
  "sub": 123,       // User ID — ONLY user ID in payload
  "type": "user",
  "iat": ...,
  "exp": ...
}

// Bot service token (non-expiring)
{
  "sub": 0,          // Special ID for bot
  "type": "internal",
  "iat": ...
  // No exp field — never expires
}
```

> OLD: JWT contained id, librarian, libraryId, locationId, owner, moderator, exp
> NEW: JWT contains ONLY sub (user id) and type. All other data loaded from DB on each request.

### 7.2 Permission Constants

```typescript
// src/constants/permissions.ts

/**
 * Permission numeric constants.
 * Each permission is a unique integer.
 * Stored as Int[] in Role.permissions column.
 * Used with @RequirePermissions() decorator.
 */
export const PERMISSIONS = {
  // Books
  CREATE_BOOKS: 1,
  READ_BOOKS: 2,
  UPDATE_BOOKS: 3,
  DELETE_BOOKS: 4,

  // Authors
  CREATE_AUTHORS: 11,
  READ_AUTHORS: 12,
  UPDATE_AUTHORS: 13,
  DELETE_AUTHORS: 14,

  // Collections
  CREATE_COLLECTIONS: 21,
  READ_COLLECTIONS: 22,
  UPDATE_COLLECTIONS: 23,
  DELETE_COLLECTIONS: 24,

  // Publishers
  CREATE_PUBLISHERS: 31,
  READ_PUBLISHERS: 32,
  UPDATE_PUBLISHERS: 33,
  DELETE_PUBLISHERS: 34,

  // Book Editions
  CREATE_BOOK_EDITIONS: 41,
  READ_BOOK_EDITIONS: 42,
  UPDATE_BOOK_EDITIONS: 43,
  DELETE_BOOK_EDITIONS: 44,

  // Book Rules
  CREATE_BOOK_RULES: 51,
  READ_BOOK_RULES: 52,
  UPDATE_BOOK_RULES: 53,
  DELETE_BOOK_RULES: 54,

  // Stocks
  CREATE_STOCKS: 101,
  READ_STOCKS: 102,
  UPDATE_STOCKS: 103,
  DELETE_STOCKS: 104,

  // Rentals
  CREATE_RENTALS: 111,
  READ_RENTALS: 112,
  UPDATE_RENTALS: 113,
  DELETE_RENTALS: 114,

  // Users
  CREATE_USERS: 201,
  READ_USERS: 202,
  UPDATE_USERS: 203,
  DELETE_USERS: 204,

  // Roles
  CREATE_ROLES: 211,
  READ_ROLES: 212,
  UPDATE_ROLES: 213,
  DELETE_ROLES: 214,

  // Libraries
  CREATE_LIBRARIES: 301,
  READ_LIBRARIES: 302,
  UPDATE_LIBRARIES: 303,
  DELETE_LIBRARIES: 304,

  // Regions
  CREATE_REGIONS: 311,
  READ_REGIONS: 312,
  UPDATE_REGIONS: 313,
  DELETE_REGIONS: 314,

  // SMS
  CREATE_SMS: 401,
  READ_SMS: 402,
  UPDATE_SMS: 403,
  DELETE_SMS: 404,

  // Gateway
  CREATE_GATEWAY: 411,
  READ_GATEWAY: 412,
  UPDATE_GATEWAY: 413,
  DELETE_GATEWAY: 414,

  // Stats
  READ_STATS: 501,

  // Audit Logs
  READ_AUDIT_LOGS: 601,

  // Passports
  CREATE_PASSPORTS: 701,
  READ_PASSPORTS: 702,
  UPDATE_PASSPORTS: 703,

  // Verification
  SEND_VERIFICATION: 801,
  VERIFY_CODE: 802,
} as const;

export type PermissionValue = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

### 7.3 Default Roles (Seeded)

| Role | Permissions |
| ---- | ----------- |
| **owner** | ALL permissions |
| **moderator** | CRUD books/authors/collections/publishers/book-editions/regions. READ users/stats |
| **librarian** | CRUD rentals/stocks/users (own library). READ books/stats. CRUD sms/gateway. Verification. CRUD passports |

### 7.4 Auth Endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/v1/auth/signin` | No | Admin signin: username/phone + password (rate limited: 10/min per IP) |

> OLD: app/api/routes/auth.js — POST /signin
> REMOVED: check-phone, sign-up, refresh — not needed

### 7.5 Client Auth Flow

Client (mobile/web) users are created by admin. They sign in via:

1. Enter phone number + password
2. If user has a password → validate password
3. If user has NO password → compare input with passport series (e.g. "AA1234567")
   - Passport is checked against the user's active passport record
4. Return JWT token on success

This means:
- Admin creates user → sets phone, passport
- First time client opens app → enters phone + passport series → gets token
- Admin can optionally set a password for the user later

### 7.6 Phone Change Verification

When a user changes their primary phone number:
1. `phoneVerified` is set to `false`
2. A separate API sends SMS verification code via Eskiz
3. User confirms with the code
4. `phoneVerified` is set to `true`

> OLD: Verification.sendCode/verifyCode in app/services/Verification.js
> NEW: Redis-based code storage (was in-memory `sendedCodes[phone]`)

---

## 8. API Modules & Endpoints

### 8.1 Admin Endpoints (`/api/v1/...`)

All require JWT auth + appropriate permissions.

#### Users
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/users` | READ_USERS | List users (paginated, searchable) | `app/api/routes/users.js` GET /users |
| GET | `/users/:id` | READ_USERS | Get user by ID | `app/api/routes/users.js` GET /users/:id |
| POST | `/users` | CREATE_USERS | Create user | `app/controllers/user.js` add() |
| PATCH | `/users/:id` | UPDATE_USERS | Update user | `app/controllers/user.js` update() |

**User lookup by passport (cross-library):**

| Method | Path | Permission | Auth | Description |
| ------ | ---- | ---------- | ---- | ----------- |
| POST | `/users/check-passport` | CREATE_USERS | Yes | Check if passport exists across all libraries |
| POST | `/users/link-library` | CREATE_USERS | Yes | Link existing user to current library |

- `check-passport`: Rate limited — **2 requests per minute**. Returns basic user info if found (name, id). Does NOT expose other library's data.
- `link-library`: Adds entry to `UserLibrary` join table.

> OLD: User creation in app/controllers/user.js checked passport uniqueness globally
> NEW: Explicit 2-step flow with rate limiting for cross-library lookup

#### Books
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/books` | READ_BOOKS | List books | `app/api/routes/books.js` |
| GET | `/books/:id` | READ_BOOKS | Get book | `app/api/routes/books.js` |
| POST | `/books` | CREATE_BOOKS | Create book | `app/controllers/book.js` add() |
| PATCH | `/books/:id` | UPDATE_BOOKS | Update book | `app/api/routes/books.js` PUT |

#### Book Editions
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/book-editions` | READ_BOOK_EDITIONS | List editions | NEW |
| GET | `/book-editions/:id` | READ_BOOK_EDITIONS | Get edition | NEW |
| POST | `/book-editions` | CREATE_BOOK_EDITIONS | Create edition | NEW |
| PATCH | `/book-editions/:id` | UPDATE_BOOK_EDITIONS | Update edition | NEW |

#### Book Rules
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/book-rules` | READ_BOOK_RULES | List rules | NEW (was Book.price/rentDuration/few) |
| GET | `/book-rules/:id` | READ_BOOK_RULES | Get rule | NEW |
| POST | `/book-rules` | CREATE_BOOK_RULES | Create rule | NEW |
| PATCH | `/book-rules/:id` | UPDATE_BOOK_RULES | Update rule | NEW |

#### Stocks
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/stocks` | READ_STOCKS | List stocks | `app/api/routes/stocks.js` |
| GET | `/stocks/:id` | READ_STOCKS | Get stock | `app/api/routes/stocks.js` |
| POST | `/stocks` | CREATE_STOCKS | Create stock (auto-assigns bookRule) | `app/controllers/stock.js` add() |
| PATCH | `/stocks/:id` | UPDATE_STOCKS | Update stock (status, etc.) | `app/controllers/stock.js` update() |
| GET | `/stocks/export` | READ_STOCKS | Export CSV | `app/controllers/stock.js` download() |

#### Rentals
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/rentals` | READ_RENTALS | List active rentals | `app/controllers/rent.js` getList() |
| GET | `/rentals/:id` | READ_RENTALS | Get rental | `app/controllers/rent.js` getOne() |
| GET | `/rentals/report` | READ_RENTALS | Expired rentals report | `app/controllers/rent.js` report() |
| POST | `/rentals/check` | CREATE_RENTALS | Pre-validate rental | `app/controllers/rent.js` checkToAdd() |
| POST | `/rentals` | CREATE_RENTALS | Create rental | `app/controllers/rent.js` add() |
| PATCH | `/rentals/:id` | UPDATE_RENTALS | Edit rental (dueDate) | `app/controllers/rent.js` edit() |
| PATCH | `/rentals/:id/return` | UPDATE_RENTALS | Return book | `app/controllers/rent.js` return() |
| PATCH | `/rentals/:id/reject` | UPDATE_RENTALS | Reject rental (requires reason + stock status change) | `app/controllers/rent.js` reject() |

#### Libraries, Authors, Collections, Publishers, Regions
Standard CRUD pattern (GET list, GET one, POST, PATCH) for each.

#### Roles
| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/roles` | READ_ROLES | List roles with permissions |
| GET | `/roles/:id` | READ_ROLES | Get role |
| POST | `/roles` | CREATE_ROLES | Create role |
| PATCH | `/roles/:id` | UPDATE_ROLES | Update role + permissions |

#### Passports
| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/passports/user/:userId` | READ_PASSPORTS | List user's passports |
| POST | `/passports` | CREATE_PASSPORTS | Add passport to user |
| PATCH | `/passports/:id` | UPDATE_PASSPORTS | Update passport |

#### Verification
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| POST | `/verification/send-code` | SEND_VERIFICATION | Send SMS code | `app/services/Verification.js` sendCode() |
| POST | `/verification/verify` | VERIFY_CODE | Verify SMS code | `app/services/Verification.js` verifyCode() |

#### SMS
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/sms` | READ_SMS | List SMS | `app/api/routes/sms.js` GET |
| POST | `/sms` | CREATE_SMS | Create bulk SMS | `app/api/routes/sms.js` POST |
| POST | `/sms/send-single` | CREATE_SMS | Send single SMS | `app/services/SmsService.js` |
| GET | `/sms/conversations` | READ_SMS | SMS conversations | `app/api/routes/sms.js` GET /conversations |
| GET | `/sms/conversations/:phone` | READ_SMS | Conversation by phone | `app/api/routes/sms.js` GET /conversations/:phone |
| PATCH | `/sms/:id` | UPDATE_SMS | Update SMS status | `app/api/routes/sms.js` PUT |
| PATCH | `/sms/bulk-status` | UPDATE_SMS | Bulk status update | `app/api/routes/sms.js` PUT /messages |

#### Gateway
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| POST | `/gateway/devices` | CREATE_GATEWAY | Register device | `app/services/GatewayService.js` registerDevice() |
| PATCH | `/gateway/devices/:id` | UPDATE_GATEWAY | Update device | `app/services/GatewayService.js` updateDevice() |
| POST | `/gateway/devices/:id/receive-sms` | CREATE_GATEWAY | Receive SMS | `app/services/GatewayService.js` receiveSms() |
| PATCH | `/gateway/devices/:id/sms-status` | UPDATE_GATEWAY | Update SMS status | `app/services/GatewayService.js` updateSmsStatus() |
| GET | `/gateway/devices/:id/pending-sms` | READ_GATEWAY | Get pending SMS | `app/services/GatewayService.js` getPendingSms() |

#### Stats
| Method | Path | Permission | Description | Old Location |
| ------ | ---- | ---------- | ----------- | ------------ |
| GET | `/stats` | READ_STATS | Full statistics | `app/services/StatServices.js` getStats() |

#### Audit Logs
| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/audit-logs` | READ_AUDIT_LOGS | List logs (paginated, filterable by resource/user/date) |
| GET | `/audit-logs/:id` | READ_AUDIT_LOGS | Get log detail |

#### Files
| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/files/upload` | Yes | Upload file (returns file path) |

#### Comments
| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/comments` | (entity permission) | List comments for entity |
| POST | `/comments` | (entity permission) | Add comment to stock or rental |

### 8.2 Front-App Endpoints (`/api/v1/app/...`)

Client-facing APIs for mobile/web apps. All in `front-app` module.

| Method | Path | Auth | Description | Old Location |
| ------ | ---- | ---- | ----------- | ------------ |
| POST | `/app/auth/signin` | No | Client sign in (phone + password/passport, rate limited: 10/min) | `app/api/routes/app/auth.js` |
| GET | `/app/books` | No | Browse books (paginated, filterable) | `app/api/routes/app/books.js` GET |
| GET | `/app/books/filters` | No | Get filter data (collections, authors) | `app/api/routes/app/books.js` GET /filter-data |
| GET | `/app/books/:id` | No | Book details with availability | `app/api/routes/app/books.js` GET /:id |
| GET | `/app/books/:id/statuses` | No | Book rental statuses at library | `app/api/routes/app/books.js` GET /:id/statuses |
| GET | `/app/collections` | No | List collections | `app/api/routes/app/collections.js` |
| GET | `/app/libraries` | No | List active libraries | NEW (was in bot only) |
| GET | `/app/stats` | No | Public statistics | `app/api/routes/app/stats.js` GET |
| POST | `/app/stats/by-range` | No | Stats by date range | `app/api/routes/app/stats.js` POST |
| POST | `/app/expired-rental-info` | No | Check expired rentals by phone (rate limited: 5/hour) | `app/api/routes/app/expired-rent-info.js` |
| GET | `/app/account` | Yes | Get profile | `app/api/routes/app/account.js` GET |
| PATCH | `/app/account` | Yes | Update profile | `app/api/routes/app/account.js` PATCH |
| GET | `/app/account/books` | Yes | User's rented books | `app/api/routes/app/account.js` GET /books |
| POST | `/app/account/verify-phone` | Yes | Send code to verify new phone | NEW |
| POST | `/app/account/confirm-phone` | Yes | Confirm phone with code | NEW |
| GET | `/app/users/telegram/:telegramId` | Yes* | Find user by Telegram ID | Was direct DB query in bot |

> *Telegram user lookup requires bot service token or authenticated user

### 8.3 Health Check

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/v1/health` | No | Returns `{ status: "ok", uptime: ... }`. Checks DB + Redis connectivity. |

### 8.4 Webhook Endpoints

| Method | Path | Auth | Description | Old Location |
| ------ | ---- | ---- | ----------- | ------------ |
| POST | `/api/v1/webhook/eskiz` | No | Eskiz SMS status callback | `app/api/routes/webhook.js` |

> OLD: Eskiz webhook blocked users on SMS rejection
> NEW: Webhook only updates SMS status, does NOT block users

---

## 9. Core Business Logic

### 9.1 Rental Strategy (PER LIBRARY)

> OLD: app/controllers/rent.js — canGetMoreRents(), canGetMoreRentStrategy()

Limits how many active rentals a reader can have **at a specific library**,
based on their completed rental count **at that same library**:

```
Completed rentals at this library >= 40 → max 5 active
Completed rentals at this library >= 25 → max 4 active
Completed rentals at this library >= 12 → max 3 active
Completed rentals at this library >= 5  → max 2 active
Default (< 5)                           → max 1 active
```

Note: Rentals at other libraries do NOT count.

### 9.2 Rarity System

> OLD: app/controllers/rent.js — isRequiredBook(), few books logic
> NEW: BookRule.rarity enum + SQRT auto-detection
> FULL DETAILS: See `RARITY_SYSTEM.md`

| Rarity | Who Sets It | Min Completed | Who Can Rent | Special Rule |
| ------ | ----------- | ------------- | ------------ | ------------ |
| COMMON | Default | 0 | Anyone | SQRT auto-detection makes it temporarily "zarur" when stock runs low |
| UNCOMMON | Admin | 0 | Verified + < 5 active | Always "zarur". Old `few=1` maps here |
| RARE | Admin | 10 | Verified only | Max 1 of this rarity per reader |
| RESTRICTED | Admin | 50 | Verified only | Max 1 of this rarity per reader |

**SQRT Auto-Detection (COMMON books only):**
```
available_copies < sqrt(total_copies) → temporarily "zarur"
```
Computed on-the-fly, not stored in DB. When stock frees up, book returns to normal.

**"Zarur" Blocking Rule:**
- Reader holding a "zarur" book cannot rent more (unless verified + < 5 active)
- Cannot hold 2 "zarur" books simultaneously

### 9.3 User Blocking

> OLD: app/controllers/rent.js — return() method (blocking only on return)
> NEW: Daily cron job checks all overdue rentals and blocks users proactively

**Blocking conditions** (checked by daily cron, NOT on return):
- **70 days** past `issuedAt` and book still not returned → block
- **10 days** past `dueDate` and book still not returned → block

**Cron schedule:** Daily at 00:00 (midnight)
1. Query all active rentals (returnedAt IS NULL)
2. For each: check if 70 days past issuedAt OR 10 days past dueDate
3. If condition met → set user.status = BLOCKED, set blockingReason with details

**Also blocks on return** (for edge cases where cron hasn't run yet):
- Same conditions checked when `PATCH /rentals/:id/return` is called

Blocked users:
- Cannot rent unless they have sufficient balance (≥ book rule price)
- `blockingReason` stores the details (which book, how many days overdue)

> REMOVED: SMS rejection (Eskiz webhook) no longer blocks users

### 9.4 Working Day Calculation

> OLD: app/utils/helpers.js — getLibraryHolidays(), getReturningDateIfIsNotWorkingDay()
> NEW: Library.schedule JSON field stores weekends and holidays per library

When calculating `dueDate`:
1. Get BookRule.rentDuration for this book at this library
2. Add `rentDuration` days to `issuedAt`
3. Get Library.schedule (weekends + holidays)
4. If result falls on a weekend or holiday, shift to next working day
5. Repeat step 4 until a working day is found

Example: Library has weekends ["friday", "sunday"], rentDuration = 15
- issuedAt: Monday March 2 → dueDate: Tuesday March 17
- If March 17 is Friday → shift to Saturday March 18
- Saturday is not a weekend → March 18 is the dueDate

### 9.5 Rental Rejection

> OLD: app/controllers/rent.js — reject()
> NEW: Requires mandatory reason + stock status change

When rejecting a rental:
1. `rejected` = true
2. `note` = rejection reason (REQUIRED — must explain why)
3. Stock `status` changes to the appropriate status (DAMAGED, LOST, STOLEN, etc.)
4. Stock `busy` stays true (it's not available)
5. Stock is NEVER deleted

### 9.6 Stock Auto-Assignment of BookRule

When creating a stock:
1. Look up `BookRule` for this `bookId` + `libraryId`
2. If exists → assign `bookRuleId`
3. If not → auto-create default BookRule (price=50000, rentDuration=15, rarity=COMMON)

### 9.7 Stock Visibility

- **Admin stock list API:** Shows ALL statuses (ACTIVE, LOST, DAMAGED, etc.)
- **Front-app / public APIs:** Shows ONLY `status = ACTIVE` stocks
- **Bot inline search:** Shows ONLY `status = ACTIVE` stocks
- **Stats:** Only counts `status = ACTIVE` stocks

---

## 10. Telegram Bot

### 10.1 Architecture

- **Separate Node.js process** in `bot/` directory
- Communicates with NestJS API via HTTP using non-expiring JWT
- Never imports from `src/modules/` directly
- Uses grammyJS with composers, conversations, inline queries

> OLD: app/bot/ — used Telegraf with scenes
> NEW: bot/ — uses grammyJS with composers and conversations (or router pattern)

### 10.2 API Client & Error Handling

The bot's HTTP client (`bot/src/api/client.ts`):
- Uses bot service JWT token in `Authorization: Bearer` header
- Base URL: `http://localhost:{API_PORT}/api/v1`
- Global error handler: catch all API errors, send "Uzr, xatolik yuz berdi" to user
- No retry logic — if API is down, bot shows error message
- Timeout: 10 seconds per request

### 10.3 Session

Redis-backed session storage via grammyJS session plugin.

Session data:
```typescript
interface SessionData {
  userId?: number;           // DB user ID
  libraryId?: number;        // Selected library
  isAuthenticated: boolean;
  // ... conversation state
}
```

### 10.4 User Commands

| Command | Description | Old Location |
| ------- | ----------- | ------------ |
| `/start` | Main menu (deeplink support) | `app/bot/core/commands.js` |
| `/yordam` | Help / search instructions | `app/bot/core/commands.js` |
| `/qidirish` | Search books (triggers inline) | `app/bot/core/commands.js` |
| `/kitob` | View rent info | `app/bot/middlewares/others.js` |
| `/zarur` | Books needing donation | `app/bot/core/commands.js` fewBooksMiddleware() |
| `/hissa` | Donation channel info | `app/bot/core/commands.js` |
| `/natija` | Statistics | `app/bot/scenes/stats.js` |
| `/haqida` | About the library | `app/bot/scenes/about.js` |

### 10.5 Inline Search

> OLD: app/bot/core/inline.js, app/bot/core/inline/profile_inline.js

| Query | Description |
| ----- | ----------- |
| `{book name}` | Search books by name with availability info |
| `my_0` | User's currently reading books |
| `my_1` | User's returned (read) books |

Book detail shows: image, name, library, availability (free/busy count), author, "when free" dates.

### 10.6 Conversations

| Name | Steps | Old Location |
| ---- | ----- | ------------ |
| `location` | Select library → update user | `app/bot/scenes/location.js` |
| `profile` | View profile with inline buttons | `app/bot/scenes/profile.js` |

> NOTE: No registration flow in bot (removed). Registration only via admin panel.
> OLD: app/bot/scenes/registaration/ (8 step flow) — REMOVED

### 10.7 Notifications (via API, triggered by cron)

> OLD: app/services/Notifications.js
> Bot uses Telegram Bot API to send channel/group notifications

---

## 11. SMS System & Gateway

### 11.1 Providers

| Provider | Usage | Old Location |
| -------- | ----- | ------------ |
| ESKIZ | Verification codes, status webhooks | `app/services/Verification.js` |
| GATEWAY | Android device SMS via FCM push | `app/services/GatewayService.js` |
| PLAY_MOBILE | Legacy (keep code, not primary) | `app/helpers/sms/` |
| MANUAL | Manually recorded | — |

### 11.2 Gateway Flow

> OLD: app/services/GatewayService.js

```
1. Backend creates SMS record (status: DRAFT)
2. Backend sends FCM push: { type: "PENDING_SMS_AVAILABLE" }
3. Android app receives push
4. App calls GET /gateway/devices/:id/pending-sms (paginated)
5. App sends SMS from phone, calls PATCH with status update
6. Backend updates SMS status (SENT → DELIVERED / ERROR)
```

Daily limit: `GATEWAY_SMS_DAILY_LIMIT = 220`

### 11.3 Verification Flow

> OLD: app/services/Verification.js — in-memory code storage
> NEW: Redis with 5-minute TTL

```
1. POST /verification/send-code → generate 4-digit code
2. Store in Redis: key=verify:{phone}, value=code, TTL=300s
3. Send SMS via Eskiz
4. POST /verification/verify → check Redis
```

---

## 12. Cron Jobs

> OLD: app/services/Crons.js
> NEW: @nestjs/schedule with @Cron() decorators

| Schedule | Job | Description | Old Location |
| -------- | --- | ----------- | ------------ |
| `0 10-18 * * *` | groupHourly | Hourly rent summary to TG group | `Crons.js` groupNotifications |
| `0 19 * * *` | groupDaily | Daily 13-hour summary to group | `Crons.js` groupNotifications |
| `0 19 * * *` | donationDaily | Daily donation stats | `Crons.js` donationChannel |
| `0 9 * * 5` | donationWeekly | Weekly donation stats (Friday) | `Crons.js` donationChannel |
| `0 10 1 * *` | donationMonthly | Monthly stats + top readers | `Crons.js` donationChannel |
| `0 8 * * 0` | sundayWarning | Expired rents warning | `Crons.js` mainChannelNotifications |
| `0 10 * * 5` | fridayStats | Weekly stats to main channel | `Crons.js` mainChannelNotifications |
| `5 10 1 * *` | monthlyStats | Monthly stats to channel | `Crons.js` mainChannelNotifications |
| `5 13 1 * *` | monthlyTopReaders | Top readers to channel | `Crons.js` mainChannelNotifications |
| `0 8 * * 5` | happyFriday | Happy Friday message | `Crons.js` mainChannelNotifications |
| `0 0 * * *` | autoBlockOverdue | Block users with overdue rentals (70d/10d rule) | NEW — was only on return |
| `0 9 * * *` | createExpiredSms | Create SMS for expired rents | `Crons.js` createSmsForExpiredRentsCron |
| `0 9-22 * * *` | pushPendingSms | Push pending SMS notifications | `Crons.js` pushPendingSmsNotificationCron |
| `0 6 * * 4,0` | bulkSms | Bulk SMS to overdue users | `Crons.js` rentExpiresBulkSms |

---

## 13. File Storage

### 13.1 Structure

```
uploads/
├── books/            # Book cover images
│   └── {uuid}.{ext}
└── passports/        # Passport document images
    └── {uuid}.{ext}
```

> OLD: Book images were URLs (Telegram or external). Passport images were Telegram channel links.
> NEW: All files stored locally. Served via NestJS ServeStaticModule at `/uploads/`

### 13.2 Accepted Formats

- **Book images:** PNG, JPG, JPEG
- **Passport images:** PNG, JPG, JPEG, PDF

### 13.3 Max File Size

10MB (configurable via `MAX_FILE_SIZE` env var)

---

## 14. Caching Strategy (Redis)

> OLD: File-based cache (`/files/stats-{id}.json`) and in-memory
> NEW: Redis with TTL

| Key Pattern | TTL | Usage | Old Location |
| ----------- | --- | ----- | ------------ |
| `stats:{libraryId}` | 1 hour | Library statistics | `StatServices.js` file cache |
| `verify:{phone}` | 5 min | SMS verification codes | `Verification.js` in-memory |
| `rate:passport:{ip}` | 1 min | Passport lookup rate limit (2/min) | NEW |
| `rate:expired:{ip}` | 1 hour | Expired rental info rate limit (5/hour) | Was express-rate-limit |
| `rate:signin:{ip}` | 1 min | Auth signin rate limit (10/min) | NEW |
| `rate:app-signin:{ip}` | 1 min | Client auth signin rate limit (10/min) | NEW |

---

## 15. Testing

### 15.1 E2E Tests

```
test/e2e/
├── auth.e2e-spec.ts          # Login flow
├── books.e2e-spec.ts         # Book CRUD + public search
├── rentals.e2e-spec.ts       # Full rental lifecycle
├── users.e2e-spec.ts         # User CRUD + cross-library
├── stocks.e2e-spec.ts        # Stock CRUD + export
├── roles.e2e-spec.ts         # RBAC management
├── verification.e2e-spec.ts  # Code send/verify
├── account.e2e-spec.ts       # Client profile
└── setup.ts                  # Test DB setup & cleanup
```

### 15.2 Test Database

Separate PostgreSQL database. Prisma migrations applied before suite. Data cleaned between files.

---

## 16. Data Migration Plan

### Phase 1: Schema Migration

**Order matters — migrate in this sequence:**

1. Create new Prisma schema
2. SQL migration script:
   - **Step 1: Regions** — Merge `town` into `regions` (set parentId)
   - **Step 2: Libraries** — Rename `location` → `libraries`, update column names
   - **Step 3: Roles** — Create `roles` table, seed default roles (owner, moderator, librarian)
   - **Step 4: Users** — Migrate users FIRST (needed for FK references later):
     - Map `owner/moderator/librarian` booleans → `roleId`
     - Map `locationId` → `adminLibraryId` (for admin users only)
     - Merge `extraPhone/extraPhone2` → `extraPhones[]`
     - Hash all plain-text passwords with **bcrypt** (cost factor 10)
     - Create `UserLibrary` entries from old `libraryId`
   - **Step 5: Passports** — Create `passports` table, migrate `passportId/pinfl` from users
     - Skip `passportImage` (old Telegram links are expired/inaccessible)
   - **Step 6: Books** — Rename columns, remove `@unique` from name
   - **Step 7: BookAuthors** — Create `book_authors` from `Book.authorId`
   - **Step 8: BookEditions** — Move `pages/printedAt` from books, link publisher
   - **Step 9: BookRules** — Create from `Book.price/rentDuration/few` per library
     - `few = 1` → `rarity = UNCOMMON`
     - `few = 2` (default) → `rarity = COMMON`
   - **Step 10: Stocks** — Rename `locationId` → `libraryId`, add `status = ACTIVE`, auto-assign `bookRuleId`
   - **Step 11: Rentals** — Rename table and columns per mapping
     - Set `issuedById`: find library's admin user (via stock → library → adminUsers) and assign
   - **Step 12: Comments** — Migrate old `comments` to new polymorphic structure (set `rentalId`)
   - **Step 13: SMS** — Rename columns, convert provider int → enum, status string → enum
   - **Step 14: Book images** — Download image URLs → local files (skip failed downloads)
   - **Step 15: Cleanup** — Drop removed tables (`news`, `booksGroups`), remove migrated columns from users

### Phase 2: Data Validation
1. Compare record counts
2. Verify FK integrity
3. Test critical queries (rental report, stats, search)

### Phase 3: Switchover
1. Stop old app
2. Run final migration
3. Start new app + bot
4. Monitor for errors

---

## 17. Deployment

### Environment
- **Server:** Hetzner VPS
- **Process manager:** PM2 or systemd
- **Node.js:** 24 LTS

### Processes
1. **NestJS API** — `node dist/src/main.js` (port 3000)
2. **Telegram Bot** — `node dist/bot/src/main.js` (separate process)

### Build
```bash
pnpm build          # Compiles both src/ and bot/
pnpm start:prod     # Starts API
pnpm start:bot      # Starts bot
pnpm prisma migrate deploy  # Run migrations
pnpm prisma db seed  # Seed default data
```

---

## 18. Future Enhancements (NOT in current scope)

> From task.md — planned but built later:

1. **Ball (Points) System** — Points-based access replacing blocking
2. **Inventarizatsiya** — Stock audit/inventory workflow
3. **Book Extension** — User self-service rental extension via bot
4. **User Verification Overhaul** — 3 phone SMS confirmation, passport photo via camera
5. **Admin Panel Frontend** — Separate repo, React-based
6. **Admin Bot Commands** — /ijr, /week, /month, etc. — will add when admin panel exists

---

## 19. Swagger Documentation

Auto-generated at `/api/docs` from DTOs and decorators.

Features:
- Grouped by module (tags)
- Request/response schemas from DTOs
- Bearer token auth support
- Example values for all fields
