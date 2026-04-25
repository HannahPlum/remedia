// Client-side wrapper — calls our Vercel proxy, never MusicBrainz directly.
// MusicBrainz rate-limit is 1 req/sec; debounce is set to 1100ms.

let debounceTimer = null;

/**
 * Search for music releases by album/artist name.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchMusic(query) {
  const res = await fetch(`/api/search/music?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Music search failed');
  const data = await res.json();
  return data.results ?? [];
}

/**
 * Fetch cover art URL for a given MusicBrainz release ID.
 * @param {string} mbid
 * @returns {Promise<string|null>}
 */
export async function fetchCoverArt(mbid) {
  if (!mbid) return null;
  const res = await fetch(`/api/art/music?mbid=${encodeURIComponent(mbid)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.coverUrl ?? null;
}

/**
 * Debounced version — calls onResults after 1100ms of silence
 * (respects MusicBrainz rate limit on the server side).
 * @param {string} query
 * @param {(results: Array) => void} onResults
 * @param {(err: Error) => void} [onError]
 */
export function searchMusicDebounced(query, onResults, onError) {
  clearTimeout(debounceTimer);
  if (!query || query.trim().length < 2) {
    onResults([]);
    return;
  }
  debounceTimer = setTimeout(async () => {
    try {
      const results = await searchMusic(query);
      onResults(results);
    } catch (err) {
      if (onError) onError(err);
    }
  }, 1100);
}
