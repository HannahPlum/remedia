// Vercel serverless function — proxies album search to MusicBrainz.
// MusicBrainz requires no API key, but does require a descriptive
// User-Agent. Running server-side keeps that header off the client
// and lets us add the Cover Art Archive lookup cleanly.

const MB_BASE    = 'https://musicbrainz.org/ws/2';
const CAA_BASE   = 'https://coverartarchive.org/release';
const USER_AGENT = 'Remedia/1.0 (ha537956@ucf.edu)';

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const url = new URL(`${MB_BASE}/release/`);
  url.searchParams.set('query', q.trim());
  url.searchParams.set('fmt', 'json');
  url.searchParams.set('limit', '10');

  const mbRes = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!mbRes.ok) {
    return res.status(mbRes.status).json({ error: 'Upstream error' });
  }

  const data = await mbRes.json();

  const results = (data.releases ?? []).slice(0, 10).map(r => ({
    mbid:     r.id,
    title:    r.title,
    artist:   r['artist-credit']?.[0]?.name ?? null,
    year:     r.date ? r.date.slice(0, 4) : null,
    coverUrl: null, // fetched lazily by client via /api/art/music?mbid=
    genre:    r.genres?.[0]?.name ?? null,
    trackCount: r['track-count'] ?? null,
  }));

  res.status(200).json({ results });
}
