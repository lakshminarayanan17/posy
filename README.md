# fleur

Draw someone flowers. Sketch a few blooms, wrap them in paper, add a note and
send the bouquet as a link. The recipient opens an envelope and watches each
flower get drawn again, stroke by stroke.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ — host it anywhere
```

## How sharing works

There is no backend. The whole bouquet (every stroke, the wrapping, the note)
is packed into the link's `#hash`:

- strokes are simplified (Ramer–Douglas–Peucker) and quantized to half-units
- written as zigzag varint deltas, then `deflate-raw` via `CompressionStream`
- base64url-encoded into `#b=…`

A six-flower bouquet with a note is typically 2–3 KB. Because it lives in the
hash, the drawing never reaches a server. See `src/codec.ts` for the format.
Palette order is part of that format, so only append to the lists in `src/model.ts`.

## Map

| file | what |
| --- | --- |
| `src/views/draw.ts` | drawing card, inks, brushes, bouquet tray |
| `src/views/arrange.ts` | drag/tilt/resize flowers, paper and ribbon |
| `src/views/send.ts` | note card and link |
| `src/views/receive.ts` | envelope, bloom replay, note |
| `src/bouquet.ts` | wrap/ribbon SVG and the stroke replay |
| `src/stroke.ts` | brush outlines (perfect-freehand), simplify, smoothing |
| `src/generate.ts` | "Surprise me" procedural flowers |
| `src/sparkle.ts` | shared SVG paints: glitter inks, patterned wrapping papers, CSS glitter & doily textures |
| `src/decor.ts` | die-cut stickers and washi tape strips |
