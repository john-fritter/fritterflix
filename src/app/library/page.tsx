import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getLibrary, proxiedPosterUrl } from "@/lib/mediaProxy";
import { prisma } from "@/lib/prisma";
import { toggleWheelCandidate } from "./actions";

export default async function LibraryPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [library, candidates] = await Promise.all([
    getLibrary(72),
    prisma.wheelCandidate.findMany({ select: { jellyfinItemId: true } })
  ]);

  const candidateSet = new Set(candidates.map((c) => c.jellyfinItemId));

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <h1>Fritterflix</h1>
          <p>Signed in as {user}.</p>
        </div>
        <nav className="header-nav">
          <a href="/wheel" className="nav-link">
            Wheel {candidateSet.size > 0 ? `(${candidateSet.size})` : ""}
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="logout" type="submit">Logout</button>
          </form>
        </nav>
      </header>

      <div className="meta">
        <span className="pill">{library.total} movies from Jellyfin</span>
        <span className="pill">unwatched-first · recently-added</span>
      </div>

      {library.warning ? <p className="error">{library.warning}</p> : null}

      <section className="grid" aria-label="Movie library">
        {library.items.map((movie) => {
          const poster = proxiedPosterUrl(movie.poster);
          const isCandidate = movie.id ? candidateSet.has(movie.id) : false;
          return (
            <article className="movie-card" key={movie.id ?? movie.title}>
              <a
                href={movie.id ? `/movies/${movie.id}` : undefined}
                className="poster-link"
                aria-label={movie.title}
              >
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt={`${movie.title} poster`} loading="lazy" />
                ) : (
                  <span className="no-poster">No poster</span>
                )}
                <div className="card-hover-info" aria-hidden="true">
                  <span className="card-title">{movie.title}</span>
                  {movie.year && <span className="card-year">{movie.year}</span>}
                </div>
              </a>
              {movie.id && (
                <form className="badge-form" action={toggleWheelCandidate}>
                  <input type="hidden" name="jellyfinItemId" value={movie.id} />
                  <input type="hidden" name="title" value={movie.title} />
                  <input type="hidden" name="poster" value={poster ?? ""} />
                  <button
                    type="submit"
                    className={`plus-badge${isCandidate ? " active" : ""}`}
                    aria-label={isCandidate ? "Remove from wheel" : "Add to wheel"}
                  >
                    {isCandidate ? "✓" : "+"}
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
