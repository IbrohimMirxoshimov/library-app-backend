-- rents: index on userId for per-user lookups (active rents of a reader, rent strategy counts).
-- CONCURRENTLY cannot run inside a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rents_user_id ON rents ("userId");
