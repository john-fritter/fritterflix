-- Drop old WheelCandidate (keyed by jellyfinItemId) and recreate with multi-source support
DROP TABLE IF EXISTS "WheelCandidate";

CREATE TABLE "WheelCandidate" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "poster" TEXT,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WheelCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WheelCandidate_source_externalId_key" ON "WheelCandidate"("source", "externalId");

-- Add hiddenFromRecent to MovieRating
ALTER TABLE "MovieRating" ADD COLUMN "hiddenFromRecent" BOOLEAN NOT NULL DEFAULT false;
