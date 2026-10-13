// Scrapbook bits: die-cut stickers and strips of washi tape.

import { h } from './dom';
import { sparklePath } from './sparkle';

const OUT = 'stroke="#3D2140" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
const SHINE = 'fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"';
const FACE = (x: number, y: number) =>
  `<circle cx="${x - 5}" cy="${y}" r="1.9" fill="#3D2140"/><circle cx="${x + 5}" cy="${y}" r="1.9" fill="#3D2140"/>` +
  `<path d="M${x - 3} ${y + 4}q3 3 6 0" fill="none" stroke="#3D2140" stroke-width="1.8" stroke-linecap="round"/>` +
  `<circle cx="${x - 9}" cy="${y + 4}" r="2.4" fill="#FF8FB1" opacity=".7"/><circle cx="${x + 9}" cy="${y + 4}" r="2.4" fill="#FF8FB1" opacity=".7"/>`;

function star(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.5 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return d + 'Z';
}

const STICKERS: Record<string, string> = {
  heart: `<path d="M32 55C12 41 5 29 9 19c4-9 17-11 23-1 6-10 19-8 23 1 4 10-3 22-23 36Z" fill="#FF8FB1" ${OUT}/><path d="M16 22c1-5 5-7 9-6" ${SHINE}/>`,
  star: `<path d="${star(32, 34, 27)}" fill="#FFE07A" ${OUT} stroke-width="2.6"/>${FACE(32, 36)}`,
  bow: `<path d="M30 32 18 54l6-2 3 6 7-24Z" fill="#FF7EA8" ${OUT}/><path d="M34 32l12 22-6-2-3 6-7-24Z" fill="#FF7EA8" ${OUT}/>
    <path d="M31 30C22 16 6 13 6 26s17 12 25 6Z" fill="#FFA6C3" ${OUT}/><path d="M33 30c9-14 25-17 25-4s-17 12-25 6Z" fill="#FFA6C3" ${OUT}/>
    <rect x="26" y="24" width="12" height="13" rx="5" fill="#FF7EA8" ${OUT}/><path d="M12 22c2-3 5-4 8-3" ${SHINE} stroke-width="2.4"/>`,
  cherry: `<path d="M21 44c2-12 9-24 17-32M44 45c-2-12-4-23-6-33" fill="none" stroke="#3E7D4A" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 12c6-7 16-6 19-1-6 5-14 5-19 1Z" fill="#7CC46A" ${OUT}/>
    <circle cx="20" cy="46" r="11" fill="#E8365A" ${OUT}/><circle cx="45" cy="47" r="11" fill="#E8365A" ${OUT}/>
    <path d="M14 43c1-3 3-4 5-5M39 44c1-3 3-4 5-5" ${SHINE} stroke-width="2.6"/>`,
  daisy: `${Array.from({ length: 8 }, (_, i) => `<ellipse cx="32" cy="15" rx="7" ry="12" fill="#fff" ${OUT} transform="rotate(${i * 45} 32 32)"/>`).join('')}
    <circle cx="32" cy="32" r="10" fill="#FFD25E" ${OUT}/>${FACE(32, 31).replace(/r="2.4"/g, 'r="1.6"')}`,
  sparkle: `<path d="${sparklePath(32, 32, 27)}" fill="#C9B6FF" ${OUT}/><path d="${sparklePath(32, 32, 9)}" fill="#fff" opacity=".8"/>`,
  flower: `${Array.from({ length: 6 }, (_, i) => `<circle cx="32" cy="16" r="11" fill="#FFB3CC" ${OUT} transform="rotate(${i * 60} 32 32)"/>`).join('')}
    <circle cx="32" cy="32" r="13" fill="#FFE07A" ${OUT}/>${FACE(32, 31)}`,
};

export type StickerName = keyof typeof STICKERS;

export function sticker(name: StickerName, cls = ''): HTMLElement {
  const el = h('span.sticker', { class: cls, 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 64 64">${STICKERS[name]}</svg>`;
  return el;
}

export type TapeKind = 'pink' | 'gingham' | 'dots' | 'mint' | 'lilac' | 'glitter' | 'butter';

export function tape(kind: TapeKind, cls = ''): HTMLElement {
  return h('span.tape', { class: `tape--${kind} ${cls}`, 'aria-hidden': 'true' });
}
