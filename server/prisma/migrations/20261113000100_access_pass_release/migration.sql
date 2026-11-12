-- Moves the per-CV purchases over to the access pass (docs/PAYMENTS.md, "Release").

-- A guest's payments were found through their CV; a pass is found through its owner.
UPDATE "Payment" AS p
SET "guestKeyHash" = c."guestKeyHash"
FROM "Cv" AS c
WHERE p."cvId" = c."id" AND p."userId" IS NULL AND c."userId" IS NULL AND c."guestKeyHash" IS NOT NULL;

-- Whoever paid for a CV under the old model gets 21 days of full access from this release: a
-- `grant` payment of 0, settled now. One per owner (account, or guest browser).
INSERT INTO "Payment" ("id", "userId", "guestKeyHash", "amount", "currency", "gateway", "status", "paidAt", "createdAt", "updatedAt")
SELECT 'grant-' || md5(owner."key"), owner."userId", owner."guestKeyHash", 0, 'AMD', 'grant', 'succeeded', now(), now(), now()
FROM (
  SELECT DISTINCT
    COALESCE("userId", 'guest:' || "guestKeyHash") AS "key",
    "userId",
    CASE WHEN "userId" IS NULL THEN "guestKeyHash" END AS "guestKeyHash"
  FROM "Cv"
  WHERE "paidAt" IS NOT NULL AND ("userId" IS NOT NULL OR "guestKeyHash" IS NOT NULL)
) AS owner;

-- Nothing is bought per CV any more.
ALTER TABLE "Cv" DROP COLUMN "paidAt";
