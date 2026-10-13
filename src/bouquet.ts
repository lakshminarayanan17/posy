import {
  ANCHOR,
  VIEW,
  PAPERS,
  RIBBONS,
  type Bouquet,
  type Flower,
  type Placement,
} from './model';
import { sparklePath } from './sparkle';
import { inkPath, strokeD, strokePath, svg } from './stroke';

// Wrap geometry, in bouquet units. The tie sits at the neck (y≈612).
const BACK =
  'M262,614 C214,530 132,410 92,300 C128,268 168,286 196,276 C232,240 270,262 300,250 C334,236 368,262 404,276 C436,286 474,266 508,300 C468,410 386,530 338,614 Z';
const BACK_INNER =
  'M268,604 C226,528 156,420 122,318 C150,302 178,312 202,300 C236,272 270,290 300,280 C330,272 366,292 398,300 C424,312 452,302 478,318 C444,420 374,528 332,604 Z';
const LEFT_FLAP =
  'M104,404 C150,480 226,566 264,616 L246,770 L306,774 L314,616 C332,552 352,512 376,476 C292,448 188,420 104,404 Z';
const RIGHT_FLAP =
  'M496,392 C404,418 314,446 228,470 C252,528 272,576 288,616 L296,774 L358,770 L338,616 C378,562 452,478 496,392 Z';

/** Mix a hex color toward black (amt<0) or white (amt>0). */
export function tint(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt),
  );
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

function defs(uid: string): SVGDefsElement {
  const d = svg('defs');
  // Paper grain: monochrome fractal noise multiplied over the fill.
  const grain = svg('filter', { id: `grain-${uid}`, x: 0, y: 0, width: '100%', height: '100%' });
  grain.innerHTML = `
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" stitchTiles="stitch" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 0.62" result="speck"/>
    <feComposite in="speck" in2="SourceGraphic" operator="in" result="specks"/>
    <feBlend in="SourceGraphic" in2="specks" mode="multiply"/>`;
  d.append(grain);

  const shadow = svg('filter', { id: `soft-${uid}`, x: '-20%', y: '-20%', width: '140%', height: '140%' });
  shadow.innerHTML = `<feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#5a2a45" flood-opacity="0.2"/>`;
  d.append(shadow);
  return d;
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 < 140;
}

let uidCounter = 0;

export interface RenderedBouquet {
  root: SVGSVGElement;
  flowerLayer: SVGGElement;
  flowerGroups: SVGGElement[];
  /** The group whose children are the flower's stroke paths. */
  inkGroups: SVGGElement[];
}

export function placementTransform(p: Placement): string {
  return `translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.scale})`;
}

export function flowerGroup(flower: Flower, p: Placement, index: number, empty = false) {
  const g = svg('g', { class: 'flower', transform: placementTransform(p), 'data-index': index });
  const sway = svg('g', { class: 'sway' });
  sway.style.setProperty('--sway-delay', `${-(index * 1.37) % 5}s`);
  sway.style.setProperty('--sway-dur', `${5.5 + (index % 3) * 0.9}s`);
  const inks = svg('g', { class: 'flower-ink', transform: `translate(${-ANCHOR.x} ${-ANCHOR.y})` });
  if (!empty) for (const s of flower.strokes) inks.append(strokePath(s));
  sway.append(inks);
  g.append(sway);
  return { g, inks };
}

export function renderBouquet(b: Bouquet, opts: { empty?: boolean; className?: string; sparkles?: boolean } = {}): RenderedBouquet {
  const uid = `b${++uidCounter}`;
  const paper = PAPERS[b.paper] ?? PAPERS[0];
  const ribbon = RIBBONS[b.ribbon] ?? RIBBONS[0];
  const root = svg('svg', {
    viewBox: `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`,
    class: `bouquet ${opts.className ?? ''}`,
    role: 'img',
    'aria-label': `A bouquet of ${b.flowers.length} hand-drawn flower${b.flowers.length === 1 ? '' : 's'}`,
  });
  root.append(defs(uid));
  const grain = `url(#grain-${uid})`;
  const printed = paper.pattern ? `url(#${paper.pattern})` : null;
  // Printed papers are glossy; plain ones get a paper grain.
  const texture: Record<string, string> = printed ? {} : { filter: grain };

  // Back of the wrap, seen from the inside.
  // Squashed toward the neck so the flower heads rise above it.
  const back = svg('g', { class: 'wrap wrap--back', ...texture, transform: 'translate(0 614) scale(1 0.86) translate(0 -614)' });
  back.append(svg('path', { d: BACK, fill: printed ?? paper.shade }));
  if (printed) back.append(svg('path', { d: BACK, fill: '#3D2140', opacity: 0.16 }));
  back.append(
    svg('path', { d: BACK_INNER, fill: printed ? '#3D2140' : tint(paper.shade, -0.06), opacity: printed ? 0.08 : 0.55 }),
    svg('path', { d: BACK, fill: 'none', stroke: paper.edge, 'stroke-width': 1.2, opacity: 0.6 }),
  );

  // A few stem ends poking out of the bottom of the wrap.
  const stems = svg('g', { class: 'stem-ends' });
  [[-18, 0], [-6, 6], [7, 2], [19, 7]].forEach(([dx, dy], i) => {
    stems.append(
      svg('rect', {
        x: 300 + dx - 3.5,
        y: 760 + dy - 30,
        width: 7,
        height: 40 - (i % 2) * 6,
        rx: 3.5,
        fill: i % 2 ? '#5C8656' : '#4D7A4C',
      }),
    );
  });

  // Stems may only show above the mouth of the wrap or inside the cone, so a
  // tilted flower never pokes out through the side of the paper.
  const clip = svg('clipPath', { id: `inside-${uid}` });
  clip.append(
    svg('rect', { x: -200, y: -200, width: 1000, height: 600 }),
    svg('path', { d: LEFT_FLAP }),
    svg('path', { d: RIGHT_FLAP }),
    svg('path', { d: BACK }),
  );
  root.querySelector('defs')!.append(clip);
  const flowerLayer = svg('g', { class: 'flowers', 'clip-path': `url(#inside-${uid})` });
  const flowerGroups: SVGGElement[] = [];
  const inkGroups: SVGGElement[] = [];
  b.flowers.forEach((f, i) => {
    const { g, inks } = flowerGroup(f, b.placements[i], i, opts.empty);
    flowerGroups.push(g);
    inkGroups.push(inks);
    flowerLayer.append(g);
  });

  // Front flaps, crossing at the neck.
  const front = svg('g', { class: 'wrap wrap--front', filter: `url(#soft-${uid})` });
  const flaps = svg('g', texture);
  // Running stitch along each folded top edge.
  const stitchColor = isDark(paper.base) ? '#FFF6EE' : tint(paper.edge, -0.12);
  const stitch = (d: string) =>
    svg('path', { d, class: 'stitch', fill: 'none', stroke: stitchColor, 'stroke-width': 2, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round', opacity: 0.75 });
  flaps.append(
    svg('path', { d: LEFT_FLAP, fill: printed ?? paper.base }),
    svg('path', { d: 'M110,410 C160,486 230,566 262,612', fill: 'none', stroke: paper.edge, 'stroke-width': 1, opacity: 0.35 }),
    stitch('M116,416 C196,432 290,458 362,484'),
    svg('path', { d: RIGHT_FLAP, fill: printed ?? tint(paper.base, 0.08) }),
  );
  if (printed) flaps.append(svg('path', { d: RIGHT_FLAP, fill: '#fff', opacity: 0.12 }));
  flaps.append(
    svg('path', { d: 'M240,474 C300,456 400,428 488,400', fill: 'none', stroke: '#fff', 'stroke-width': 2.2, opacity: 0.4, 'stroke-linecap': 'round' }),
    svg('path', { d: 'M302,494 C318,540 326,578 330,612', fill: 'none', stroke: paper.edge, 'stroke-width': 1, opacity: 0.3 }),
    stitch('M484,404 C404,428 318,454 244,480'),
    svg('path', { d: LEFT_FLAP, fill: 'none', stroke: paper.edge, 'stroke-width': 1.2, opacity: 0.55 }),
    svg('path', { d: RIGHT_FLAP, fill: 'none', stroke: paper.edge, 'stroke-width': 1.2, opacity: 0.55 }),
  );
  front.append(flaps, ribbonBow(ribbon.hex, ribbon.fill));

  root.append(back, stems, flowerLayer, front);
  if (opts.sparkles) root.append(sparkles());
  return { root, flowerLayer, flowerGroups, inkGroups };
}

function ribbonBow(color: string, paint?: string): SVGGElement {
  const fill = paint ? `url(#${paint})` : color;
  const dark = tint(color, -0.2);
  const darker = tint(color, -0.34);
  const g = svg('g', { class: 'ribbon' });
  g.append(
    // Long coquette tails with notched ends
    svg('path', { d: 'M294,618 C280,646 292,672 270,700 C262,712 256,724 250,738 L262,732 L268,746 C276,728 282,716 290,702 C308,672 296,646 306,620 Z', fill: paint ? fill : dark }),
    svg('path', { d: 'M306,618 C318,648 312,676 330,704 C338,716 344,728 352,742 L340,738 L336,752 C328,732 322,720 316,708 C298,678 306,648 294,620 Z', fill }),
    // Band around the neck
    svg('path', { d: 'M258,600 C286,610 314,610 342,600 L344,622 C314,632 286,632 256,622 Z', fill }),
    svg('path', { d: 'M258,600 C286,610 314,610 342,600', fill: 'none', stroke: '#fff', 'stroke-width': 1.4, opacity: 0.4 }),
    // Loops
    svg('path', { d: 'M296,610 C268,574 214,560 206,592 C200,620 250,630 296,618 Z', fill }),
    svg('path', { d: 'M290,610 C268,590 232,582 226,596 C222,610 256,616 290,614 Z', fill: darker, opacity: 0.4 }),
    svg('path', { d: 'M304,610 C332,574 386,560 394,592 C400,620 350,630 304,618 Z', fill }),
    svg('path', { d: 'M310,610 C332,590 368,582 374,596 C378,610 344,616 310,614 Z', fill: darker, opacity: 0.4 }),
    svg('path', { d: 'M222,580 C232,572 248,572 260,580', fill: 'none', stroke: '#fff', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.55 }),
    // Knot
    svg('path', { d: 'M288,600 C296,595 304,595 312,600 L314,622 C304,628 296,628 286,622 Z', fill: dark }),
  );
  return g;
}

/** Little twinkles that float around a finished bouquet. */
function sparkles(): SVGGElement {
  const g = svg('g', { class: 'sparkles', 'aria-hidden': 'true' });
  const spots: [number, number, number, string][] = [
    [128, 300, 13, '#FFD25E'],
    [478, 262, 16, '#FF8FB1'],
    [92, 470, 9, '#C9B6FF'],
    [520, 452, 11, '#FFD25E'],
    [404, 214, 8, '#C9B6FF'],
    [196, 226, 7, '#FF8FB1'],
  ];
  spots.forEach(([x, y, s, c], i) => {
    const p = svg('path', { d: sparklePath(x, y, s), fill: c, class: 'twinkle' });
    p.style.setProperty('--tw-delay', `${-i * 0.7}s`);
    g.append(p);
  });
  return g;
}

/** Render a single flower on its own, e.g. for thumbnails. */
export function flowerThumb(flower: Flower): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 300 400', class: 'thumb-svg' });
  const g = svg('g', { class: 'flower-ink' });
  for (const s of flower.strokes) g.append(strokePath(s));
  root.append(g);
  return root;
}

/**
 * Redraw every flower stroke by stroke, all flowers in parallel with a small
 * stagger. Resolves when finished; returns a cancel function via `signal`.
 */
export function replay(b: Bouquet, inkGroups: SVGGElement[], opts: { duration?: number; stagger?: number; signal?: AbortSignal } = {}): Promise<void> {
  const duration = opts.duration ?? 2600;
  const stagger = opts.stagger ?? 280;
  const plans = b.flowers.map((f) => {
    const weights = f.strokes.map((s) => 6 + s.points.length);
    const total = weights.reduce((a, c) => a + c, 0) || 1;
    return { f, weights, total, done: 0, live: null as SVGPathElement | null };
  });
  inkGroups.forEach((g) => g.replaceChildren());

  return new Promise((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      if (opts.signal?.aborted) return resolve();
      let allDone = true;
      plans.forEach((plan, i) => {
        const g = inkGroups[i];
        const t = Math.min(1, Math.max(0, (now - start - i * stagger) / duration));
        if (t < 1) allDone = false;
        const eased = 1 - Math.pow(1 - t, 1.6);
        let budget = eased * plan.total;
        let idx = 0;
        while (idx < plan.weights.length && budget >= plan.weights[idx]) budget -= plan.weights[idx++];
        // Commit strokes that have finished since the last frame.
        while (plan.done < idx) {
          plan.live?.remove();
          plan.live = null;
          g.append(strokePath(plan.f.strokes[plan.done++]));
        }
        if (idx < plan.weights.length && budget > 0) {
          const s = plan.f.strokes[idx];
          const d = strokeD(s, budget / plan.weights[idx]);
          if (!plan.live) {
            plan.live = inkPath(d, s.ink);
            g.append(plan.live);
          } else plan.live.setAttribute('d', d);
        }
      });
      if (allDone) resolve();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
