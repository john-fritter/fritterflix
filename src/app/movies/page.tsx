import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getLibrary, getAllRecentlyWatched, validSort } from "@/lib/mediaProxy";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { toggleWheelCandidate, hideFromRecent } from "./actions";
import { MoviesClient } from "./MoviesClient";
import type { LibraryMovie } from "@/lib/mediaProxy";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { sort: rawSort, q } = await searchParams;
  const sort = validSort(rawSort);
  const initialQuery = q?.trim() ?? "";

  const [library, candidates] = await Promise.all([
    getLibrary(sort),
    prisma.wheelCandidate.findMany({ select: { source: true, externalId: true } }),
  ]);

  const candidateKeys = candidates.map((c) => `${c.source}:${c.externalId}`);

  let recentlyWatched: LibraryMovie[] = [];
  try {
    const recentItems = await getAllRecentlyWatched();

    // Compute stable movieId for each item (tmdb:NNN preferred, Jellyfin GUID fallback)
    const movieIdForItem = new Map<string, string>();
    const movieIds: string[] = [];
    for (const item of recentItems) {
      if (!item.id) continue;
      const tmdb = item.provider_ids?.tmdb;
      const movieId = tmdb ? `tmdb:${tmdb}` : item.id;
      movieIdForItem.set(item.id, movieId);
      movieIds.push(movieId);
    }

    const ratings = await prisma.movieRating.findMany({
      where: { movieId: { in: movieIds } },
      select: { movieId: true, johnRating: true, airaRating: true, hiddenFromRecent: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.movieId, r]));

    recentlyWatched = recentItems.filter((m) => {
      if (!m.id) return false;
      const movieId = movieIdForItem.get(m.id);
      if (!movieId) return false;
      const r = ratingMap.get(movieId);
      if (r?.hiddenFromRecent) return false;
      if (r?.johnRating != null || r?.airaRating != null) return false;
      return true;
    });
  } catch {
    // recently-watched endpoint unavailable; section is omitted
  }

  return (
    <main className="shell">
      <Header user={user} activePage="movies" candidateCount={candidates.length} />

      <MoviesClient
        items={library.items}
        total={library.total}
        sort={sort}
        initialQuery={initialQuery}
        candidateKeys={candidateKeys}
        toggleWheelCandidate={toggleWheelCandidate}
        hideFromRecent={hideFromRecent}
        recentlyWatched={recentlyWatched}
        warning={library.warning}
      />
    </main>
  );
}
