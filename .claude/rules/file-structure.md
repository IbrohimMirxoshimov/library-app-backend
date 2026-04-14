# File Structure Rules

## NestJS Module Structure

Every module follows this pattern:

```
src/modules/{module-name}/
├── {module-name}.module.ts        # Module definition
├── {module-name}.controller.ts    # HTTP endpoints (thin — delegates to service)
├── {module-name}.service.ts       # Business logic
└── dto/
    ├── create-{name}.dto.ts       # POST request body
    ├── update-{name}.dto.ts       # PATCH request body
    └── query-{name}.dto.ts        # GET query params (extends PaginationQueryDto)
```

If a module has sub-resources or complex logic, split:

```
src/modules/{module-name}/
├── {module-name}.module.ts
├── {module-name}.controller.ts
├── {module-name}.service.ts
├── {sub-concern}.service.ts       # e.g. rental-strategy.service.ts
└── dto/
```

## Naming Conventions

| What | Pattern | Example |
|------|---------|---------|
| Module file | `kebab-case.module.ts` | `book-rules.module.ts` |
| Controller | `kebab-case.controller.ts` | `book-rules.controller.ts` |
| Service | `kebab-case.service.ts` | `book-rules.service.ts` |
| DTO | `verb-noun.dto.ts` | `create-book.dto.ts` |
| Guard | `kebab-case.guard.ts` | `permissions.guard.ts` |
| Decorator | `kebab-case.decorator.ts` | `current-user.decorator.ts` |
| Interceptor | `kebab-case.interceptor.ts` | `audit-log.interceptor.ts` |
| Utility | `kebab-case.utils.ts` | `string.utils.ts` |
| Constant | `kebab-case.ts` | `permissions.ts` |
| Interface | `kebab-case.interface.ts` | `request-user.interface.ts` |
| E2E test | `kebab-case.e2e-spec.ts` | `rentals.e2e-spec.ts` |

## Common Directory

Shared infrastructure — used by multiple modules:

```
src/common/
├── decorators/     # @CurrentUser, @RequirePermissions, @Public
├── guards/         # JwtAuthGuard, PermissionsGuard
├── interceptors/   # AuditLogInterceptor, TransformInterceptor
├── filters/        # HttpExceptionFilter
├── dto/            # PaginationQueryDto, PaginatedResponseDto
├── interfaces/     # RequestUser, etc.
├── services/       # BaseCrudService (if generic CRUD is extracted)
└── utils/          # string.utils, date.utils, phone.utils
```

## Bot Directory

Separate process — own structure:

```
bot/src/
├── main.ts              # Entry point
├── bot.ts               # Bot instance creation
├── config/              # Bot-specific config
├── api/                 # HTTP client + API wrappers
├── context/             # Custom grammyJS context type
├── session/             # Redis session setup + interface
├── middleware/           # Auth, private-chat filter, error handler
├── composers/           # Command handlers (one file per command group)
├── conversations/       # Multi-step flows (location, profile)
├── inline/              # Inline query handlers
├── keyboards/           # Keyboard builders
├── utils/               # Formatters, pagination helpers
└── cache/               # In-memory caches (library list)
```

## Key Rules

1. **Never put business logic in controllers** — controllers parse input, call service, return result. That's it.
2. **Never import between modules directly** — use NestJS dependency injection. If module A needs module B's service, import module B in module A's imports.
3. **One module = one domain concern** — don't mix books and rentals in one module.
4. **Tests live in `test/e2e/`** — not inside src/.
5. **Config lives in `src/config/`** — not scattered across modules.
6. **Prisma schema is the source of truth** — if the schema and code disagree, fix the code.
