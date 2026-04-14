/**
 * Rental strategy — max active rentals per library based on completed count.
 * Ordered from highest threshold to lowest for matching.
 */
export const RENTAL_STRATEGY = [
  { completedMin: 40, maxActive: 5 },
  { completedMin: 25, maxActive: 4 },
  { completedMin: 12, maxActive: 3 },
  { completedMin: 5, maxActive: 2 },
  { completedMin: 0, maxActive: 1 },
] as const;

/** Days past issuedAt that triggers auto-block on return */
export const AUTO_BLOCK_DAYS_SINCE_ISSUED = 70;

/** Days past dueDate that triggers auto-block on return */
export const AUTO_BLOCK_DAYS_PAST_DUE = 10;
