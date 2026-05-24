import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getMovie, proxiedPosterUrl } from "@/lib/mediaProxy";
import { prisma } from "@/lib/prisma";
import { StarRating } from "./StarRating";

function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  let movie;
  try {
    movie = await getMovie(id);
  } catch {
    notFound();
  }

  const rating = await prisma.movieRating.findUnique({ where: { jellyfinItemId: id } });
  const poster = proxiedPosterUrl(movie.poster);

  const johnRating = rating?.johnRating != null ? Number(rating.johnRating) : null;
  const airaRating = rating?.airaRating != null ? Number(rating.airaRating) : null;

  return (
    <main className="shell">
      <header className="header">
        <a href="/library" className="back-link">← Library</a>
        <form action="/api/auth/logout" method="post">
          <button className="logout" type="submit">Logout</button>
        </form>
      </header>

      <div className="detail-layout">
        <div className="detail-poster">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt={`${movie.title} poster`} />
          ) : (
            <div className="no-poster" style={{ aspectRatio: "2/3" }}>No poster</div>
          )}
        </div>

        <div className="detail-info">
          <h1 className="detail-title">{movie.title}</h1>

          <p className="detail-meta">
            {[movie.year, formatRuntime(movie.runtime_minutes)].filter(Boolean).join(" · ")}
          </p>

          {movie.genres.length > 0 && (
            <div className="detail-genres">
              {movie.genres.map((g) => (
                <span key={g} className="genre-tag">{g}</span>
              ))}
            </div>
          )}

          {!movie.user_data.played && (
            <span className="unwatched-badge">Unwatched</span>
          )}

          <div className="ratings-section">
            <div className="ratings-grid">
              <StarRating
                jellyfinItemId={id}
                field="johnRating"
                initialValue={johnRating}
                label="John"
              />
              <StarRating
                jellyfinItemId={id}
                field="airaRating"
                initialValue={airaRating}
                label="Aira"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
