// Client-side wrapper — calls our Vercel proxy, never TMDB directly.

let debounceTimer = null;

/**
 * Search for movies by title. Returns an array of result objects.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchMovies(query) {
  const res = await fetch(`/api/search/movies?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Movie search failed');
  const data = await res.json();
  return data.results ?? [];
}

/**
 * Debounced version — calls onResults after 350ms of silence.
 * @param {string} query
 * @param {(results: Array) => void} onResults
 * @param {(err: Error) => void} [onError]
 */
export function searchMoviesDebounced(query, onResults, onError) {
  clearTimeout(debounceTimer);
  if (!query || query.trim().length < 2) {
    onResults([]);
    return;
  }
  debounceTimer = setTimeout(async () => {
    try {
      const results = await searchMovies(query);
      onResults(results);
    } catch (err) {
      if (onError) onError(err);
    }
  }, 350);
}
