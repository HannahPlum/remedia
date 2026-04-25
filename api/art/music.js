// Vercel serverless function — fetches cover art URL from the
// Cover Art Archive JSON API for a given MusicBrainz release ID.

const CAA_BASE   = 'https://coverartarchive.org/release';
const USER_AGENT = 'Remedia/1.0 (ha537956@ucf.edu)';

export default async function handler(req, res) {
  const { mbid } = req.query;

  if (!mbid) {
    return res.status(400).json({ coverUrl: null });
  }

  try {
    const caaRes = await fetch(`${CAA_BASE}/${mbid}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!caaRes.ok) {
      return res.status(200).json({ coverUrl: null });
    }

    const data = await caaRes.json();

    // Find the front cover image, fall back to first image available
    const images = data.images ?? [];
    const front  = images.find(img => img.front) ?? images[0];

    if (!front) {
      return res.status(200).json({ coverUrl: null });
    }

    // Prefer the 250px thumbnail, fall back to full image
    const coverUrl = front.thumbnails?.['250'] ?? front.thumbnails?.small ?? front.image ?? null;

    return res.status(200).json({ coverUrl });
  } catch {
    return res.status(200).json({ coverUrl: null });
  }
}
