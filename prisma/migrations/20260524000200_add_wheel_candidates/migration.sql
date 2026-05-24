CREATE TABLE "WheelCandidate" (
  "jellyfinItemId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "poster" TEXT,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WheelCandidate_pkey" PRIMARY KEY ("jellyfinItemId")
);
