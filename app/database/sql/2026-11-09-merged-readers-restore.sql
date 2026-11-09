-- 2026-11-09 da birlashtirilgan kitobxonlar: har bir eski yozuvning blok/balans/izoh/verified
-- qiymati o'z kutubxonasidagi ulanishga qaytariladi (birlashtirishdan oldingi backup dan).
-- 2026-11-09-user-locations-library-fields.sql dan KEYIN ishga tushiriladi. Serverda:
--   psql "$DB" -f thisfile.sql   (/root/backups/dups/ dagi fayllar kerak)
\set ON_ERROR_STOP on
BEGIN;

\i /root/backups/dups/merge-map.sql

CREATE TEMP TABLE bu (LIKE users);
\copy bu FROM '/root/backups/dups/before-merge-users.csv' csv header

CREATE TEMP TABLE orig AS
SELECT coalesce(m.keep_id, bu.id) keep_id, bu.*
FROM bu LEFT JOIN m ON m.dup_id = bu.id
WHERE bu.id IN (SELECT dup_id FROM m UNION SELECT keep_id FROM m) AND bu."locationId" IS NOT NULL;

CREATE TEMP TABLE restored AS
SELECT keep_id, "locationId",
	min(coalesce(status, 1)) status,
	string_agg(nullif(trim("blockingReason"), ''), E'\n' ORDER BY id) reasons,
	sum(coalesce(balance, 0)) balance,
	string_agg(DISTINCT nullif(trim(extra), ''), E'\n') extra,
	bool_or(coalesce(verified, false)) verified
FROM orig GROUP BY 1, 2;

INSERT INTO user_locations ("userId", "locationId", "createdAt")
SELECT keep_id, "locationId", now() FROM restored
ON CONFLICT ("userId", "locationId") DO NOTHING;

UPDATE user_locations ul
SET status = r.status, "blockingReason" = r.reasons, balance = r.balance, extra = r.extra, verified = r.verified
FROM restored r
WHERE ul."userId" = r.keep_id AND ul."locationId" = r."locationId";

SELECT count(*) restored_links,
	count(*) FILTER (WHERE status = 0) blocked,
	sum(balance) balance_total
FROM restored;

COMMIT;
