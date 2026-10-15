// The flower shop the whole app sits in: striped awning, fairy lights,
// a tiered flower stand, a wrapping station and a sleepy shop cat.
// It is pure backdrop — fixed behind the app and hidden from screen readers.

import { h } from './dom';

const PLUM = '#3D2140';
const O = `stroke="${PLUM}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const THIN = `stroke="${PLUM}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
const SHINE = 'fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"';
const STEM = '#4E8F55';

const f = (n: number) => +n.toFixed(1);
const g = (x: number, y: number, r: number, body: string) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r)})">${body}</g>`;

/** A gently curved stem from the bucket mouth up to a flower head. */
function stem(x1: number, y1: number, x2: number, y2: number, bend = 0, w = 3) {
  const mx = (x1 + x2) / 2 + bend;
  const my = (y1 + y2) / 2;
  return `<path d="M${f(x1)},${f(y1)}Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}" fill="none" stroke="${STEM}" stroke-width="${w}" stroke-linecap="round"/>`;
}

function leaf(x: number, y: number, r: number, len = 22, c = '#8CC97A') {
  return g(x, y, r, `<path d="M0,0C${len * 0.3},-${len * 0.32} ${len * 0.75},-${len * 0.3} ${len},0C${len * 0.75},${len * 0.3} ${len * 0.3},${len * 0.32} 0,0Z" fill="${c}" ${THIN}/>`);
}

const tulip = (c: string) =>
  `<path d="M-10,0C-12,-12 -9,-20 -7,-24L-2,-15L1,-26L4,-15L8,-24C11,-18 12,-10 10,0Q0,8 -10,0Z" fill="${c}" ${O}/><path d="M-6,-6C-7,-11 -6,-15 -5,-17" ${SHINE} stroke-width="2"/>`;

const rose = (c: string, d: string) =>
  `<circle r="12" fill="${c}" ${O}/><path d="M-1,1a3,3 0 1 1 4,-2a6,6 0 1 1 -9,-1a8.5,8.5 0 0 1 13,-5" fill="none" stroke="${d}" stroke-width="2" stroke-linecap="round"/>`;

const daisy = (c = '#fff') =>
  Array.from({ length: 9 }, (_, i) => `<ellipse cy="-8" rx="3.6" ry="7.5" fill="${c}" ${THIN} transform="rotate(${i * 40})"/>`).join('') +
  `<circle r="5" fill="#FFD25E" ${THIN}/>`;

const sunflower = () =>
  Array.from({ length: 12 }, (_, i) => `<path d="M0,-7C4,-12 3,-19 0,-22C-3,-19 -4,-12 0,-7Z" fill="#FFC93C" ${THIN} transform="rotate(${i * 30})"/>`).join('') +
  `<circle r="8.5" fill="#8A5A3C" ${O}/><circle cx="-2.5" cy="-2" r="1.3" fill="#C99266"/><circle cx="2.5" cy="1" r="1.3" fill="#C99266"/><circle cx="-1" cy="3" r="1.3" fill="#C99266"/>`;

function lavender(x1: number, y1: number, x2: number, y2: number, bend: number) {
  let buds = '';
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    const x = x2 + (x1 - x2) * t * 0.35 + bend * t * 0.2;
    const y = y2 + (y1 - y2) * t * 0.35;
    buds += `<ellipse cx="${f(x - 3)}" cy="${f(y)}" rx="3" ry="4.6" fill="#A98BE0" ${THIN} stroke-width="1.4" transform="rotate(-25 ${f(x - 3)} ${f(y)})"/>`;
    buds += `<ellipse cx="${f(x + 3)}" cy="${f(y + 2)}" rx="3" ry="4.6" fill="#BBA2EE" ${THIN} stroke-width="1.4" transform="rotate(25 ${f(x + 3)} ${f(y + 2)})"/>`;
  }
  return stem(x1, y1, x2, y2, bend, 2.6) + buds;
}

function eucalyptus(x1: number, y1: number, x2: number, y2: number, bend: number) {
  let leaves = '';
  for (let i = 0; i < 6; i++) {
    const t = 0.12 + i * 0.15;
    const x = x2 + (x1 - x2) * t + bend * Math.sin(t * Math.PI) * 0.5;
    const y = y2 + (y1 - y2) * t;
    const s = i % 2 ? 1 : -1;
    leaves += `<circle cx="${f(x + s * 7)}" cy="${f(y)}" r="${f(6.5 - i * 0.4)}" fill="#A9C7A6" ${THIN}/>`;
  }
  return stem(x1, y1, x2, y2, bend, 2.4) + leaves;
}

function babysBreath(x: number, y: number) {
  let out = '';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    out += `<circle cx="${f(x + Math.cos(a) * (5 + (i % 3) * 3))}" cy="${f(y + Math.sin(a) * (4 + (i % 2) * 3))}" r="2.6" fill="#fff" ${THIN} stroke-width="1.2"/>`;
  }
  return out;
}

/** A zinc florist's bucket sitting on y, centred on x. */
function bucket(x: number, y: number, w: number, hgt: number) {
  const top = y - hgt;
  const b = w * 0.4;
  const t = w / 2;
  return `<path d="M${f(x - t)},${f(top)}L${f(x - b)},${f(y)}H${f(x + b)}L${f(x + t)},${f(top)}Z" fill="#CFDAE6" ${O}/>
    <path d="M${f(x - t + 4)},${f(top + hgt * 0.42)}L${f(x + t - 4)},${f(top + hgt * 0.42)}" stroke="#A9B8C9" stroke-width="2"/>
    <path d="M${f(x - t + 9)},${f(top + 8)}L${f(x - b + 5)},${f(y - 6)}" ${SHINE} stroke-width="3"/>
    <rect x="${f(x - t - 3)}" y="${f(top - 4)}" width="${f(w + 6)}" height="9" rx="4.5" fill="#E2EAF2" ${O}/>`;
}

/** A kraft-paper price tag on a string. */
function tag(x: number, y: number, r: number, text: string, color = '#F6E2C4') {
  const w = Math.max(38, text.length * 7.6 + 14);
  return g(
    x,
    y,
    r,
    `<path d="M-6,-14L0,0" stroke="${PLUM}" stroke-width="1.4"/><path d="M0,0h${f(w)}v20h-${f(w)}l-7,-10z" fill="${color}" ${THIN}/>
     <circle cx="-1" cy="10" r="1.8" fill="${PLUM}"/><text x="${f(w / 2)}" y="15" font-family="Gaegu, cursive" font-weight="700" font-size="15" text-anchor="middle" fill="${PLUM}">${text}</text>`,
  );
}

/** Left: a three-step wooden flower stand, every step full of buckets. */
function stand() {
  const wood = '#EBC195';
  const woodD = '#D29D6C';
  const steps = `<path d="M14,600V318H160V438H220V558H272V600Z" fill="${wood}" ${O}/>
    <path d="M14,330H160M14,450H220M14,570H272" stroke="${woodD}" stroke-width="2.4"/>
    <path d="M40,370h40M96,400h44M30,500h52M120,520h70M44,590h60M150,585h80" stroke="${woodD}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;

  const tulips =
    [
      [70, 268, 52, 168, -10, '#FF8FB1', -12],
      [84, 268, 80, 138, 6, '#E8365A', -2],
      [98, 268, 108, 156, 10, '#FFB3CC', 8],
      [110, 268, 134, 186, 14, '#FF8FB1', 18],
      [78, 268, 40, 206, -16, '#FFD25E', -24],
    ] as const;
  const tier1 =
    leaf(84, 230, -110, 30) +
    leaf(102, 236, -60, 28) +
    tulips.map(([x1, y1, x2, y2, b]) => stem(x1, y1, x2, y2, b)).join('') +
    tulips.map(([, , x2, y2, , c, r]) => g(x2, y2, r, tulip(c))).join('') +
    bucket(88, 318, 74, 56);

  const roses = [
    [60, 392, 44, 316, '#FF6F91', '#C8325E'],
    [74, 392, 74, 300, '#E8365A', '#9E1E3C'],
    [88, 392, 102, 318, '#FF9EBB', '#E0577F'],
    [70, 392, 58, 340, '#FFC2D4', '#F07FA0'],
  ] as const;
  const tier2 =
    roses.map(([x1, y1, x2, y2]) => stem(x1, y1, x2, y2, x2 > x1 ? 6 : -6)).join('') +
    leaf(64, 360, -150, 24) +
    leaf(84, 352, -30, 24) +
    roses.map(([, , x2, y2, c, d]) => g(x2, y2, 0, rose(c, d))).join('') +
    lavender(170, 396, 154, 300, -8) +
    lavender(180, 396, 186, 292, 6) +
    lavender(188, 396, 206, 312, 10) +
    bucket(74, 438, 66, 50) +
    bucket(180, 438, 54, 46);

  const tier3 =
    [
      [52, 518, 34, 432, -6],
      [66, 518, 64, 420, 0],
      [78, 518, 94, 440, 8],
    ]
      .map(([x1, y1, x2, y2, b]) => stem(x1, y1, x2, y2, b))
      .join('') +
    [
      [34, 432, 0],
      [64, 420, 0],
      [94, 440, 0],
    ]
      .map(([x, y, r]) => g(x, y, r, daisy()))
      .join('') +
    stem(140, 518, 128, 424, -8) +
    stem(156, 518, 166, 408, 6) +
    leaf(146, 470, -140, 26) +
    leaf(156, 460, -40, 26) +
    g(128, 424, -10, sunflower()) +
    g(166, 408, 12, sunflower()) +
    eucalyptus(226, 520, 212, 430, -10) +
    eucalyptus(240, 520, 258, 440, 8) +
    stem(232, 520, 236, 448, 0, 2) +
    babysBreath(236, 446) +
    bucket(64, 558, 62, 48) +
    bucket(150, 558, 58, 48) +
    bucket(234, 558, 52, 44);

  const tags = tag(124, 298, 6, 'tulips') + tag(22, 412, -8, 'roses') + tag(150, 420, 4, '♡', '#FFD3E0') + tag(176, 532, -6, 'fresh!');

  return `<svg viewBox="0 0 280 600" preserveAspectRatio="xMinYMax meet">${steps}${tier1}${tier2}${tier3}${tags}</svg>`;
}

/** Right: ribbon spools on a rail, wrapping-paper rolls in a crate, a cat. */
function wrapStation() {
  const spools = [
    [44, '#F9A8C4', 120],
    [92, '#E0344F', 160],
    [140, 'url(#glitter-gold)', 96],
    [188, '#BBA2EE', 140],
    [236, '#A8E6CB', 110],
  ] as const;
  const rail =
    spools
      .map(([x, c, len]) => {
        const y = 92;
        const end = y + len;
        const tail = `M${x - 6},${y + 10}C${x - 16},${y + len * 0.35} ${x + 10},${y + len * 0.6} ${x - 4},${end}l7,-9l7,9C${x + 18},${y + len * 0.6} ${x - 2},${y + len * 0.35} ${x + 6},${y + 10}Z`;
        return `<path d="${tail}" fill="${c}" ${THIN}/>
          <circle cx="${x}" cy="${y}" r="20" fill="#FFF6EE" ${O}/><circle cx="${x}" cy="${y}" r="15" fill="${c}" ${THIN}/>
          <circle cx="${x}" cy="${y}" r="6" fill="#EBC195" ${THIN}/><path d="M${x - 10},${y - 6}a12,12 0 0 1 8,-6" ${SHINE} stroke-width="2.2"/>`;
      })
      .join('') +
    `<rect x="10" y="88" width="260" height="8" rx="4" fill="#D29D6C" ${O}/>
     <rect x="4" y="74" width="14" height="30" rx="4" fill="#EBC195" ${O}/><rect x="262" y="74" width="14" height="30" rx="4" fill="#EBC195" ${O}/>`;

  const rolls = [
    [40, 330, -7, 'paper-gingham'],
    [76, 300, -2, 'paper-hearts'],
    [112, 318, 4, 'paper-dots'],
    [148, 296, 8, 'paper-stars'],
    [186, 340, 12, 'paper-stripes'],
  ] as const;
  const crate =
    rolls
      .map(([x, y, r, p]) =>
        g(
          x,
          y,
          r,
          `<rect x="-15" y="0" width="30" height="230" fill="url(#${p})" ${O}/><rect x="-15" y="0" width="30" height="230" fill="url(#shop-roll-shade)"/>
           <ellipse cx="0" cy="0" rx="15" ry="5.5" fill="#FFF6EE" ${O}/><ellipse cx="0" cy="0" rx="5" ry="2" fill="none" stroke="#D9C2A8" stroke-width="1.6"/>`,
        ),
      )
      .join('') +
    `<path d="M8,452H222L214,598H16Z" fill="#FFB3CC" ${O}/>
     <path d="M12,500H218M14,550H216" stroke="#E98AAB" stroke-width="2.4"/>
     <path d="M20,462H210" ${SHINE} stroke-width="3"/>
     <text x="115" y="534" font-family="Bagel Fat One, cursive" font-size="26" text-anchor="middle" fill="#fff" stroke="${PLUM}" stroke-width="1.6" paint-order="stroke" letter-spacing="2">WRAPS</text>`;

  // A ginger loaf of a cat, fast asleep on the floor.
  const cat = g(
    226,
    566,
    0,
    `<path d="M-4,30C-30,30 -38,8 -24,-4C-14,-12 10,-14 24,-6C40,4 40,30 18,30Z" fill="#F2B27A" ${O}/>
     <path d="M24,28C40,30 46,18 38,10" fill="none" stroke="${PLUM}" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M-6,-6l4,10M4,-9l2,10M14,-7l-1,10" stroke="#D98B4F" stroke-width="2.6" stroke-linecap="round"/>
     <g transform="translate(-26 4)">
       <path d="M-12,-8L-14,-24L-3,-14M4,-14L12,-24L13,-8" fill="#F2B27A" ${O}/>
       <path d="M-11,-13l-1,-6l4,4M9,-15l3,-5l0,6" fill="#FF9EBB"/>
       <ellipse cx="0" cy="0" rx="16" ry="13" fill="#F2B27A" ${O}/>
       <path d="M-9,0q3,3 6,0M3,0q3,3 6,0" fill="none" stroke="${PLUM}" stroke-width="1.8" stroke-linecap="round"/>
       <path d="M-1,4l1,1.4l1,-1.4z" fill="${PLUM}" ${THIN} stroke-width="1"/>
       <circle cx="-10" cy="5" r="2.6" fill="#FF8FB1" opacity=".6"/><circle cx="10" cy="5" r="2.6" fill="#FF8FB1" opacity=".6"/>
     </g>
     <text class="zzz" x="-20" y="-30" font-family="Gaegu, cursive" font-weight="700" font-size="18" fill="${PLUM}">z<tspan dx="2" dy="-8" font-size="14">z</tspan></text>`,
  );

  const defs = `<defs><linearGradient id="shop-roll-shade" x1="0" x2="1">
    <stop offset="0" stop-color="#3D2140" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity=".28"/>
    <stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3D2140" stop-opacity=".22"/></linearGradient></defs>`;

  return `<svg viewBox="0 0 280 600" preserveAspectRatio="xMaxYMax meet">${defs}${rail}${crate}${cat}</svg>`;
}

/** A macramé hanger with a pot of trailing heart-leaf pothos. */
function hangingPlant(pot: string) {
  const heart = (x: number, y: number, r: number, s = 1) =>
    g(x, y, r, `<path d="M0,${9 * s}C${-12 * s},0 ${-8 * s},${-9 * s} 0,${-4 * s}C${8 * s},${-9 * s} ${12 * s},0 0,${9 * s}Z" fill="#7FC27A" ${THIN}/>`);
  const vine = (pts: [number, number][]) =>
    `<path d="M${pts.map(([x, y]) => `${x},${y}`).join('L')}" fill="none" stroke="${STEM}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const v1: [number, number][] = [[40, 158], [30, 190], [36, 222], [26, 254], [32, 286]];
  const v2: [number, number][] = [[86, 158], [96, 186], [90, 214], [98, 240]];
  const v3: [number, number][] = [[62, 166], [58, 196], [66, 226], [60, 258], [66, 312]];
  const leaves = [...v1, ...v2, ...v3]
    .slice(1)
    .map(([x, y], i) => heart(x + (i % 2 ? 7 : -7), y, i % 2 ? 30 : -30, 0.9 + (i % 3) * 0.1))
    .join('');
  return `<svg viewBox="0 0 124 320" preserveAspectRatio="xMidYMin meet">
    <path d="M62,0V40M62,40L26,122M62,40L98,122M62,40L62,122" fill="none" stroke="#E7D3BC" stroke-width="2.6"/>
    <path d="M62,40L26,122M62,40L98,122" fill="none" stroke="${PLUM}" stroke-width="1" stroke-dasharray="2 5" opacity=".4"/>
    <circle cx="62" cy="40" r="6" fill="#F6E2C4" ${THIN}/>
    ${heart(44, 112, -30)}${heart(80, 108, 30)}${heart(62, 102, 0)}
    <path d="M24,118H100L92,166Q62,176 32,166Z" fill="${pot}" ${O}/>
    <rect x="20" y="112" width="84" height="14" rx="6" fill="${pot}" ${O}/>
    <path d="M30,136l6,22" ${SHINE} stroke-width="3"/>
    ${vine(v1)}${vine(v2)}${vine(v3)}${leaves}
  </svg>`;
}

/** Bulbs along swags of wire. x is a percentage of the width, y in px. */
function lights() {
  const swags = 6;
  const per = 5;
  const wire = Array.from({ length: swags }, (_, i) => {
    const x0 = (i / swags) * 100;
    const x1 = ((i + 1) / swags) * 100;
    return `M${f(x0)},6Q${f((x0 + x1) / 2)},54 ${f(x1)},6`;
  }).join('');
  const colors = ['#FFE07A', '#FF8FB1', '#C9B6FF', '#A8E6CB', '#FFB37A'];
  const bulbs: HTMLElement[] = [];
  for (let i = 0; i < swags; i++) {
    for (let j = 1; j < per; j++) {
      const t = j / per;
      const x = ((i + t) / swags) * 100;
      const y = 6 + 2 * t * (1 - t) * 48; // the quadratic swag at t
      const n = i * per + j;
      bulbs.push(
        h('span.shop-bulb', {
          style: `left:${f(x)}%;top:${f(y)}px;--c:${colors[n % colors.length]};--d:${f(-(n * 0.37) % 3)}s`,
        }),
      );
    }
  }
  const el = h('div.shop-lights', null, ...bulbs);
  el.insertAdjacentHTML(
    'afterbegin',
    `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="${wire}" fill="none" stroke="${PLUM}" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity=".55"/></svg>`,
  );
  return el;
}

/** Wallpaper print: a rosebud in each cream stripe, a tiny dot cluster in each pink one. */
function cssSprig() {
  const bud = (x: number, y: number, r: number) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0,9v-6" stroke="#B9D7B3" stroke-width="1.4" stroke-linecap="round"/>` +
    `<path d="M0,6c-4,-1 -5,-4 -5,-5c3,0 5,2 5,5zM0,6c4,-1 5,-4 5,-5c-3,0 -5,2 -5,5z" fill="#B9D7B3"/>` +
    `<circle cy="-1" r="3.6" fill="#F7A9BF"/><path d="M-1.4,-1.6a1.6,1.6 0 1 1 2.4,1.2" fill="none" stroke="#EE8BA7" stroke-width="1"/></g>`;
  const dots = (x: number, y: number) =>
    `<g fill="#fff" opacity=".85"><circle cx="${x}" cy="${y}" r="1.6"/><circle cx="${x + 4}" cy="${y + 3}" r="1.2"/><circle cx="${x - 3}" cy="${y + 4}" r="1.1"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="96">${bud(18, 22, -12)}${bud(18, 70, 14)}${dots(54, 44)}${dots(53, 90)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function piece(cls: string, markup: string) {
  const el = h(`div.${cls}`);
  el.innerHTML = markup;
  return el;
}

export function installShop() {
  if (document.querySelector('.shop')) return;
  document.documentElement.style.setProperty('--sprig', cssSprig());
  const shop = h(
    'div.shop',
    { 'aria-hidden': 'true' },
    h('div.shop-wall'),
    h('div.shop-wainscot'),
    h('div.shop-floor'),
    piece('shop-plant shop-plant--l', hangingPlant('#F4A3A0')),
    piece('shop-plant shop-plant--r', hangingPlant('#C9B6FF')),
    piece('shop-stand', stand()),
    piece('shop-wrap', wrapStation()),
    h('div.shop-awning'),
    lights(),
  );
  document.body.prepend(shop);
}
