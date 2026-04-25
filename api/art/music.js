// Vercel serverless function — fetches cover art URL from the
// Cover Art Archive for a given MusicBrainz release ID (mbid).

const CAA_BASE = 'https://coverartarchive.org/release';

export default async function handler(req, res) {
  const { mbid } = req.query;

  if (!mbid) {
    return res.status(400).json({ error: 'mbid required' });
  }

  const caaRes = await fetch(`${CAA_BASE}/${mbid}/front-250`, {
    redirect: 'follow',
  });

  if (!caaRes.ok) {
    // No art available — return null rather than erroring
    return res.status(200).json({ coverUrl: null });
  }

  // CAA redirects to the actual image URL; return that URL to the client
  return res.status(200).json({ coverUrl: caaRes.url });
}
