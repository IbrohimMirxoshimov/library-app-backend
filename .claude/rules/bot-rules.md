# Bot Rules

## Architecture

1. **Bot is a separate process** — lives in `bot/` directory, runs independently from NestJS API.
2. **Never import from `src/modules/`** — all data access goes through HTTP API calls.
3. **API client** — single HTTP client instance in `bot/src/api/client.ts` with:
   - Bot service JWT token in Authorization header
   - Base URL pointing to local API
   - 10 second timeout
   - Global error catch

## Code Organization

4. **Composers** — one file per command group. Use grammyJS `Composer` class. Keep handlers small.
5. **Conversations** — use grammyJS conversations plugin for multi-step flows.
6. **Inline queries** — separate files in `inline/` directory.
7. **Keyboards** — all keyboard builders in `keyboards/` directory. Never build keyboards inline in handlers.
8. **Formatting** — all text formatting helpers in `utils/format.utils.ts`.

## Error Handling

9. **Never crash** — bot must handle ALL errors gracefully. Global error handler catches everything.
10. **User-friendly errors** — on API failure, send "Uzr, xatolik yuz berdi. Qaytadan urinib ko'ring." Never show stack traces or technical errors.
11. **API unavailable** — if API is down, bot should still respond (with error message), not hang.

## Session

12. **Redis-backed** — use grammyJS session plugin with Redis adapter.
13. **Minimal session data** — only store: userId, libraryId, isAuthenticated. Don't cache large objects.
14. **Session key** — use `ctx.from.id` (Telegram user ID) as session key.

## Bot Text

15. **All bot text in Uzbek** — hardcoded strings are fine (no i18n needed for bot).
16. **HTML parse mode** — use `<b>`, `<i>`, `<code>` for formatting. Set `parse_mode: "HTML"` as default.
17. **Escape user input** — always escape HTML special chars in user-provided text before sending.
