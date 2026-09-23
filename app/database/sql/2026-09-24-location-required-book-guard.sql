-- locations: per-library toggle for the "required book" rent guard (default off, enabled for active libraries).
BEGIN;

ALTER TABLE locations ADD COLUMN IF NOT EXISTS "requiredBookGuard" BOOLEAN NOT NULL DEFAULT false;

UPDATE locations SET "requiredBookGuard" = true WHERE active = true AND "deletedAt" IS NULL;

COMMIT;
