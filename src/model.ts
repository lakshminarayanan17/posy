// Shared types, palettes and geometry constants.
// Palette order is part of the share-link format: append, never reorder.

export const CARD_W = 300;
export const CARD_H = 400;
/** Point on the drawing card that becomes the flower's pivot in the bouquet. */
export const ANCHOR = { x: 150, y: 370 };

/** The bouquet is drawn in a 600×790 space but framed to the part with content. */
export const VIEW = { x: 0, y: 160, w: 600, h: 630 };

export const MAX_FLOWERS = 7;
export const MAX_NOTE = 280;
export const MAX_NAME = 32;

export interface Ink {
  name: string;
  hex: string;
  /** Opaque inks sit on top; translucent ones multiply like watercolor. */
  opaque?: boolean;
  /** Id of a shared SVG paint (glitter, holo) used instead of the flat hex. */
  fill?: string;
}

export const INKS: Ink[] = [
  { name: 'Peony', hex: '#E7848F' },
  { name: 'Blush', hex: '#F3B7AE' },
  { name: 'Poppy', hex: '#DD5539' },
  { name: 'Apricot', hex: '#F0A35E' },
  { name: 'Butter', hex: '#F2D15F' },
  { name: 'Lilac', hex: '#B39BD6' },
  { name: 'Cornflower', hex: '#7090D6' },
  { name: 'Leaf', hex: '#8DAE72' },
  { name: 'Stem', hex: '#4D7A4C' },
  { name: 'Ink', hex: '#2E2A33', opaque: true },
  { name: 'Milk', hex: '#FFFDF7', opaque: true },
  { name: 'Bubblegum', hex: '#FF7EB3' },
  { name: 'Cherry', hex: '#E8365A' },
  { name: 'Gold glitter', hex: '#E7B84C', opaque: true, fill: 'glitter-gold' },
  { name: 'Pink glitter', hex: '#F68DB2', opaque: true, fill: 'glitter-pink' },
  { name: 'Holo glitter', hex: '#C8B6FF', opaque: true, fill: 'glitter-holo' },
];

/** The order inks appear in the palette (indexes into INKS). */
export const INK_ORDER = [11, 0, 1, 12, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15];

export const SIZES = [3, 7, 13, 24];

export interface Paper {
  name: string;
  base: string;
  shade: string;
  edge: string;
  /** Id of a shared SVG pattern that paints the paper. */
  pattern?: string;
}

export const PAPERS: Paper[] = [
  { name: 'Kraft', base: '#CFA77E', shade: '#B88E66', edge: '#A57B55' },
  { name: 'Tissue', base: '#F4D4CB', shade: '#E7BDB1', edge: '#D9A79A' },
  { name: 'Sage', base: '#C9D4BC', shade: '#B2C0A3', edge: '#9AAA8A' },
  { name: 'Newsprint', base: '#EEE8DB', shade: '#DDD5C4', edge: '#C7BEAB', pattern: 'paper-print' },
  { name: 'Midnight', base: '#33384A', shade: '#272B3A', edge: '#1D2030' },
  { name: 'Butter', base: '#F3E2A9', shade: '#E5CF88', edge: '#CDB66C' },
  { name: 'Gingham', base: '#FFE3EA', shade: '#F7C3D1', edge: '#E48FA8', pattern: 'paper-gingham' },
  { name: 'Cherry dot', base: '#EF5A72', shade: '#D94560', edge: '#B8344D', pattern: 'paper-dots' },
  { name: 'Love letter', base: '#FFF1E6', shade: '#F4DCCB', edge: '#E2B9A6', pattern: 'paper-hearts' },
  { name: 'Holo', base: '#DCD0FF', shade: '#C4B4F5', edge: '#A893E0', pattern: 'paper-holo' },
  { name: 'Starry', base: '#2B2F5C', shade: '#22264D', edge: '#181B3A', pattern: 'paper-stars' },
  { name: 'Mint candy', base: '#D4F2E4', shade: '#B5E2CF', edge: '#8FCAB1', pattern: 'paper-stripes' },
];

/** The order papers appear in the picker (indexes into PAPERS). */
export const PAPER_ORDER = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

export const RIBBONS: Ink[] = [
  { name: 'Cream', hex: '#F7EFDF' },
  { name: 'Rose', hex: '#D9707E' },
  { name: 'Ochre', hex: '#D49A3A' },
  { name: 'Ink', hex: '#2E2A33' },
  { name: 'Moss', hex: '#5E7F52' },
  { name: 'Sky', hex: '#8FB0DA' },
  { name: 'Baby pink', hex: '#F9A8C4' },
  { name: 'Lilac', hex: '#BBA2EE' },
  { name: 'Cherry', hex: '#E0344F' },
  { name: 'Gold glitter', hex: '#E2B24A', fill: 'glitter-gold' },
  { name: 'Pink glitter', hex: '#F68DB2', fill: 'glitter-pink' },
];

export const RIBBON_ORDER = [8, 6, 7, 9, 10, 0, 1, 2, 3, 4, 5];

/** Points are [x, y] in card units, quantized to 0.5. */
export type Point = [number, number];

export interface Stroke {
  ink: number;
  size: number;
  points: Point[];
}

export interface Flower {
  strokes: Stroke[];
}

export interface Placement {
  x: number;
  y: number;
  /** degrees */
  rot: number;
  scale: number;
}

export interface Bouquet {
  flowers: Flower[];
  placements: Placement[];
  paper: number;
  ribbon: number;
  to: string;
  note: string;
  from: string;
}

export function emptyBouquet(): Bouquet {
  return { flowers: [], placements: [], paper: 6, ribbon: 8, to: '', note: '', from: '' };
}

/** Fan the flowers out from the neck of the wrap, tallest in the middle. */
export function autoArrange(count: number, jitter = 0): Placement[] {
  const out: Placement[] = [];
  const rnd = () => (Math.random() - 0.5) * 2 * jitter;
  const spread = Math.min(50, 12 + count * 6);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const centered = t - 0.5;
    // Alternate front and back rows so heads don't sit in a single line.
    const row = count > 3 && i % 2 === 1 ? 1 : 0;
    out.push({
      x: Math.round(300 + centered * (50 + count * 7) + rnd() * 10),
      y: Math.round(522 + row * 30 - (1 - Math.abs(centered) * 2) * 16 + rnd() * 8),
      rot: Math.round(centered * spread + rnd() * 6),
      scale: +(0.94 - row * 0.07 + rnd() * 0.04).toFixed(2),
    });
  }
  return out;
}
