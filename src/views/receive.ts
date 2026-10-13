import { renderBouquet, replay } from '../bouquet';
import { sticker, tape } from '../decor';
import { h, icon } from '../dom';
import { RIBBONS, type Bouquet } from '../model';
import { store } from '../store';

const OUTLINE = 'stroke="#3D2140" stroke-width="2.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
const POCKET = `<svg viewBox="0 0 300 200" preserveAspectRatio="none">
  <path d="M3,4 L150,116 L297,4 L297,188 Q297,197 288,197 L12,197 Q3,197 3,188 Z" fill="#FFD3E0" ${OUTLINE}/>
  <path d="M5,195 L128,100 M295,195 L172,100" fill="none" stroke="#3D2140" stroke-width="1.6" opacity=".22" vector-effect="non-scaling-stroke"/></svg>`;
const FLAP = `<svg viewBox="0 0 300 124" preserveAspectRatio="none">
  <path d="M3,3 L297,3 L163,114 Q150,124 137,114 Z" fill="#FFB5CB" ${OUTLINE}/>
  <path d="M30,10 L270,10" stroke="#fff" stroke-width="2" stroke-dasharray="5 6" stroke-linecap="round" opacity=".7" vector-effect="non-scaling-stroke"/></svg>`;

function part(sel: 'span.envelope-pocket' | 'span.envelope-flap', markup: string) {
  const el = h(sel);
  el.innerHTML = markup;
  return el;
}

export function receiveView(b: Bouquet, onDrawBack: () => void): HTMLElement {
  const { root, inkGroups } = renderBouquet(b, { empty: true, className: 'is-unwrapping', sparkles: true });
  const stage = h('div.bouquet-stage.bouquet-stage--gift', null, root);
  let controller: AbortController | null = null;

  const play = async () => {
    controller?.abort();
    controller = new AbortController();
    await replay(b, inkGroups, { signal: controller.signal });
    if (!controller.signal.aborted) view.classList.add('is-bloomed');
  };

  // A cream seal would vanish into the cream envelope, so use rose for it.
  const ribbon = b.ribbon > 0 && RIBBONS[b.ribbon] ? RIBBONS[b.ribbon].hex : RIBBONS[1].hex;
  const envelope = h(
    'button.envelope',
    {
      type: 'button',
      style: `--seal:${ribbon}`,
      'aria-label': 'Open your bouquet',
      onclick: () => {
        view.classList.add('is-open');
        burst();
        setTimeout(play, 650);
      },
    },
    h('span.envelope-back'),
    h('span.envelope-liner'),
    part('span.envelope-pocket', POCKET),
    part('span.envelope-flap', FLAP),
    h('span.envelope-stamp', null, sticker('flower')),
    h('span.envelope-to', null, b.to ? `for ${b.to}` : 'for you'),
    tape('gingham', 'tape--envelope'),
    h('span.envelope-seal', null, '♥'),
    h('span.envelope-cta', null, 'tap to open'),
  );

  // A pop of hearts, stars and glitter when the envelope opens.
  const confetti = h('div.confetti', { 'aria-hidden': 'true' });
  const burst = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const shapes = ['heart', 'star', 'dot', 'sparkle'];
    const colors = ['#FF8FB1', '#FFD25E', '#C9B6FF', '#E8365A', '#9EE2C3', '#FFB3CC'];
    confetti.replaceChildren(
      ...Array.from({ length: 34 }, (_, i) => {
        const a = (i / 34) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 180;
        return h('span.bit', {
          class: `bit--${shapes[i % shapes.length]}`,
          style: `--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist - 80}px;--r:${Math.random() * 540 - 270}deg;--c:${colors[i % colors.length]};--d:${0.9 + Math.random() * 0.6}s`,
        });
      }),
    );
  };

  const note = h(
    'figure.gift-note',
    null,
    tape('mint', 'tape--note'),
    sticker('bow', 'note-sticker'),
    b.to ? h('p.gift-to', null, `Dear ${b.to},`) : null,
    b.note ? h('blockquote.gift-text', null, b.note) : null,
    h('figcaption.gift-from', null, b.from ? `— ${b.from}` : '— with love'),
  );

  const actions = h(
    'div.gift-actions',
    null,
    h('button.ghost', { type: 'button', onclick: play }, icon('replay'), h('span', null, 'Watch it bloom again')),
    h(
      'button.primary',
      {
        type: 'button',
        onclick: () => {
          store.reset();
          store.bouquet.to = b.from;
          store.save();
          onDrawBack();
        },
      },
      h('span', null, b.from ? `Draw ${b.from} flowers back` : 'Draw some back'),
      icon('arrow'),
    ),
  );

  const petals = h(
    'div.falling',
    { 'aria-hidden': 'true' },
    ...Array.from({ length: 12 }, (_, i) =>
      h('span.petal', { style: `--x:${(i * 83) % 100}vw;--d:${9 + (i % 5) * 2.3}s;--delay:${-i * 1.7}s;--r:${(i * 47) % 360}deg;--c:${['#F3B7AE', '#E7848F', '#F2D15F', '#B39BD6'][i % 4]}` }),
    ),
  );

  const view = h(
    'section.view.view--receive',
    null,
    petals,
    h(
      'div.gift-head',
      null,
      h('p.dymo.dymo--big', null, b.from ? `${b.from} hand-drew you flowers` : 'someone hand-drew you flowers'),
      h('h1.display', null, h('em', null, b.to ? `For ${b.to}` : 'For you')),
    ),
    h('div.gift', null, h('div.gift-stage', null, stage, confetti, envelope), h('div.gift-side', null, note, actions)),
  );
  return view;
}
