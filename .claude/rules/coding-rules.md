# Coding Rules

## Documentation

1. **Keep CLAUDE.md up to date** — when adding new features, modules, endpoints, or changing architecture, update `.claude/CLAUDE.md` immediately. Always write in English to save tokens. No code examples — only names, structure, and key info.

2. **Language** — communicate with user in Uzbek. Code, comments, docs, variable names in English.

3. **Comments** — every database column must have a comment. Every non-trivial function must explain WHY, not WHAT. Every business rule must be documented in code. If a piece of logic isn't obvious at first glance, it needs a comment.

## Code Organization

4. **Package manager** — always use `pnpm`. Never `npm` or `yarn`.

5. **Centralize constants** — permissions, magic numbers, config keys go in `src/constants/`. Never duplicate across files. If a value is used in 2+ places, it's a constant.

6. **No duplicate code** — if same logic in 2+ places, extract to shared function/module. Use generic patterns for CRUD, pagination, filtering. Three similar lines are fine; three similar blocks are not.

7. **Split into small files** — one class per file, one concern per file. A service with 300+ lines should be split. Controllers should be thin — delegate logic to services.

8. **Extract types** — shared TypeScript interfaces/types go in the module's `dto/` or `src/common/interfaces/`. Never use `any` — if the type is unknown, define it. Never use `as` to force-cast types — fix the actual type instead. `tsconfig.json` must have `strict: true`.

9. **Extract utilities** — reusable helpers go in `src/common/utils/`. Module-specific helpers stay in the module folder.

## NestJS Patterns

10. **Follow NestJS patterns** — modules, services, controllers, DTOs. Swagger decorators (`@ApiProperty`, `@ApiOperation`, `@ApiResponse`, `@ApiTags`) on all endpoints and DTO fields.

11. **Prisma** — all database operations through Prisma. Run `pnpm prisma generate` after schema changes. Never write raw SQL unless absolutely necessary for performance — and if you do, add a comment explaining why.

12. **Config** — all env vars in `src/config/index.ts` via `getConfig()` function. NO `@nestjs/config` ConfigService. Import `getConfig()` directly where needed.

13. **DTOs for everything** — every request body, query, and response has a DTO class. Use `class-validator` decorators for validation. Use `class-transformer` for transformation. Never trust raw `req.body`.

14. **Consistent response format** — all list endpoints return `PaginatedResponse<T>`. All single-item endpoints return the entity directly. All mutations return the affected entity.

## Data & Security

15. **No deletion** — never delete records from DB. No DELETE API endpoints unless explicitly discussed and approved. Use soft delete (`deletedAt`) or status changes instead.

16. **Security** — never expose internal errors or stack traces. Validate all inputs with class-validator. Rate-limit sensitive endpoints. Hash passwords with bcrypt (never store plain text). Never log sensitive data (passwords, tokens).

17. **Library scoping** — admin users see only their library's data (users, stocks, rentals). Owner role sees all. Always filter by `libraryId` in queries for non-owner users. Forgetting this filter = data leak.

18. **Transactions** — use Prisma transactions (`prisma.$transaction`) for operations that modify multiple tables (rental creation, rejection, etc.). Never leave the DB in a partial state.

## Error Handling & Logging

19. **Error handling** — use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, `ForbiddenException`). User-facing error messages in Uzbek. Internal logs in English.

20. **Logging** — use NestJS built-in `Logger`. Production: error/warn/log only. Dev: all levels. Log business-critical operations (rental create/return, user blocking, SMS sending) with enough context to debug.

21. **Never swallow errors** — every catch block must either re-throw, log, or handle meaningfully. Empty catch blocks are forbidden.

## Testing

22. **Testing** — write E2E tests for all critical flows. Use separate test database. Test happy path AND error cases (invalid input, missing permissions, rate limits).

23. **Verify after changes** — run `pnpm tsc --noEmit` (type check only, faster than full build). Do this periodically, not after every single file. Don't commit code that doesn't compile.

## Bot

24. **Bot isolation** — `bot/` directory is a separate process. It NEVER imports from `src/modules/`. All communication via HTTP to the API using bot service token. Shared types can be duplicated or put in a shared types file.

25. **Bot error resilience** — bot must never crash on API errors. Global error handler catches everything and sends user-friendly message ("Uzr, xatolik yuz berdi"). Individual handlers should also catch known error cases gracefully.
