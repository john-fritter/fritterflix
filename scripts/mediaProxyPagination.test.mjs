import assert from "node:assert/strict";
import { getPagedLibrary } from "../src/lib/mediaProxy.ts";

function movie(id) {
  return {
    id: String(id),
    title: `Movie ${id}`,
    year: null,
    media_type: "movie",
    provider_ids: { tmdb: null, imdb: null },
    poster: null,
    added_at: null,
    runtime_minutes: null,
    genres: [],
    user_data: { played: false, play_count: 0, last_played_at: null, is_favorite: false },
  };
}

function page(items, total, startIndex) {
  return {
    items,
    total,
    start_index: startIndex,
    limit: 200,
    source: "jellyfin",
    sort: "recently_added",
    unwatched_first: true,
    warning: startIndex === 0 ? "endpoint warning" : undefined,
  };
}

async function testCollectsUntilTotal() {
  const calls = [];
  const pages = [
    page(Array.from({ length: 200 }, (_, index) => movie(index)), 450, 0),
    page(Array.from({ length: 200 }, (_, index) => movie(index + 200)), 450, 200),
    page(Array.from({ length: 50 }, (_, index) => movie(index + 400)), 450, 400),
  ];

  const result = await getPagedLibrary(async (startIndex, limit) => {
    calls.push({ startIndex, limit });
    return pages[calls.length - 1];
  });

  assert.deepEqual(calls, [
    { startIndex: 0, limit: 200 },
    { startIndex: 200, limit: 200 },
    { startIndex: 400, limit: 200 },
  ]);
  assert.equal(result.items.length, 450);
  assert.equal(result.total, 450);
  assert.equal(result.start_index, 0);
  assert.equal(result.limit, 450);
  assert.equal(result.warning, "endpoint warning");
}

async function testStopsOnEmptyPage() {
  const calls = [];
  const pages = [
    page(Array.from({ length: 200 }, (_, index) => movie(index)), 500, 0),
    page([], 500, 200),
  ];

  const result = await getPagedLibrary(async (startIndex, limit) => {
    calls.push({ startIndex, limit });
    return pages[calls.length - 1];
  });

  assert.deepEqual(calls, [
    { startIndex: 0, limit: 200 },
    { startIndex: 200, limit: 200 },
  ]);
  assert.equal(result.items.length, 200);
  assert.equal(result.total, 500);
}

async function testStopsAtSafetyCap() {
  const calls = [];

  const result = await getPagedLibrary(async (startIndex, limit) => {
    calls.push({ startIndex, limit });
    return page(Array.from({ length: 200 }, (_, index) => movie(startIndex + index)), 5000, startIndex);
  });

  assert.equal(calls.length, 20);
  assert.deepEqual(calls.at(-1), { startIndex: 3800, limit: 200 });
  assert.equal(result.items.length, 4000);
  assert.equal(result.total, 5000);
  assert.match(result.warning ?? "", /stopped after 20 pages/);
  assert.match(result.warning ?? "", /endpoint warning/);
}

await testCollectsUntilTotal();
await testStopsOnEmptyPage();
await testStopsAtSafetyCap();

console.log("mediaProxy pagination tests passed");
