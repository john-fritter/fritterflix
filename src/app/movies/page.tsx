import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getLibrary, getRecentlyWatched, validSort } from "@/lib/mediaProxy";
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
    const rwResponse = await getRecentlyWatched();
    const recentItems = rwResponse.items ?? [];

    const recentIds = recentItems
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id));

    const ratings = await prisma.movieRating.findMany({
      where: { jellyfinItemId: { in: recentIds } },
      select: { jellyfinItemId: true, johnRating: true, airaRating: true, hiddenFromRecent: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.jellyfinItemId, r]));

    recentlyWatched = recentItems
      .filter((m) => {
        if (!m.id) return false;
        const r = ratingMap.get(m.id);
        if (r?.hiddenFromRecent) return false;
        if (r?.johnRating != null || r?.airaRating != null) return false;
        return true;
      })
      .slice(0, 12);
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
