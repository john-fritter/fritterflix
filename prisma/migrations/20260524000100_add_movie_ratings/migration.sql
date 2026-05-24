CREATE TABLE "MovieRating" (
  "jellyfinItemId" TEXT NOT NULL,
  "johnRating" DECIMAL(3,1),
  "airaRating" DECIMAL(3,1),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MovieRating_pkey" PRIMARY KEY ("jellyfinItemId")
);
