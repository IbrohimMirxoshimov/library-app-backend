# Book Rarity System — Detailed Logic

> This document describes the rarity-based rental restriction system.
> Referenced from SPEC.md Section 9.2.

## Overview

The rarity system controls who can rent which books, based on:
- Admin-assigned rarity level on `BookRule`
- Automatic SQRT detection for COMMON books when stock runs low
- Reader's verification status and rental history

## Rarity Levels

### COMMON (default)

- **Who sets it:** Default for all new BookRules
- **Who can rent:** Anyone (subject to normal rental strategy)
- **Special behavior:** SQRT auto-detection

**SQRT Auto-Detection:**
When a COMMON book's available stock drops below the square root of total stock,
it **temporarily** becomes "zarur" (required) until stock frees up.

```
Example:
  Total copies: 16
  Currently rented: 13
  Available: 3
  SQRT(16) = 4
  3 < 4? YES → this book is temporarily "zarur"

When a copy is returned:
  Available: 4
  4 < 4? NO → book returns to normal status
```

When a COMMON book becomes "zarur" via SQRT:
- Same restrictions as UNCOMMON apply (see below)
- This is NOT saved to DB — computed on-the-fly when checking rental eligibility
- The `/zarur` bot command and stats show these books

### UNCOMMON

- **Who sets it:** Admin manually via BookRule
- **Who can rent:** Only `verified` users AND user has < 5 active rentals at this library
- **Min completed rentals:** 0 (no minimum)
- **Always "zarur":** This rarity level is ALWAYS treated as "zarur"
- **Migration note:** Old `Book.few = 1` maps to this level

### RARE

- **Who sets it:** Admin manually via BookRule
- **Who can rent:** Only `verified` users
- **Min completed rentals:** 10 (at this library)
- **Max active of this rarity:** 1 per reader (cannot hold 2 RARE books simultaneously)

### RESTRICTED

- **Who sets it:** Admin manually via BookRule
- **Who can rent:** Only `verified` users
- **Min completed rentals:** 50 (at this library)
- **Max active of this rarity:** 1 per reader

## "Zarur" (Required Book) Blocking Rule

When a reader currently holds a "zarur" book (UNCOMMON/RARE/RESTRICTED, or COMMON
that triggered SQRT), the following restriction applies:

1. **Reader cannot rent another book** UNLESS:
   - Reader is `verified` AND
   - Reader has < 5 active rentals at this library
2. **Cannot hold 2 "zarur" books simultaneously** — regardless of verification status
3. This is checked during `POST /rentals` and `POST /rentals/check`

## Rental Eligibility Check Flow

```
1. Check user status (ACTIVE/BLOCKED) — blocked users need sufficient balance
2. Check if user has rejected rentals — if yes, cannot rent
3. Check rental strategy limit (per library):
   - completed >= 40 → max 5
   - completed >= 25 → max 4
   - completed >= 12 → max 3
   - completed >= 5  → max 2
   - default         → max 1
4. Check rarity restrictions for the REQUESTED book:
   a. UNCOMMON: user must be verified + < 5 active
   b. RARE: user must be verified + 10+ completed + max 1 RARE active
   c. RESTRICTED: user must be verified + 50+ completed + max 1 RESTRICTED active
   d. COMMON: if SQRT triggers → treat as UNCOMMON (step 4a)
5. Check "zarur" blocking:
   - Does user currently hold any "zarur" book?
   - If yes: user must be verified + < 5 active, AND cannot take another "zarur" book
```

## API Impact

| Endpoint | How rarity is used |
| -------- | ------------------ |
| `POST /rentals` | Full eligibility check (steps 1-5 above) |
| `POST /rentals/check` | Same check, returns validation result without creating |
| `GET /app/books/:id` | Shows rarity level + current "zarur" status |
| `GET /app/books/:id/statuses` | Shows availability + rarity info |
| Bot `/zarur` command | Lists all currently "zarur" books (UNCOMMON+ and SQRT-triggered) |
| `GET /stats` | Includes `fewBooks` list (UNCOMMON+ and SQRT-triggered) |

## BookRule Fields

```prisma
model BookRule {
  price        Int        @default(50000)    // Rental price in so'm
  rentDuration Int        @default(15)       // Max rental days
  rarity       BookRarity @default(COMMON)   // Rarity level
  // ... relations
}
```

## Migration from Old System

| Old | New |
| --- | --- |
| `Book.few = 1` (manually set) | `BookRule.rarity = UNCOMMON` |
| `Book.few = 2` (default) | `BookRule.rarity = COMMON` (SQRT still applies) |
| `Book.price` | `BookRule.price` |
| `Book.rentDuration` | `BookRule.rentDuration` |
| SQRT formula | Same formula, but now per-library via BookRule |
| `isRequiredBook()` check | Rarity check in rental eligibility flow |
