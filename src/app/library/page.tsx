import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getLibrary, validSort } from "@/lib/mediaProxy";
import { prisma } from "@/lib/prisma";
import { toggleWheelCandidate } from "./actions";
import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage({
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
    prisma.wheelCandidate.findMany({ select: { jellyfinItemId: true } }),
  ]);

  const candidateIds = candidates.map((c) => c.jellyfinItemId);

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <h1>Fritterflix</h1>
          <p>Signed in as {user}.</p>
        </div>
        <nav className="header-nav">
          <a href="/wheel" className="nav-link">
            Wheel{candidateIds.length > 0 ? ` (${candidateIds.length})` : ""}
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="logout" type="submit">Logout</button>
          </form>
        </nav>
      </header>

      <LibraryClient
        items={library.items}
        total={library.total}
        sort={sort}
        initialQuery={initialQuery}
        candidateIds={candidateIds}
        toggleWheelCandidate={toggleWheelCandidate}
        warning={library.warning}
      />
    </main>
  );
}
