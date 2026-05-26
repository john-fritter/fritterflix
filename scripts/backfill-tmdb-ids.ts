/**
 * Backfill MovieRating.movieId from Jellyfin GUID → tmdb:NNN where TMDB ID is available.
 *
 * Run after the 20260526000100_movie_rating_tmdb_id migration:
 *   npx tsx scripts/backfill-tmdb-ids.ts
 *
 * Requires DATABASE_URL and MEDIA_PROXY_BASE_URL in the environment.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchAllLibraryItems() {
  const baseUrl = process.env.MEDIA_PROXY_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("MEDIA_PROXY_BASE_URL is required");

  type Item = { id: string | null; provider_ids: { tmdb: string | null; imdb: string | null } };
  const allItems: Item[] = [];
  const limit = 200;
  let startIndex = 0;
  let total = Infinity;

  while (allItems.length < total) {
    const url = new URL(`${baseUrl}/api/media/library`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("start_index", String(startIndex));

    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Library fetch failed: ${res.status}`);
    const data = await res.json();

    const items: Item[] = data.items ?? [];
    allItems.push(...items);
    total = data.total ?? allItems.length;

    if (items.length === 0 || allItems.length >= total) break;
    startIndex += items.length;
  }

  return allItems;
}

async function main() {
  const libraryItems = await fetchAllLibraryItems();

  const tmdbById = new Map<string, string>();
  let noTmdb = 0;
  for (const item of libraryItems) {
    if (item.id && item.provider_ids?.tmdb) {
      tmdbById.set(item.id, item.provider_ids.tmdb);
    } else {
      noTmdb++;
    }
  }

  console.log(
    `Library: ${libraryItems.length} items, ${tmdbById.size} with TMDB IDs, ${noTmdb} without`
  );

  const ratings = await prisma.movieRating.findMany({
    select: { movieId: true, jellyfinItemId: true },
  });

  console.log(`Ratings to process: ${ratings.length}`);

  let updated = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const rating of ratings) {
    const jfId = rating.jellyfinItemId;
    if (!jfId) {
      skipped++;
      continue;
    }

    const tmdbId = tmdbById.get(jfId);
    if (!tmdbId) {
      console.log(`  no TMDB ID for jf:${jfId} — keeping movieId as-is`);
      skipped++;
      continue;
    }

    const newMovieId = `tmdb:${tmdbId}`;
    if (rating.movieId === newMovieId) {
      skipped++;
      continue;
    }

    // Check if target movieId already exists (shouldn't happen on first run)
    const existing = await prisma.movieRating.findUnique({ where: { movieId: newMovieId } });
    if (existing) {
      console.warn(`  CONFLICT: ${newMovieId} already exists — skipping ${rating.movieId}`);
      conflicts++;
      continue;
    }

    await prisma.movieRating.update({
      where: { movieId: rating.movieId },
      data: { movieId: newMovieId },
    });
    console.log(`  ${rating.movieId} → ${newMovieId}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${conflicts} conflicts`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
