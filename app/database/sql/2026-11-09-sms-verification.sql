-- users.phoneVerified: boolean -> tasdiqlangan vaqt (hamma qaytadan tasdiqlaydi)
-- locations.smsVerification: ijara qo'shishda sms bilan raqam tasdiqlash (hozircha faqat id=1)
BEGIN;

ALTER TABLE users ALTER COLUMN "phoneVerified" DROP DEFAULT;
ALTER TABLE users ALTER COLUMN "phoneVerified" TYPE TIMESTAMP WITH TIME ZONE USING NULL;

ALTER TABLE locations ADD COLUMN IF NOT EXISTS "smsVerification" BOOLEAN NOT NULL DEFAULT false;

UPDATE locations SET "smsVerification" = true WHERE id = 1;

COMMIT;
