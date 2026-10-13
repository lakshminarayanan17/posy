// Shared SVG paints: glitter inks, patterned wrapping papers and the CSS
// glitter texture. They live in one hidden <defs> so every inline SVG on the
// page (drawing card, thumbnails, bouquets) can reference them by id.

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Small seeded PRNG so glitter looks the same on every load. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => +n.toFixed(2);

/** Four-point sparkle centred on (x, y). */
export function sparklePath(x: number, y: number, s: number) {
  const k = s * 0.22;
  return `M${f(x)},${f(y - s)}Q${f(x + k)},${f(y - k)} ${f(x + s)},${f(y)}Q${f(x + k)},${f(y + k)} ${f(x)},${f(y + s)}Q${f(x - k)},${f(y + k)} ${f(x - s)},${f(y)}Q${f(x - k)},${f(y - k)} ${f(x)},${f(y - s)}Z`;
}

function heartPath(x: number, y: number, s: number) {
  const p = (dx: number, dy: number) => `${f(x + dx * s)},${f(y + dy * s)}`;
  return `M${p(0, 0.9)}C${p(-1.25, 0)} ${p(-0.62, -0.95)} ${p(0, -0.35)}C${p(0.62, -0.95)} ${p(1.25, 0)} ${p(0, 0.9)}Z`;
}

function starPath(x: number, y: number, r: number, rot = 0) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = rot + (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

function specks(seed: number, n: number, w: number, h: number, colors: string[], rMin: number, rMax: number) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = colors[Math.floor(r() * colors.length)];
    out += `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${f(rMin + r() * (rMax - rMin))}" fill="${c}" opacity="${f(0.55 + r() * 0.45)}"/>`;
  }
  return out;
}

function twinkles(seed: number, n: number, w: number, h: number, s: number, color = '#fff') {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const anim = reduceMotion()
      ? ''
      : `<animate attributeName="opacity" values="0;1;0" dur="${f(1.4 + r() * 1.4)}s" begin="${f(-r() * 3)}s" repeatCount="indefinite"/>`;
    out += `<path d="${sparklePath(r() * w, r() * h, s * (0.7 + r() * 0.6))}" fill="${color}">${anim}</path>`;
  }
  return out;
}

const HOLO_STOPS = `
  <stop offset="0" stop-color="#FFC6DF"/><stop offset=".22" stop-color="#DCC8FF"/>
  <stop offset=".45" stop-color="#BFE6FF"/><stop offset=".66" stop-color="#C8F4DF"/>
  <stop offset=".84" stop-color="#FFF1B8"/><stop offset="1" stop-color="#FFC6DF"/>`;

function pattern(id: string, w: number, h: number, body: string, extra = '') {
  return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" ${extra}>${body}</pattern>`;
}

function glitter(id: string, base: string, colors: string[], seed: number) {
  return pattern(
    id,
    16,
    16,
    `<rect width="16" height="16" fill="${base}"/>${specks(seed, 30, 16, 16, colors, 0.35, 1.05)}${twinkles(seed + 1, 2, 16, 16, 1.7)}`,
  );
}

function paints() {
  const holoShift = reduceMotion()
    ? ''
    : `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="160 0" dur="9s" additive="sum" repeatCount="indefinite"/>`;
  return [
    `<linearGradient id="holo-grad" x1="0" x2="1" y1="0" y2="0">${HOLO_STOPS}</linearGradient>`,

    // Inks
    glitter('glitter-gold', '#DDA944', ['#FFF4C9', '#FBDC85', '#B07F25', '#FFFFFF', '#F2C35A'], 11),
    glitter('glitter-pink', '#F27BA6', ['#FFD7E6', '#FFFFFF', '#D44A7E', '#FFB3CF', '#FF9EC2'], 23),
    pattern(
      'glitter-holo',
      40,
      40,
      `<rect width="40" height="40" fill="url(#holo-grad)"/>${specks(37, 60, 40, 40, ['#FFFFFF', '#FFF7FB', '#E9DDFF', '#FFE3EF'], 0.35, 1.1)}${twinkles(38, 4, 40, 40, 2)}`,
    ),

    // Wrapping papers
    pattern(
      'paper-gingham',
      26,
      26,
      `<rect width="26" height="26" fill="#FFF6F8"/><rect width="13" height="26" fill="#F59AB4" opacity=".42"/><rect width="26" height="13" fill="#F59AB4" opacity=".42"/>`,
    ),
    pattern(
      'paper-dots',
      34,
      34,
      `<rect width="34" height="34" fill="#EF5A72"/><circle cx="8.5" cy="8.5" r="3.8" fill="#FFF4F0"/><circle cx="25.5" cy="25.5" r="3.8" fill="#FFF4F0"/>`,
    ),
    pattern(
      'paper-hearts',
      44,
      44,
      `<rect width="44" height="44" fill="#FFF1E6"/>
       <path d="${heartPath(11, 12, 6)}" fill="#E8365A" transform="rotate(-14 11 12)"/>
       <path d="${heartPath(33, 33, 5)}" fill="#F7A0BE" transform="rotate(12 33 33)"/>
       <circle cx="33" cy="11" r="1.4" fill="#F7A0BE"/><circle cx="11" cy="34" r="1.4" fill="#E8365A" opacity=".6"/>`,
    ),
    pattern(
      'paper-holo',
      160,
      160,
      `<rect width="160" height="160" fill="url(#holo-grad)"/>${specks(51, 140, 160, 160, ['#FFFFFF', '#FFF9E8', '#F3E9FF'], 0.4, 1.3)}${twinkles(52, 7, 160, 160, 3.4)}${holoShift}`,
      'patternTransform="rotate(-28)"',
    ),
    pattern(
      'paper-stars',
      56,
      56,
      `<rect width="56" height="56" fill="#2B2F5C"/>
       <path d="${starPath(14, 14, 5, 0.2)}" fill="#F5D46B" stroke="#F5D46B" stroke-width="1.4" stroke-linejoin="round"/>
       <path d="${sparklePath(42, 38, 5)}" fill="#FFF6D6"/>
       <path d="${starPath(36, 10, 2.6, -0.3)}" fill="#F7A0BE" stroke="#F7A0BE" stroke-linejoin="round"/>
       <circle cx="10" cy="44" r="1.3" fill="#fff" opacity=".8"/><circle cx="26" cy="30" r=".9" fill="#fff" opacity=".7"/>
       ${twinkles(61, 2, 56, 56, 2.2, '#FFF6D6')}`,
    ),
    pattern(
      'paper-stripes',
      18,
      18,
      `<rect width="18" height="18" fill="#F6FFFA"/><rect width="9" height="18" fill="#B9EAD3"/><rect x="9" width="1.4" height="18" fill="#fff" opacity=".8"/>`,
      'patternTransform="rotate(38)"',
    ),
    pattern(
      'paper-print',
      46,
      9,
      `<rect width="46" height="9" fill="#EEE8DB"/><rect x="0" y="3" width="40" height="2.2" rx="1" fill="#8b8172" opacity=".28"/>`,
      'patternTransform="rotate(-8)"',
    ),
  ].join('');
}

/** A transparent glitter texture for CSS backgrounds. */
function cssGlitter() {
  const w = 90;
  const body =
    specks(71, 70, w, w, ['#FFFFFF', '#FFF2B3', '#FFC2D8', '#E6D8FF'], 0.4, 1.25) +
    `<path d="${sparklePath(20, 24, 3.2)}" fill="#fff"/><path d="${sparklePath(66, 62, 2.6)}" fill="#fff"/>`;
  const svg = `<svg xmlns="${SVG_NS}" width="${w}" height="${w}">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** A paper lace doily: scalloped rim, a ring of punched holes, a dotted inner ring. */
function cssDoily() {
  const c = 200;
  const n = 40;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const am = ((i - 0.5) / n) * Math.PI * 2;
    const [x, y] = [c + Math.cos(a) * 186, c + Math.sin(a) * 186];
    const [qx, qy] = [c + Math.cos(am) * 200, c + Math.sin(am) * 200];
    d += i ? `Q${f(qx)},${f(qy)} ${f(x)},${f(y)}` : `M${f(x)},${f(y)}`;
  }
  let holes = '';
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    holes += `<circle cx="${f(c + Math.cos(a) * 172)}" cy="${f(c + Math.sin(a) * 172)}" r="5"/>`;
  }
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    holes += `<circle cx="${f(c + Math.cos(a) * 150)}" cy="${f(c + Math.sin(a) * 150)}" r="2.2"/>`;
  }
  const svg = `<svg xmlns="${SVG_NS}" viewBox="0 0 400 400"><mask id="m"><path d="${d}Z" fill="#fff"/><g fill="#000">${holes}</g></mask><path d="${d}Z" fill="#fff" mask="url(#m)"/><circle cx="200" cy="200" r="136" fill="none" stroke="#F7C6D6" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function installPaints() {
  if (document.getElementById('posy-paints')) return;
  const host = document.createElementNS(SVG_NS, 'svg');
  host.id = 'posy-paints';
  host.setAttribute('aria-hidden', 'true');
  host.setAttribute('width', '0');
  host.setAttribute('height', '0');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  host.innerHTML = `<defs>${paints()}</defs>`;
  document.body.prepend(host);
  document.documentElement.style.setProperty('--glitter', cssGlitter());
  document.documentElement.style.setProperty('--doily', cssDoily());
}
