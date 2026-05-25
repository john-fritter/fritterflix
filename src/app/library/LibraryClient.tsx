"use client";

import { useState } from "react";
import type { LibraryMovie } from "@/lib/mediaProxy";

const SORT_LABELS: Record<string, string> = {
  recently_added: "Recently added",
  title: "Title A–Z",
  year: "Year (newest)",
};

interface Props {
  items: LibraryMovie[];
  total: number;
  sort: string;
  initialQuery: string;
  candidateIds: string[];
  toggleWheelCandidate: (formData: FormData) => Promise<void>;
  warning?: string;
}

export function LibraryClient({
  items,
  total,
  sort,
  initialQuery,
  candidateIds,
  toggleWheelCandidate,
  warning,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const candidateSet = new Set(candidateIds);

  const filtered = query
    ? items.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
    : items;

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }

  function sortHref(sortValue: string) {
    const params = new URLSearchParams();
    params.set("sort", sortValue);
    if (query) params.set("q", query);
    return `?${params.toString()}`;
  }

  return (
    <>
      <div className="search-bar">
        <input
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search movies…"
          aria-label="Search movies"
          className="search-input"
          autoComplete="off"
        />
      </div>

      <div className="meta">
        {query ? (
          <span className="pill">
            {filtered.length} of {total} matching &lsquo;{query}&rsquo;
          </span>
        ) : (
          <span className="pill">{total} movies from Jellyfin</span>
        )}
      </div>

      <div className="sort-chips" role="group" aria-label="Sort order">
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <a
            key={value}
            href={sortHref(value)}
            className={`sort-chip${sort === value ? " active" : ""}`}
            aria-current={sort === value ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </div>

      {warning ? <p className="error">{warning}</p> : null}

      <section className="grid" aria-label="Movie library">
        {filtered.map((movie) => {
          const poster = movie.poster ?? null;
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
    </>
  );
}
