-- Migrate MovieRating to be keyed by stable movieId (tmdb:NNN preferred, Jellyfin GUID fallback).
-- Backfill script (scripts/backfill-tmdb-ids.ts) updates movieId from jellyfinItemId → tmdb:NNN
-- after this migration runs.

-- 1. Add movieId column seeded from existing jellyfinItemId
ALTER TABLE "MovieRating" ADD COLUMN "movieId" TEXT;
UPDATE "MovieRating" SET "movieId" = "jellyfinItemId";
ALTER TABLE "MovieRating" ALTER COLUMN "movieId" SET NOT NULL;

-- 2. Drop old primary key
ALTER TABLE "MovieRating" DROP CONSTRAINT "MovieRating_pkey";

-- 3. Add new primary key on movieId
ALTER TABLE "MovieRating" ADD CONSTRAINT "MovieRating_pkey" PRIMARY KEY ("movieId");

-- 4. Make jellyfinItemId nullable (was NOT NULL as old PK)
ALTER TABLE "MovieRating" ALTER COLUMN "jellyfinItemId" DROP NOT NULL;

-- 5. Add unique index on jellyfinItemId (existing values are unique since they were the PK)
CREATE UNIQUE INDEX "MovieRating_jellyfinItemId_key" ON "MovieRating"("jellyfinItemId");
