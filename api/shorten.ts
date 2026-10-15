// POST a bouquet code, get back a short id. The id is a hash of the code, so
// wrapping the same bouquet twice gives the same link and stores it once.

import { put } from '@vercel/blob';

const MAX_CODE = 60_000;
const VERSION = 1;

/** A real bouquet code is base64url deflate-raw whose first byte is the format version. */
async function looksLikeBouquet(code: string) {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const out = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const raw = new Uint8Array(await new Response(out).arrayBuffer());
  return raw.length > 8 && raw[0] === VERSION;
}

function idFor(digest: ArrayBuffer) {
  const bin = String.fromCharCode(...new Uint8Array(digest));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').slice(0, 10);
}

export async function POST(request: Request) {
  const code = (await request.text()).trim();
  if (!code || code.length > MAX_CODE || !/^[A-Za-z0-9_-]+$/.test(code)) {
    return new Response('Not a bouquet', { status: 400 });
  }
  // Only store things that really are bouquets.
  const ok = await looksLikeBouquet(code).catch(() => false);
  if (!ok) return new Response('Not a bouquet', { status: 400 });
  const id = idFor(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)));
  await put(`b/${id}.txt`, code, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'text/plain',
  });
  return Response.json({ id });
}
