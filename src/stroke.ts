import { getStroke } from 'perfect-freehand';
import { INKS, type Point, type Stroke } from './model';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function strokeLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/**
 * Turn a centerline into a filled brush outline. Pressure is fixed and the
 * ends are tapered, so the shape depends only on the stored points and
 * renders identically for sender and recipient.
 */
export function outline(points: Point[], size: number, last = true): string {
  if (points.length === 0) return '';
  const len = strokeLength(points);
  // Taps and tiny flicks become round dabs; the brush model would taper them away.
  if (len < size * 0.75) return dab(points, size);
  const taper = len < size * 2 ? 0 : Math.min(size * 2.2, len * 0.35);
  const poly = getStroke(points, {
    size,
    thinning: 0.35,
    smoothing: 0.62,
    streamline: 0.32,
    simulatePressure: false,
    start: { taper, cap: true },
    end: { taper: last ? taper : 0, cap: true },
    last,
  });
  return polygonToPath(poly);
}

function dab(points: Point[], size: number): string {
  const cx = points.reduce((a, p) => a + p[0], 0) / points.length;
  const cy = points.reduce((a, p) => a + p[1], 0) / points.length;
  const r = (size / 2) * 0.92;
  return `M${(cx - r).toFixed(1)},${cy.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
}

function polygonToPath(poly: number[][]): string {
  if (poly.length < 3) return '';
  const avg = (a: number, b: number) => ((a + b) / 2).toFixed(1);
  let d = `M${poly[0][0].toFixed(1)},${poly[0][1].toFixed(1)}Q`;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    d += `${x0.toFixed(1)},${y0.toFixed(1)} ${avg(x0, x1)},${avg(y0, y1)} `;
  }
  return d + 'Z';
}

export function inkPath(d: string, inkIndex: number): SVGPathElement {
  const ink = INKS[inkIndex] ?? INKS[0];
  return svg('path', {
    d,
    fill: ink.fill ? `url(#${ink.fill})` : ink.hex,
    class: ink.fill ? 'ink ink--opaque ink--glitter' : ink.opaque ? 'ink ink--opaque' : 'ink',
  });
}

/** Render a stored stroke; `progress` < 1 draws only the first part (for replays). */
export function strokeD(stroke: Stroke, progress = 1): string {
  const pts = densify(stroke.points);
  if (progress >= 1) return outline(pts, stroke.size, true);
  const n = Math.max(1, Math.ceil(pts.length * progress));
  return outline(pts.slice(0, n), stroke.size, false);
}

export function strokePath(stroke: Stroke): SVGPathElement {
  return inkPath(strokeD(stroke), stroke.ink);
}

/** Ramer–Douglas–Peucker: drop points that don't change the shape. */
export function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Round to the 0.5 grid the share format stores. */
export function quantize(p: Point): Point {
  return [Math.round(p[0] * 2) / 2, Math.round(p[1] * 2) / 2];
}

/** Catmull-Rom resample so simplified strokes stay smooth. */
export function densify(points: Point[], step = 3): Point[] {
  if (points.length < 3) return points;
  const out: Point[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(1, Math.ceil(segLen / step));
    for (let j = 1; j <= n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}
