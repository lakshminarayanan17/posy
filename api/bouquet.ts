// GET ?id=… returns the bouquet code saved under a short id.

import { head } from '@vercel/blob';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(id)) return new Response('Not found', { status: 404 });
  try {
    const blob = await head(`b/${id}.txt`);
    const res = await fetch(blob.url);
    if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
    // Ids are content hashes, so a bouquet never changes once saved.
    return new Response(await res.text(), {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
