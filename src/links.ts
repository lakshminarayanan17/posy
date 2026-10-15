// Short links: the bouquet code is saved server-side under a short id, so
// the link is /b/<id> instead of a few kilobytes of #b=… If saving fails
// (offline, local dev without the API) we fall back to the long link,
// which still works on its own.

export const HOME = import.meta.env.BASE_URL;

export const longLink = (code: string) => `${location.origin}${HOME}#b=${code}`;
export const shortLink = (id: string) => `${location.origin}${HOME}b/${id}`;

/** The short id in the current path, if this is a /b/<id> link. */
export function shortId(): string | null {
  const m = location.pathname.slice(HOME.length - 1).match(/^\/b\/([A-Za-z0-9_-]{6,16})\/?$/);
  return m ? m[1] : null;
}

export async function shorten(code: string): Promise<string | null> {
  try {
    const res = await fetch(`${HOME}api/shorten`, { method: 'POST', body: code, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const { id } = (await res.json()) as { id?: string };
    return id ? shortLink(id) : null;
  } catch {
    return null;
  }
}

export async function lookup(id: string): Promise<string> {
  const res = await fetch(`${HOME}api/bouquet?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`No bouquet saved under ${id}`);
  return (await res.text()).trim();
}
