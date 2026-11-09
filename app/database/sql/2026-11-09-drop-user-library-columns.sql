-- kitobxonning blok sababi, balans, izoh va verified endi user_locations da (kutubxona bo'yicha).
-- users.status qoladi (xodimlar uchun). Qiymatlar 2026-11-09 dagi to'liq backup larda bor.
BEGIN;

ALTER TABLE users
	DROP COLUMN IF EXISTS "blockingReason",
	DROP COLUMN IF EXISTS balance,
	DROP COLUMN IF EXISTS extra,
	DROP COLUMN IF EXISTS verified;

COMMIT;
