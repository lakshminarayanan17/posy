# fleur

Draw someone flowers. Sketch a few blooms, wrap them in paper, add a note and
send the bouquet as a link. The recipient opens an envelope and watches each
flower get drawn again, stroke by stroke.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Short links need the two functions in `api/` and a Vercel Blob store
(`BLOB_READ_WRITE_TOKEN`). Without them the app still works and hands out
long `#b=` links instead.

## How sharing works

The whole bouquet (every stroke, the wrapping, the note) is packed into a
compact code:

- strokes are simplified (Ramer–Douglas–Peucker) and quantized to half-units
- written as zigzag varint deltas, then `deflate-raw` via `CompressionStream`
- base64url-encoded

A six-flower bouquet with a note is typically 2–3 KB, too long to paste
nicely, so `api/shorten.ts` saves the code to Vercel Blob under a 10-character
id (a hash of the code) and the link becomes `/b/<id>`. `api/bouquet.ts` reads
it back. If saving fails, the app falls back to the self-contained `#b=<code>`
link, and those links keep working forever. See `src/codec.ts` for the format.
Palette order is part of that format, so only append to the lists in `src/model.ts`.

## Map

| file | what |
| --- | --- |
| `src/views/draw.ts` | drawing card, inks, brushes, bouquet tray |
| `src/views/arrange.ts` | drag/tilt/resize flowers, paper and ribbon |
| `src/views/send.ts` | note card and link |
| `src/links.ts` | short links: save, look up, long-link fallback |
| `api/` | Vercel functions that save and fetch bouquets by short id |
| `src/views/receive.ts` | envelope, bloom replay, note |
| `src/bouquet.ts` | wrap/ribbon SVG and the stroke replay |
| `src/stroke.ts` | brush outlines (perfect-freehand), simplify, smoothing |
| `src/generate.ts` | "Surprise me" procedural flowers |
| `src/sparkle.ts` | shared SVG paints: glitter inks, patterned wrapping papers, CSS glitter & doily textures |
| `src/decor.ts` | die-cut stickers and washi tape strips |
