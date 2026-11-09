-- rents."locationId": ijaraning kutubxonasi (endi stocks."locationId" emas).
-- Stock boshqa kutubxonaga o'tkazilsa ham ijara tarixi o'z kutubxonasida qoladi.
-- updatedAt o'zgartirilmaydi (ijaralar ro'yxati shu bo'yicha saralanadi).
BEGIN;

-- 1. hamma ijaralar: hozirgi stock kutubxonasi
UPDATE rents r
SET "locationId" = s."locationId"
FROM stocks s
WHERE s.id = r."stockId"
	AND r."locationId" IS NULL;

-- 2. Chorsu (1) dan Angren (9) ga SQL bilan o'tkazilgan stoklardagi Chorsu ijaralari:
-- kitobxon faqat Chorsuga ulangan (Angrenga ulanmagan) bo'lsa -> Chorsu (748 ta, 2021-03..2023-11)
UPDATE rents r
SET "locationId" = 1
FROM stocks s
WHERE s.id = r."stockId"
	AND s."locationId" = 9
	AND r."locationId" = 9
	AND EXISTS (SELECT 1 FROM user_locations ul WHERE ul."userId" = r."userId" AND ul."locationId" = 1)
	AND NOT EXISTS (SELECT 1 FROM user_locations ul WHERE ul."userId" = r."userId" AND ul."locationId" = 9);

COMMIT;

-- GET /rents: WHERE "locationId" = ? ORDER BY "updatedAt" DESC LIMIT 20
-- CONCURRENTLY cannot run inside a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rents_location_updated_at ON rents ("locationId", "updatedAt");
