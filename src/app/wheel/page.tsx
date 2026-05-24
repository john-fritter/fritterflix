import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { proxiedPosterUrl } from "@/lib/mediaProxy";
import { removeWheelCandidate } from "./actions";

export default async function WheelPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const candidates = await prisma.wheelCandidate.findMany({ orderBy: { addedAt: "desc" } });

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <h1>Wheel</h1>
          <p>{candidates.length} {candidates.length === 1 ? "candidate" : "candidates"} in the pool</p>
        </div>
        <nav className="header-nav">
          <a href="/library" className="nav-link">← Library</a>
          <form action="/api/auth/logout" method="post">
            <button className="logout" type="submit">Logout</button>
          </form>
        </nav>
      </header>

      {candidates.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          No candidates yet. Use the + badge on library cards to add movies to the wheel.
        </p>
      ) : (
        <ul className="wheel-list">
          {candidates.map((c) => {
            const poster = proxiedPosterUrl(c.poster);
            return (
              <li key={c.jellyfinItemId} className="wheel-item">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt={`${c.title} poster`} className="wheel-poster" />
                ) : (
                  <div className="wheel-poster no-poster" />
                )}
                <a href={`/movies/${c.jellyfinItemId}`} className="wheel-title">{c.title}</a>
                <form action={removeWheelCandidate}>
                  <input type="hidden" name="jellyfinItemId" value={c.jellyfinItemId} />
                  <button type="submit" className="remove-btn">Remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
