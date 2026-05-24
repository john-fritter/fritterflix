import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getLibrary, proxiedPosterUrl } from "@/lib/mediaProxy";
import { prisma } from "@/lib/prisma";
import { updateMovieRating } from "./actions";

export default async function LibraryPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const library = await getLibrary(72);
  const movieIds = library.items.map((movie) => movie.id).filter((id): id is string => Boolean(id));
  const ratings = await prisma.movieRating.findMany({
    where: { jellyfinItemId: { in: movieIds } }
  });
  const ratingsByMovieId = new Map(ratings.map((rating) => [rating.jellyfinItemId, rating]));

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <h1>Fritterflix</h1>
          <p>Signed in as {user}. Movies only. Unwatched first, recently added next.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="logout" type="submit">Logout</button>
        </form>
      </header>

      <div className="meta">
        <span className="pill">{library.total} movies from Jellyfin</span>
        <span className="pill">source: media-proxy</span>
        <span className="pill">sort: unwatched-first / recently-added</span>
      </div>

      {library.warning ? <p className="error">{library.warning}</p> : null}

      <section className="grid" aria-label="Movie library">
        {library.items.map((movie) => {
          const poster = proxiedPosterUrl(movie.poster);
          const rating = movie.id ? ratingsByMovieId.get(movie.id) : null;
          return (
            <article className="movie-card" key={movie.id ?? movie.title}>
              <div className="poster">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element -- posters are already proxied/cached by media-proxy for this slice.
                  <img src={poster} alt={`${movie.title} poster`} loading="lazy" />
                ) : <span>No poster</span>}
              </div>
              <div className="movie-body">
                <h2 className="movie-title">{movie.title}</h2>
                <p className="movie-year">{movie.year ?? "Unknown year"}</p>
                {!movie.user_data.played ? <span className="badge">Unwatched</span> : null}
                {movie.id ? (
                  <form className="rating-form" action={updateMovieRating}>
                    <input type="hidden" name="jellyfinItemId" value={movie.id} />
                    <label>
                      John
                      <input
                        name="johnRating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        inputMode="decimal"
                        defaultValue={rating?.johnRating?.toString() ?? ""}
                        placeholder="-"
                      />
                    </label>
                    <label>
                      Aira
                      <input
                        name="airaRating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        inputMode="decimal"
                        defaultValue={rating?.airaRating?.toString() ?? ""}
                        placeholder="-"
                      />
                    </label>
                    <button type="submit">Save</button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
