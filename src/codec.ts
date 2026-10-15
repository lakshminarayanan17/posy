// Bouquet <-> URL-safe string. It goes in a long link's #hash, or is saved
// under a short id (see links.ts).
//
// Layout (v1), before deflate:
//   u8 version | var paper | var ribbon | str to | str note | str from
//   var flowerCount, then per flower:
//     zz x | zz y | zz rot | var scale*100 | var strokeCount
//     per stroke: var ink | var size*2 | var n | zz x0 | zz y0 | (zz dx | zz dy)*(n-1)
// Points are stored in half-units, so (x, y) here are point*2.

import { INKS, MAX_FLOWERS, PAPERS, RIBBONS, type Bouquet, type Flower, type Point } from './model';

const VERSION = 1;

class Writer {
  private buf = new Uint8Array(1024);
  private len = 0;
  private ensure(n: number) {
    if (this.len + n <= this.buf.length) return;
    const next = new Uint8Array(Math.max(this.buf.length * 2, this.len + n));
    next.set(this.buf);
    this.buf = next;
  }
  u8(v: number) {
    this.ensure(1);
    this.buf[this.len++] = v & 0xff;
  }
  varint(v: number) {
    v = Math.max(0, Math.floor(v));
    while (v >= 0x80) {
      this.u8((v & 0x7f) | 0x80);
      v = Math.floor(v / 128);
    }
    this.u8(v);
  }
  zigzag(v: number) {
    v = Math.round(v);
    this.varint(v >= 0 ? v * 2 : -v * 2 - 1);
  }
  str(s: string) {
    const bytes = new TextEncoder().encode(s);
    this.varint(bytes.length);
    this.ensure(bytes.length);
    this.buf.set(bytes, this.len);
    this.len += bytes.length;
  }
  bytes() {
    return this.buf.slice(0, this.len);
  }
}

class Reader {
  private pos = 0;
  constructor(private buf: Uint8Array) {}
  u8() {
    if (this.pos >= this.buf.length) throw new Error('Unexpected end of bouquet');
    return this.buf[this.pos++];
  }
  varint() {
    let result = 0;
    let mul = 1;
    for (let i = 0; i < 6; i++) {
      const b = this.u8();
      result += (b & 0x7f) * mul;
      if (!(b & 0x80)) return result;
      mul *= 128;
    }
    throw new Error('Bad number in bouquet');
  }
  zigzag() {
    const v = this.varint();
    return v % 2 === 0 ? v / 2 : -(v + 1) / 2;
  }
  str() {
    const n = this.varint();
    if (this.pos + n > this.buf.length) throw new Error('Unexpected end of bouquet');
    const s = new TextDecoder().decode(this.buf.subarray(this.pos, this.pos + n));
    this.pos += n;
    return s;
  }
}

function serialize(b: Bouquet): Uint8Array {
  const w = new Writer();
  w.u8(VERSION);
  w.varint(b.paper);
  w.varint(b.ribbon);
  w.str(b.to);
  w.str(b.note);
  w.str(b.from);
  w.varint(b.flowers.length);
  b.flowers.forEach((f, i) => {
    const p = b.placements[i];
    w.zigzag(p.x);
    w.zigzag(p.y);
    w.zigzag(p.rot);
    w.varint(Math.round(p.scale * 100));
    w.varint(f.strokes.length);
    for (const s of f.strokes) {
      w.varint(s.ink);
      w.varint(Math.round(s.size * 2));
      w.varint(s.points.length);
      let px = 0;
      let py = 0;
      for (const [x, y] of s.points) {
        const qx = Math.round(x * 2);
        const qy = Math.round(y * 2);
        w.zigzag(qx - px);
        w.zigzag(qy - py);
        px = qx;
        py = qy;
      }
    }
  });
  return w.bytes();
}

function deserialize(bytes: Uint8Array): Bouquet {
  const r = new Reader(bytes);
  const version = r.u8();
  if (version !== VERSION) throw new Error('This bouquet was made with a newer version of Fleur');
  const clampIdx = (v: number, list: unknown[]) => (v < list.length ? v : 0);
  const b: Bouquet = {
    paper: clampIdx(r.varint(), PAPERS),
    ribbon: clampIdx(r.varint(), RIBBONS),
    to: r.str(),
    note: r.str(),
    from: r.str(),
    flowers: [],
    placements: [],
  };
  const count = Math.min(r.varint(), MAX_FLOWERS);
  for (let i = 0; i < count; i++) {
    b.placements.push({ x: r.zigzag(), y: r.zigzag(), rot: r.zigzag(), scale: r.varint() / 100 });
    const flower: Flower = { strokes: [] };
    const strokes = r.varint();
    for (let j = 0; j < strokes; j++) {
      const ink = clampIdx(r.varint(), INKS);
      const size = r.varint() / 2;
      const n = r.varint();
      const points: Point[] = [];
      let x = 0;
      let y = 0;
      for (let k = 0; k < n; k++) {
        x += r.zigzag();
        y += r.zigzag();
        points.push([x / 2, y / 2]);
      }
      flower.strokes.push({ ink, size, points });
    }
    b.flowers.push(flower);
  }
  return b;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encodeBouquet(b: Bouquet): Promise<string> {
  return toBase64Url(await pipe(serialize(b), new CompressionStream('deflate-raw')));
}

export async function decodeBouquet(s: string): Promise<Bouquet> {
  return deserialize(await pipe(fromBase64Url(s), new DecompressionStream('deflate-raw')));
}
