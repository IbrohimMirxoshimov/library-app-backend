-- blok, balans, izoh va ishonchlilik endi har bir kutubxonada alohida (user_locations).
-- users dagi eski ustunlar o'chirilmaydi, kitobxonlar uchun ishlatilmaydi (xodimlar status i qoladi)
BEGIN;

ALTER TABLE user_locations
	ADD COLUMN IF NOT EXISTS status INTEGER NOT NULL DEFAULT 1,
	ADD COLUMN IF NOT EXISTS "blockingReason" TEXT,
	ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS extra TEXT,
	ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- hozirgi qiymatlar asosiy kutubxonadagi ulanishga ko'chiriladi
UPDATE user_locations ul
SET status = coalesce(u.status, 1),
	"blockingReason" = u."blockingReason",
	balance = coalesce(u.balance, 0),
	extra = u.extra,
	verified = coalesce(u.verified, false)
FROM users u
WHERE u.id = ul."userId" AND ul."locationId" = u."locationId";

COMMIT;
