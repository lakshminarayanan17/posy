// Procedural flowers built from ordinary strokes, so a generated flower is
// stored, shared and replayed exactly like a hand-drawn one.

import type { Flower, Point, Stroke } from './model';
import { quantize, simplify } from './stroke';

const INK = { peony: 0, blush: 1, poppy: 2, apricot: 3, butter: 4, lilac: 5, cornflower: 6, leaf: 7, stem: 8, ink: 9, milk: 10 };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function wobble(points: Point[], amt = 0.8): Point[] {
  const seed = Math.random() * 10;
  return points.map(([x, y], i) => [x + Math.sin(i * 0.9 + seed) * amt, y + Math.cos(i * 0.7 + seed) * amt]);
}

function stroke(ink: number, size: number, points: Point[], eps = 0.6): Stroke {
  return { ink, size, points: simplify(wobble(points).map(quantize), eps) };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps = 24, rx = r): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * r]);
  }
  return out;
}

function line(a: Point, b: Point, bend = 0, steps = 20): Point[] {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * mx + t * t * b[0], u * u * a[1] + 2 * u * t * my + t * t * b[1]]);
  }
  return out;
}

function stemAndLeaves(head: Point): Stroke[] {
  const base: Point = [150 + rand(-6, 6), 392];
  const bend = rand(-0.12, 0.12);
  const strokes = [stroke(INK.stem, 7, line(base, [head[0], head[1] + 20], bend, 30))];
  const leaves = Math.random() < 0.3 ? 1 : 2;
  for (let i = 0; i < leaves; i++) {
    const side = i === 0 ? pick([-1, 1]) : -1 * Math.sign(strokes.length % 2 ? 1 : -1);
    const y = rand(250, 320);
    const x = base[0] + (head[0] - base[0]) * ((392 - y) / (392 - head[1]));
    const tip: Point = [x + side * rand(42, 60), y - rand(26, 46)];
    strokes.push(stroke(INK.leaf, 13, line([x, y], tip, side * 0.22, 16)));
    strokes.push(stroke(INK.stem, 3, line([x, y], [x + (tip[0] - x) * 0.7, y + (tip[1] - y) * 0.7], side * 0.2, 10)));
  }
  return strokes;
}

function daisy(c: Point): Stroke[] {
  const color = pick([INK.blush, INK.butter, INK.lilac, INK.apricot, INK.cornflower]);
  const n = Math.round(rand(9, 14));
  const len = rand(42, 54);
  const out: Stroke[] = [];
  const turn = rand(0, Math.PI);
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2 + rand(-0.06, 0.06);
    const r0 = 10;
    const r1 = len * rand(0.86, 1.05);
    out.push(stroke(color, 13, line([c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1], rand(-0.08, 0.08), 12)));
  }
  out.push(stroke(pick([INK.butter, INK.apricot]), 24, spiral(c, 13, 2.2)));
  out.push(stroke(INK.apricot, 3, spiral(c, 9, 1.5)));
  return out;
}

function rotateAbout(cx: number, cy: number, a: number) {
  // Rotates an ellipse drawn axis-aligned around its center so it points along `a`.
  return ([x, y]: Point): Point => {
    const dx = x - cx;
    const dy = y - cy;
    const s = Math.sin(a - Math.PI / 2);
    const k = Math.cos(a - Math.PI / 2);
    return [cx + dx * k - dy * s, cy + dx * s + dy * k];
  };
}

function spiral(c: Point, r: number, turns: number): Point[] {
  const out: Point[] = [];
  const steps = Math.round(turns * 22);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    out.push([c[0] + Math.cos(a) * r * t, c[1] + Math.sin(a) * r * t]);
  }
  return out;
}

function poppy(c: Point): Stroke[] {
  const color = pick([INK.poppy, INK.peony, INK.apricot, INK.cornflower]);
  const n = Math.round(rand(4, 6));
  const out: Stroke[] = [];
  const turn = rand(0, Math.PI);
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2;
    const pc: Point = [c[0] + Math.cos(a) * 24, c[1] + Math.sin(a) * 24];
    // Fill a petal with a few concentric loops of a wide brush.
    for (const r of [20, 11]) {
      out.push(stroke(color, 24, arc(pc[0], pc[1], r, 0, Math.PI * 2, 22, r * 1.15).map(rotateAbout(pc[0], pc[1], a)), 0.5));
    }
  }
  out.push(stroke(INK.ink, 13, spiral(c, 9, 2)));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    out.push(stroke(INK.ink, 3, line([c[0] + Math.cos(a) * 10, c[1] + Math.sin(a) * 10], [c[0] + Math.cos(a) * 20, c[1] + Math.sin(a) * 20], 0, 4)));
  }
  return out;
}

function tulip(c: Point): Stroke[] {
  const color = pick([INK.peony, INK.poppy, INK.butter, INK.lilac, INK.blush]);
  const w = rand(30, 36);
  const out: Stroke[] = [];
  // Cup: two side petals and a front one, each a filled "U".
  for (const [dx, h, ww] of [[-12, 58, w * 0.8], [12, 58, w * 0.8], [0, 50, w]] as const) {
    const pts: Point[] = [];
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const a = Math.PI * t;
      pts.push([c[0] + dx - Math.cos(a) * ww * 0.55, c[1] + 20 - Math.sin(a) * 26 + (t < 0.5 ? -h * (1 - t * 2) * 0.55 : -h * (t * 2 - 1) * 0.55)]);
    }
    out.push(stroke(color, 24, pts));
  }
  out.push(stroke(color, 13, line([c[0] - w * 0.4, c[1] - 6], [c[0] + w * 0.4, c[1] - 6], 0.15, 10)));
  out.push(stroke(INK.ink, 1.5, line([c[0], c[1] - 18], [c[0], c[1] + 26], 0.05, 10), 0.3));
  return out;
}

function rose(c: Point): Stroke[] {
  const color = pick([INK.peony, INK.blush, INK.poppy, INK.apricot, INK.lilac]);
  const out: Stroke[] = [stroke(color, 24, spiral(c, 34, 2.4))];
  out.push(stroke(color, 24, arc(c[0], c[1], 32, 0, Math.PI * 2, 32, 38)));
  const lines = INK.ink;
  out.push(stroke(lines, 3, spiral(c, 22, 2.6), 0.4));
  return out;
}

function sprig(): Stroke[] {
  const color = pick([INK.lilac, INK.cornflower, INK.butter, INK.peony]);
  const base: Point = [150 + rand(-6, 6), 392];
  const top: Point = [150 + rand(-30, 30), rand(60, 90)];
  const bend = rand(-0.1, 0.1);
  const spine = line(base, top, bend, 60);
  const out: Stroke[] = [stroke(INK.stem, 3, spine)];
  for (let i = 18; i < spine.length; i += 2) {
    const [x, y] = spine[i];
    const side = i % 4 === 0 ? -1 : 1;
    const s = 7 + (1 - i / spine.length) * 9;
    out.push(stroke(color, s > 11 ? 13 : 7, [[x + side * 7, y], [x + side * 9, y - 2]]));
  }
  out.push(stroke(INK.leaf, 13, line([base[0], 330], [base[0] - 40, 290], 0.2, 14)));
  return out;
}

export function surpriseFlower(): Flower {
  const kind = pick(['daisy', 'poppy', 'tulip', 'rose', 'sprig'] as const);
  if (kind === 'sprig') return { strokes: sprig() };
  const head: Point = [150 + rand(-14, 14), rand(118, 142)];
  const heads = { daisy, poppy, tulip, rose } as const;
  return { strokes: [...stemAndLeaves(head), ...heads[kind](head)] };
}
