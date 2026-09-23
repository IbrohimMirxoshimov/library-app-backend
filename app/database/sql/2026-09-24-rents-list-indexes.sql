-- rents: GET /rents default sort (ORDER BY "updatedAt" DESC LIMIT 20).
-- Without it Postgres sorts every rent of the library (~94k rows for library 1) and spills to disk (work_mem 4MB).
-- CONCURRENTLY cannot run inside a transaction, so no BEGIN/COMMIT here.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rents_updated_at ON rents ("updatedAt");

-- Check (should show "Index Scan Backward using idx_rents_updated_at"):
-- EXPLAIN SELECT * FROM rents r JOIN stocks s ON s.id = r."stockId" AND s."locationId" = 1
-- 	WHERE r."deletedAt" IS NULL ORDER BY r."updatedAt" DESC LIMIT 20;
