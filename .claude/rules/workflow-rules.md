# Workflow Rules

## Autonomous Work

1. **Work independently** — don't ask for permission on every step. Read the spec, follow the phases, execute.

2. **Repetitive tasks → script** — if a task involves doing the same thing multiple times (creating modules, generating DTOs, etc.), write a quick JS/TS script to automate it. Delete the script after use.

3. **Type checking** — run `pnpm tsc --noEmit` periodically (after finishing a logical group of files, not after every single file). Fix all errors before moving on.

4. **Don't wait for build** — use `tsc --noEmit` for type checking. Full `pnpm build` only at the end of a phase.

## Database

5. **Database is ready** — PostgreSQL database `new_library_app` is available at localhost with same credentials as old DB. Use this for development and testing.

6. **Prisma workflow**:
   ```bash
   pnpm prisma generate          # After schema changes
   pnpm prisma migrate dev       # Create + apply migration (dev)
   pnpm prisma db seed           # Seed default data
   ```

## TypeScript Strictness

7. **`strict: true` is mandatory** — in tsconfig.json. No exceptions.

8. **Never use `as` to force-cast** — fix the actual type. If Prisma returns a nullable type and you know it's not null, use a null check (`if (!x) throw`) not `as`.

9. **Never use `any`** — use `unknown` + type narrowing if the type is truly unknown. Prefer generics over any.

10. **Never use `@ts-ignore` or `@ts-expect-error`** — fix the type error properly.
