// GET /api/videos — Babykelo's latest YouTube uploads, read from his public channel feed.
// The site merges anything new into the video vault, so fresh uploads appear without code changes.
const CHANNEL_ID = 'UClebAVQgaEvwTMAMIK2EnuQ'; // youtube.com/@babykelo0

const decode = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

export function parseFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1],
    title: decode((e.match(/<title>([^<]*)<\/title>/) || [, ''])[1]),
    published: (e.match(/<published>([^<]+)<\/published>/) || [])[1] || null,
    views: +((e.match(/<media:statistics views="(\d+)"/) || [, 0])[1]),
    short: /<link rel="alternate" href="[^"]*\/shorts\//.test(e),
  })).filter(v => v.id);
}

export default async () => {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, { headers: { 'user-agent': 'Mozilla/5.0 (babykelo-site)' } });
    if (!res.ok) throw new Error('feed ' + res.status);
    const videos = parseFeed(await res.text());
    return Response.json(videos, {
      // cache at the edge for 30 minutes so YouTube is hit rarely
      headers: { 'cache-control': 'public, max-age=300', 'netlify-cdn-cache-control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
    });
  } catch (err) {
    return Response.json({ error: String(err.message || err) }, { status: 502 });
  }
};

export const config = { path: '/api/videos' };
