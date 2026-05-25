"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LibraryMovie, MediaSearchItem, MediaSearchState } from "@/lib/mediaProxy";

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

type UnifiedMovie = (LibraryMovie | MediaSearchItem) & {
  library_state?: MediaSearchState;
};

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
  const [searchItems, setSearchItems] = useState<MediaSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [openRequestMenuFor, setOpenRequestMenuFor] = useState<string | null>(null);
  const candidateSet = new Set(candidateIds);
  const requestMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!query.trim()) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const response = await fetch(`/api/media/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Search failed (${response.status})`);
        }

        const json = (await response.json()) as { items?: MediaSearchItem[] };
        setSearchItems(Array.isArray(json.items) ? json.items : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Search failed.";
        setSearchError(message);
        setSearchItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!requestMenuRef.current) return;
      if (!requestMenuRef.current.contains(e.target as Node)) {
        setOpenRequestMenuFor(null);
      }
    }

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const showingSearch = Boolean(query.trim());
  const displayItems: UnifiedMovie[] = useMemo(() => {
    if (showingSearch) return searchItems;
    return items.map((movie) => ({ ...movie, library_state: "in_library" as const }));
  }, [items, searchItems, showingSearch]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setSearchItems([]);
      setSearchLoading(false);
      setSearchError(null);
      setOpenRequestMenuFor(null);
    }
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
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
    if (query.trim()) params.set("q", query.trim());
    return `?${params.toString()}`;
  }

  function renderStatusBadge(movie: UnifiedMovie, key: string) {
    const state = movie.library_state ?? "in_library";

    if (state === "in_library") {
      return (
        <span className="status-badge in-library" aria-label="In library" title="In library">
          ✓
        </span>
      );
    }

    if (state === "requested") {
      return (
        <span className="status-badge requested" aria-label="Requested" title="Requested">
          •
        </span>
      );
    }

    const open = openRequestMenuFor === key;

    return (
      <div className="status-menu-wrap" ref={open ? requestMenuRef : undefined}>
        <button
          type="button"
          className="status-badge available"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Available to request"
          title="Available to request"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenRequestMenuFor(open ? null : key);
          }}
        >
          ?
        </button>
        {open ? (
          <div className="status-dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Wire this to the media request endpoint when request flow is implemented.
                console.log("Request intent", { mode: "standard", id: movie.id, title: movie.title });
                setOpenRequestMenuFor(null);
              }}
            >
              Request
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Wire this to the media request endpoint when 4K request flow is implemented.
                console.log("Request intent", { mode: "4k", id: movie.id, title: movie.title });
                setOpenRequestMenuFor(null);
              }}
            >
              Request 4K
            </button>
          </div>
        ) : null}
      </div>
    );
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
        {showingSearch ? (
          <span className="pill">
            {searchLoading ? "Searching…" : `${displayItems.length} matching`} &lsquo;{query.trim()}&rsquo;
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
      {searchError ? <p className="error">{searchError}</p> : null}

      <section className="grid" aria-label="Movie library">
        {displayItems.map((movie) => {
          const poster = movie.poster ?? null;
          const isLibrary = (movie.library_state ?? "in_library") === "in_library";
          const isCandidate = movie.id ? candidateSet.has(movie.id) : false;
          const key = `${movie.id ?? "no-id"}:${movie.title}`;

          return (
            <article className="movie-card" key={key}>
              <div className="status-badge-wrap">{renderStatusBadge(movie, key)}</div>

              {isLibrary && movie.id ? (
                <a href={`/movies/${movie.id}`} className="poster-link" aria-label={movie.title}>
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
              ) : (
                <div className="poster-link" aria-label={movie.title}>
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
                </div>
              )}

              {isLibrary && movie.id && (
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
