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

export async function getLibrary(limit = 60): Promise<LibraryResponse> {
  const url = new URL(`${mediaProxyBaseUrl()}/api/media/library`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", "recently_added");
  url.searchParams.set("unwatched_first", "true");

  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`media-proxy library failed: ${response.status}`);
  return response.json();
}

export function proxiedPosterUrl(poster: string | null) {
  if (!poster) return null;
  if (poster.startsWith("/api/media/")) return poster;
  return poster;
}

export function mediaProxyUrlForPath(path: string, search: string) {
  return `${mediaProxyBaseUrl()}${path}${search}`;
}
