-- addresses: reference regions/towns by id (regionId, townId), keep text columns as denormalized names.
BEGIN;

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS "regionId" INTEGER REFERENCES regions(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS "townId" INTEGER REFERENCES towns(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE addresses ALTER COLUMN region DROP NOT NULL;

-- region: numeric text -> id (only if that region exists)
UPDATE addresses a
SET "regionId" = r.id
FROM regions r
WHERE a."regionId" IS NULL
	AND trim(a.region) ~ '^[0-9]+$'
	AND r.id = trim(a.region)::int;

-- region: name match (case/space-insensitive)
UPDATE addresses a
SET "regionId" = r.id
FROM regions r
WHERE a."regionId" IS NULL
	AND a.region IS NOT NULL
	AND trim(a.region) !~ '^[0-9]+$'
	AND lower(trim(r.name)) = lower(trim(a.region));

-- town: numeric text -> id (only if that town exists)
UPDATE addresses a
SET "townId" = t.id
FROM towns t
WHERE a."townId" IS NULL
	AND trim(a.town) ~ '^[0-9]+$'
	AND t.id = trim(a.town)::int;

-- town: name match (case/space-insensitive)
UPDATE addresses a
SET "townId" = t.id
FROM towns t
WHERE a."townId" IS NULL
	AND a.town IS NOT NULL
	AND trim(a.town) !~ '^[0-9]+$'
	AND lower(trim(t.name)) = lower(trim(a.town));

-- canonical names for resolved rows
UPDATE addresses a
SET region = r.name
FROM regions r
WHERE a."regionId" = r.id
	AND a.region IS DISTINCT FROM r.name;

UPDATE addresses a
SET town = t.name
FROM towns t
WHERE a."townId" = t.id
	AND a.town IS DISTINCT FROM t.name;

COMMIT;

-- Check unresolved rows:
-- SELECT region, count(*) FROM addresses WHERE "regionId" IS NULL GROUP BY region ORDER BY 2 DESC;
-- SELECT town, count(*) FROM addresses WHERE "townId" IS NULL AND town IS NOT NULL GROUP BY town ORDER BY 2 DESC;

-- Orphan cleanup (run separately, after review):
-- DELETE FROM addresses a
-- WHERE a."locationId" IS NULL
-- 	AND NOT EXISTS (SELECT 1 FROM users u WHERE u."addressId" = a.id);
