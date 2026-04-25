// Vercel serverless function — proxies movie search to TMDB.
// The TMDB API key lives in process.env.TMDB_API_KEY (set in the
// Vercel dashboard). It never reaches the browser.

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const url = new URL('https://api.themoviedb.org/3/search/movie');
  url.searchParams.set('query', q.trim());
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('page', '1');

  const tmdbRes = await fetch(url.toString());
  if (!tmdbRes.ok) {
    return res.status(tmdbRes.status).json({ error: 'Upstream error' });
  }

  const data = await tmdbRes.json();

  // Map to the shape the client expects; never forward raw TMDB response
  const results = (data.results ?? []).slice(0, 10).map(m => ({
    id:       m.id,
    title:    m.title,
    year:     m.release_date ? m.release_date.slice(0, 4) : null,
    overview: m.overview,
    coverUrl: m.poster_path
      ? `https://image.tmdb.org/t/p/w200${m.poster_path}`
      : null,
    director: null, // populated via /movie/:id credits — added in Phase 4
  }));

  res.status(200).json({ results });
}
