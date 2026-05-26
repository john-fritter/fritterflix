export type LibraryMovie = {
  id: string | null;
  title: string;
  year: number | null;
  media_type: "movie";
  provider_ids: { tmdb: string | null; imdb: string | null };
  poster: string | null;
  added_at: number | null;
  runtime_minutes: number | null;
  genres: string[];
  user_data: { played: boolean; play_count: number; last_played_at: number | null; is_favorite: boolean };
};

export type MediaSearchState = "in_library" | "requested" | "available";

export type MediaSearchItem = {
  id: string | null;
  title: string;
  year: number | null;
  media_type: "movie";
  provider_ids: { tmdb: string | null; imdb: string | null };
  poster: string | null;
  library_state: MediaSearchState;
};

export type MediaSearchResponse = {
  items: MediaSearchItem[];
  q: string;
  source: string;
};

export type LibraryResponse = {
  items: LibraryMovie[];
  total: number;
  start_index: number;
  limit: number;
  source: string;
  sort: string;
  unwatched_first: boolean;
  warning?: string;
};

export type RecentlyWatchedResponse = {
  items: LibraryMovie[];
  total?: number;
};

function mediaProxyBaseUrl() {
  const baseUrl = process.env.MEDIA_PROXY_BASE_URL;
  if (!baseUrl) throw new Error("MEDIA_PROXY_BASE_URL is required");
  return baseUrl.replace(/\/$/, "");
}

export async function getMovie(id: string): Promise<LibraryMovie> {
  const url = `${mediaProxyBaseUrl()}/api/media/items/${encodeURIComponent(id)}`;
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`media-proxy item ${id} failed: ${response.status}`);
  return response.json();
}

const VALID_SORTS = ["recently_added", "title", "year"] as const;
export type LibrarySort = (typeof VALID_SORTS)[number];
const LIBRARY_PAGE_LIMIT = 200;
const LIBRARY_MAX_PAGES = 20;

export function validSort(raw: string | undefined): LibrarySort {
  return VALID_SORTS.includes(raw as LibrarySort) ? (raw as LibrarySort) : "recently_added";
}

type LibraryPageFetcher = (startIndex: number, limit: number) => Promise<LibraryResponse>;

export async function getPagedLibrary(fetchPage: LibraryPageFetcher): Promise<LibraryResponse> {
  const items: LibraryMovie[] = [];
  let firstPage: LibraryResponse | null = null;
  let latestPage: LibraryResponse | null = null;
  let hitPageCap = false;

  for (let page = 0; page < LIBRARY_MAX_PAGES; page += 1) {
    const startIndex = page * LIBRARY_PAGE_LIMIT;
    const pageResponse = await fetchPage(startIndex, LIBRARY_PAGE_LIMIT);
    firstPage ??= pageResponse;
    latestPage = pageResponse;
    items.push(...pageResponse.items);

    if (pageResponse.items.length === 0 || items.length >= pageResponse.total) {
      break;
    }

    if (page === LIBRARY_MAX_PAGES - 1) {
      hitPageCap = true;
    }
  }

  if (!firstPage || !latestPage) {
    return {
      items: [],
      total: 0,
      start_index: 0,
      limit: 0,
      source: "media-proxy",
      sort: "recently_added",
      unwatched_first: true,
    };
  }

  const capWarning = hitPageCap
    ? `Library pagination stopped after ${LIBRARY_MAX_PAGES} pages with ${items.length} of ${latestPage.total} items.`
    : undefined;
  const warning = [firstPage.warning, capWarning].filter(Boolean).join(" ") || undefined;

  return {
    ...firstPage,
    items,
    total: latestPage.total,
    start_index: 0,
    limit: items.length,
    warning,
  };
}

async function fetchLibraryPage(startIndex: number, limit: number, sort: LibrarySort): Promise<LibraryResponse> {
  const url = new URL(`${mediaProxyBaseUrl()}/api/media/library`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("start_index", String(startIndex));
  url.searchParams.set("sort", sort);
  if (sort === "recently_added") url.searchParams.set("unwatched_first", "true");

  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`media-proxy library failed: ${response.status}`);
  return response.json();
}

export async function getLibrary(sort: LibrarySort = "recently_added"): Promise<LibraryResponse> {
  return getPagedLibrary((startIndex, limit) => fetchLibraryPage(startIndex, limit, sort));
}

export async function getMediaSearch(q: string): Promise<MediaSearchResponse> {
  const url = new URL(`${mediaProxyBaseUrl()}/api/media/search`);
  url.searchParams.set("q", q);

  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`media-proxy search failed: ${response.status}`);
  return response.json();
}

export function proxiedPosterUrl(poster: string | null) {
  if (!poster) return null;
  if (poster.startsWith("/api/media/")) return poster;
  return poster;
}

export async function getRecentlyWatched(): Promise<RecentlyWatchedResponse> {
  const url = `${mediaProxyBaseUrl()}/api/media/recently-watched?type=movie`;
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`media-proxy recently-watched failed: ${response.status}`);
  return response.json();
}

export function mediaProxyUrlForPath(path: string, search: string) {
  return `${mediaProxyBaseUrl()}${path}${search}`;
}
