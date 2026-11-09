-- kitobxonni bir nechta kutubxonaga ulash. users."locationId" asosiy kutubxona bo'lib qoladi
BEGIN;

CREATE TABLE IF NOT EXISTS user_locations (
	id SERIAL PRIMARY KEY,
	"userId" INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
	"locationId" INTEGER NOT NULL REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE,
	"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_locations_user_id_location_id
	ON user_locations ("userId", "locationId");
CREATE INDEX IF NOT EXISTS user_locations_location_id
	ON user_locations ("locationId");

-- mavjud kitobxonlar asosiy kutubxonasiga ulanadi (ulangan sana = ro'yxatdan o'tgan sana)
INSERT INTO user_locations ("userId", "locationId", "createdAt")
SELECT u.id, u."locationId", u."createdAt"
FROM users u
INNER JOIN locations l ON l.id = u."locationId"
WHERE u."locationId" IS NOT NULL
ON CONFLICT ("userId", "locationId") DO NOTHING;

COMMIT;
