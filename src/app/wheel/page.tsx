import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { proxiedPosterUrl } from "@/lib/mediaProxy";
import { Header } from "@/components/Header";
import { removeWheelCandidate } from "./actions";

export default async function WheelPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const candidates = await prisma.wheelCandidate.findMany({ orderBy: { addedAt: "desc" } });

  return (
    <main className="shell">
      <Header user={user} activePage="wheel" candidateCount={candidates.length} />

      {candidates.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          No candidates yet. Use the + badge on movie cards to add movies to the wheel.
        </p>
      ) : (
        <ul className="wheel-list">
          {candidates.map((c) => {
            const poster = proxiedPosterUrl(c.poster);
            const href = c.source === "jellyfin" ? `/movies/${c.externalId}` : null;
            return (
              <li key={c.id} className="wheel-item">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt={`${c.title} poster`} className="wheel-poster" />
                ) : (
                  <div className="wheel-poster no-poster" />
                )}
                {href ? (
                  <a href={href} className="wheel-title">{c.title}</a>
                ) : (
                  <span className="wheel-title">{c.title}</span>
                )}
                <form action={removeWheelCandidate}>
                  <input type="hidden" name="id" value={c.id} />
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
