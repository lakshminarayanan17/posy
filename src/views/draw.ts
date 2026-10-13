import { flowerThumb } from '../bouquet';
import { sticker, tape } from '../decor';
import { h, icon, toast } from '../dom';
import { surpriseFlower } from '../generate';
import { ANCHOR, CARD_H, CARD_W, INK_ORDER, INKS, MAX_FLOWERS, SIZES, type Point, type Stroke } from '../model';
import { store } from '../store';
import { inkPath, outline, quantize, simplify, strokePath, svg } from '../stroke';

export function drawView(go: (step: 'arrange') => void): HTMLElement {
  let ink = 11;
  let sizeIdx = 2;
  // Snapshots of the card before each change, so Undo also reverses Clear and Surprise.
  let history: Stroke[][] = [];
  const remember = () => {
    history.push(store.card.strokes.slice());
    if (history.length > 80) history.shift();
  };

  // ---- Drawing card -------------------------------------------------------
  const board = svg('svg', { viewBox: `0 0 ${CARD_W} ${CARD_H}`, class: 'board', 'aria-label': 'Drawing card' });
  const label = (text: string, attrs: Record<string, string | number>) => {
    const t = svg('text', { class: 'guide-label', ...attrs });
    t.textContent = text;
    return t;
  };
  const guides = svg('g', { class: 'guides', 'aria-hidden': 'true' });
  guides.append(
    svg('path', { d: 'M18 300 H282', class: 'guide-line' }),
    label('the wrap starts here', { x: 282, y: 293, 'text-anchor': 'end' }),
    svg('circle', { cx: ANCHOR.x, cy: ANCHOR.y, r: 3.2, class: 'guide-dot' }),
    label('stems meet here', { x: ANCHOR.x + 10, y: ANCHOR.y + 3.5 }),
  );
  const layer = svg('g', { class: 'flower-ink' });
  const live = svg('g', { class: 'flower-ink' });
  const cursor = svg('circle', { class: 'brush-cursor', r: SIZES[sizeIdx] / 2, cx: -50, cy: -50 });
  board.append(guides, layer, live, cursor);

  const hint = h('div.board-hint', null, 'start with a petal…');
  const sheet = h('div.sheet', null, tape('gingham', 'tape--tl'), tape('mint', 'tape--tr'), board, hint);

  const paint = () => {
    layer.replaceChildren(...store.card.strokes.map((s) => strokePath(s)));
    sheet.classList.toggle('is-empty', store.card.strokes.length === 0);
    refresh();
  };

  const toCard = (e: PointerEvent): Point => {
    const r = board.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CARD_W;
    const y = ((e.clientY - r.top) / r.height) * CARD_H;
    return [Math.min(CARD_W, Math.max(0, x)), Math.min(CARD_H, Math.max(0, y))];
  };

  let raw: Point[] | null = null;
  let livePath: SVGPathElement | null = null;

  board.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    board.setPointerCapture(e.pointerId);
    raw = [toCard(e)];
    livePath = inkPath(outline(raw, SIZES[sizeIdx], false), ink);
    live.append(livePath);
    sheet.classList.remove('is-empty');
  });
  board.addEventListener('pointermove', (e) => {
    const p = toCard(e);
    cursor.setAttribute('cx', String(p[0]));
    cursor.setAttribute('cy', String(p[1]));
    if (!raw || !livePath) return;
    const events = e.getCoalescedEvents?.() ?? [e];
    for (const ce of events.length ? events : [e]) raw.push(toCard(ce));
    livePath.setAttribute('d', outline(raw, SIZES[sizeIdx], false));
  });
  const finish = () => {
    if (!raw) return;
    const points = simplify(raw.map(quantize), 0.55);
    live.replaceChildren();
    remember();
    store.card.strokes.push({ ink, size: SIZES[sizeIdx], points });
    raw = null;
    livePath = null;
    store.save();
    paint();
  };
  board.addEventListener('pointerup', finish);
  board.addEventListener('pointercancel', finish);
  board.addEventListener('pointerleave', () => cursor.setAttribute('cx', '-50'));

  const undo = () => {
    const prev = history.pop();
    if (!prev) return;
    store.card.strokes = prev;
    store.save();
    paint();
  };
  const clear = () => {
    if (!store.card.strokes.length) return;
    remember();
    store.card.strokes = [];
    store.save();
    paint();
    toast('Card cleared — Undo brings it back');
  };

  // ---- Tools --------------------------------------------------------------
  const swatches = h('div.swatches', { role: 'radiogroup', 'aria-label': 'Ink' });
  INK_ORDER.forEach((i) => {
    const c = INKS[i];
    const b = h('button.swatch', {
      type: 'button',
      role: 'radio',
      title: c.name,
      'aria-label': c.name,
      class: c.fill ? `swatch--glitter swatch--${c.fill}` : '',
      'data-ink': i,
      style: `--c:${c.hex}`,
      onclick: () => {
        ink = i;
        syncTools();
      },
    });
    swatches.append(b);
  });

  const sizes = h('div.sizes', { role: 'radiogroup', 'aria-label': 'Brush size' });
  SIZES.forEach((s, i) => {
    sizes.append(
      h(
        'button.size',
        {
          type: 'button',
          role: 'radio',
          'aria-label': `Brush ${s}px`,
          onclick: () => {
            sizeIdx = i;
            syncTools();
          },
        },
        h('span.size-dot', { style: `--s:${Math.max(4, s * 0.9)}px` }),
      ),
    );
  });

  const syncTools = () => {
    [...swatches.children].forEach((el) => el.setAttribute('aria-checked', String(Number((el as HTMLElement).dataset.ink) === ink)));
    [...sizes.children].forEach((el, i) => el.setAttribute('aria-checked', String(i === sizeIdx)));
    sizes.style.setProperty('--c', INKS[ink].hex);
    cursor.setAttribute('r', String(SIZES[sizeIdx] / 2));
    cursor.style.setProperty('--c', INKS[ink].hex);
  };

  const undoBtn = h('button.ghost.icon-btn', { type: 'button', onclick: undo, title: 'Undo (⌘Z)', 'aria-label': 'Undo' }, icon('undo'));
  const clearBtn = h('button.ghost.icon-btn', { type: 'button', onclick: clear, title: 'Clear the card', 'aria-label': 'Clear the card' }, icon('clear'));
  const surpriseBtn = h(
    'button.ghost.surprise',
    {
      type: 'button',
      title: 'Draw a random flower for me',
      onclick: () => {
        const had = store.card.strokes.length > 0;
        remember();
        store.card = { strokes: surpriseFlower().strokes };
        store.save();
        paint();
        if (had) toast('Swapped in a surprise — Undo gets yours back');
      },
    },
    icon('sparkle'),
    h('span', null, 'Surprise me'),
  );

  // ---- Bouquet tray -------------------------------------------------------
  const addBtn = h('button.primary', { type: 'button' });
  const tray = h('div.tray');
  const trayCount = h('span.tray-count');
  const nextBtn = h('button.primary.next', { type: 'button' }, h('span', null, 'Wrap my bouquet'), icon('arrow'));
  const helper = h('p.helper', null, 'Draw a flower — or tap Surprise me — and it lands here.');

  const commit = (): boolean => {
    if (!store.card.strokes.length) return false;
    const b = store.bouquet;
    if (store.editing != null && store.editing < b.flowers.length) {
      b.flowers[store.editing] = store.card;
    } else {
      if (b.flowers.length >= MAX_FLOWERS) {
        toast(`A bouquet holds ${MAX_FLOWERS} flowers — remove one to add another.`);
        return false;
      }
      b.flowers.push(store.card);
      store.syncPlacements();
    }
    store.card = { strokes: [] };
    store.editing = null;
    history = [];
    store.save();
    return true;
  };

  addBtn.addEventListener('click', () => {
    const editing = store.editing != null;
    sheet.classList.add('is-sending');
    setTimeout(() => {
      sheet.classList.remove('is-sending');
      if (commit()) toast(editing ? 'Flower updated' : 'Added to your bouquet');
      paint();
    }, 260);
  });

  nextBtn.addEventListener('click', () => {
    if (store.card.strokes.length) commit();
    if (store.bouquet.flowers.length) go('arrange');
  });

  const refresh = () => {
    const b = store.bouquet;
    const editing = store.editing != null;
    addBtn.replaceChildren(icon(editing ? 'check' : 'plus'), h('span', null, editing ? 'Save flower' : 'Add to bouquet'));
    addBtn.disabled = !store.card.strokes.length;
    undoBtn.disabled = !history.length;
    clearBtn.disabled = !store.card.strokes.length;
    nextBtn.disabled = !b.flowers.length && !store.card.strokes.length;
    helper.hidden = !nextBtn.disabled;
    trayCount.textContent = `${b.flowers.length} / ${MAX_FLOWERS}`;

    tray.replaceChildren(
      ...b.flowers.map((f, i) =>
        h(
          'div.thumb',
          { class: store.editing === i ? 'is-editing' : '' },
          h(
            'button.thumb-open',
            {
              type: 'button',
              'aria-label': `Edit flower ${i + 1}`,
              onclick: () => {
                if (store.card.strokes.length && store.editing !== i) {
                  toast('Add or clear the flower on your card first');
                  return;
                }
                store.editing = i;
                store.card = structuredClone(f);
                history = [];
                store.save();
                paint();
              },
            },
            flowerThumb(f),
          ),
          h(
            'button.thumb-x',
            {
              type: 'button',
              'aria-label': `Remove flower ${i + 1}`,
              onclick: () => {
                b.flowers.splice(i, 1);
                b.placements.splice(i, 1);
                if (store.editing === i) {
                  store.editing = null;
                } else if (store.editing != null && store.editing > i) store.editing--;
                store.save();
                refresh();
              },
            },
            icon('x'),
          ),
        ),
      ),
      ...Array.from({ length: Math.max(0, Math.min(b.flowers.length ? 1 : 4, MAX_FLOWERS - b.flowers.length)) }, (_, k) =>
        h('div.thumb.thumb--empty', { 'aria-hidden': 'true' }, k === 0 ? h('span', null, '+') : null),
      ),
    );
  };

  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      undo();
    }
  };
  document.addEventListener('keydown', onKey);

  syncTools();
  paint();

  const view = h(
    'section.view.view--draw',
    null,
    h(
      'div.intro',
      null,
      h(
        'div.intro-title',
        null,
        h('p.eyebrow', null, 'step one'),
        h('h1.display', null, 'Draw someone ', h('em', null, 'flowers')),
        sticker('heart', 'intro-sticker intro-sticker--a'),
        sticker('sparkle', 'intro-sticker intro-sticker--b'),
      ),
      h('p.lede', null, 'Doodle a few blooms, wrap them in pretty paper and send the bouquet as a link. No sign-up, nothing to install.'),
    ),
    h(
      'div.studio',
      null,
      h(
        'div.stage.stage--draw',
        null,
        h(
          'div.palette',
          null,
          h('span.dymo', null, 'ink'),
          swatches,
          h('span.dymo', null, 'brush'),
          sizes,
        ),
        sheet,
        h('div.card-actions', null, undoBtn, clearBtn, surpriseBtn, h('span.spacer'), addBtn),
      ),
      h(
        'aside.panel.panel--tray',
        null,
        tape('pink', 'tape--panel'),
        h('div.label-row', null, h('span.dymo', null, 'your bouquet'), trayCount),
        tray,
        helper,
        nextBtn,
      ),
    ),
  );
  (view as HTMLElement & { beforeLeave?: () => void }).beforeLeave = () => {
    if (store.card.strokes.length) commit();
  };
  // Let the router remove our global listener.
  (view as HTMLElement & { cleanup?: () => void }).cleanup = () => document.removeEventListener('keydown', onKey);
  return view;
}
