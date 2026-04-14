# Prisma Rules

## Schema

1. **Every column has a comment** — use `///` above each field in schema.prisma
2. **Table names** — snake_case plural: `@@map("book_rules")`
3. **Enum values** — UPPER_CASE: `ACTIVE`, `BLOCKED`, `COMMON`
4. **Soft delete** — use `deletedAt DateTime?` on models that need it. Never actually delete.
5. **Timestamps** — every model has `createdAt` and `updatedAt`
6. **Indexes** — add for fields used in WHERE, JOIN, ORDER BY. Comment why each index exists.

## Queries

7. **Always filter soft-deleted records** — unless explicitly querying deleted items:
   ```typescript
   where: { deletedAt: null, ...otherFilters }
   ```

8. **Always filter by library** — for non-owner users:
   ```typescript
   where: { libraryId: user.adminLibraryId, ...otherFilters }
   ```

9. **Use select/include wisely** — don't fetch entire relations when you only need a count or specific fields. Use `_count` for counting relations.

10. **Transactions for multi-table writes**:
    ```typescript
    await this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.create({ ... });
      await tx.stock.update({ where: { id: stockId }, data: { busy: true } });
      return rental;
    });
    ```

11. **Never use `deleteMany` or `delete`** — use `update` to set `deletedAt` or change status.

## Migrations

12. **After schema changes**:
    ```bash
    pnpm prisma generate    # Regenerate client
    pnpm prisma migrate dev # Create migration (dev only)
    ```

13. **Migration naming** — descriptive: `add_book_rules_table`, `rename_location_to_library`

14. **Never edit existing migrations** — create a new one instead.

## Performance

15. **Pagination** — always use `skip`/`take` for list queries. Never fetch all records.
16. **Count optimization** — use `findMany` + `count` in a transaction, or `findAndCount` pattern.
17. **Avoid N+1** — use `include` for relations needed in the response. Don't query in a loop.
