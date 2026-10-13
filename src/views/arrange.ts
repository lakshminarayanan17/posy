import { placementTransform, renderBouquet, tint } from '../bouquet';
import { sticker, tape } from '../decor';
import { h, icon, toast } from '../dom';
import { autoArrange, PAPER_ORDER, PAPERS, RIBBON_ORDER, RIBBONS } from '../model';
import { store } from '../store';
import { svg } from '../stroke';

/** A little square of the paper, painted with the same pattern as the wrap. */
function paperSwatch(i: number) {
  const p = PAPERS[i];
  const root = svg('svg', { viewBox: '0 0 90 60', class: 'paper-swatch', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid slice' });
  root.append(
    svg('rect', { width: 90, height: 60, fill: p.pattern ? `url(#${p.pattern})` : p.base }),
    svg('path', { d: 'M54,0 L90,0 L90,60 L30,60 Z', fill: p.pattern ? '#3D2140' : p.shade, opacity: p.pattern ? 0.1 : 1 }),
  );
  return root;
}

/** A tiny bow in the ribbon's colour. */
function ribbonSwatch(i: number) {
  const r = RIBBONS[i];
  const fill = r.fill ? `url(#${r.fill})` : r.hex;
  const dark = tint(r.hex, -0.22);
  const root = svg('svg', { viewBox: '0 0 48 36', class: 'ribbon-swatch', 'aria-hidden': 'true' });
  root.append(
    svg('path', { d: 'M22,19 L14,34 L19,32 L21,36 L25,20 Z', fill: dark }),
    svg('path', { d: 'M26,19 L34,34 L29,32 L27,36 L23,20 Z', fill }),
    svg('path', { d: 'M23,17 C16,5 3,3 3,13 C3,23 16,22 23,19 Z', fill }),
    svg('path', { d: 'M25,17 C32,5 45,3 45,13 C45,23 32,22 25,19 Z', fill }),
    svg('rect', { x: 19.5, y: 12.5, width: 9, height: 10, rx: 4, fill: dark }),
  );
  return root;
}

export function arrangeView(go: (step: 'draw' | 'send') => void): HTMLElement {
  const b = store.bouquet;
  store.syncPlacements();
  let selected: number | null = null;

  const stageWrap = h('div.bouquet-stage');
  const tools = h('div.float-tools', { role: 'toolbar', 'aria-label': 'Selected flower' });

  const render = () => {
    const { root, flowerGroups } = renderBouquet(b, { className: 'is-editable' });
    flowerGroups.forEach((g, i) => {
      g.classList.toggle('is-selected', i === selected);
      attachDrag(root, g, i);
    });
    root.addEventListener('pointerdown', (e) => {
      if (!(e.target as Element).closest('.flower')) select(null);
    });
    stageWrap.replaceChildren(root);
    syncTools();
  };

  const select = (i: number | null) => {
    selected = i;
    stageWrap.querySelectorAll('.flower').forEach((g, k) => g.classList.toggle('is-selected', k === i));
    syncTools();
  };

  const attachDrag = (root: SVGSVGElement, g: SVGGElement, i: number) => {
    let start: { x: number; y: number; px: number; py: number } | null = null;
    const toBouquet = (e: PointerEvent) => {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(root.getScreenCTM()!.inverse());
      return { x: p.x, y: p.y };
    };
    g.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      g.setPointerCapture(e.pointerId);
      const p = toBouquet(e);
      start = { x: p.x, y: p.y, px: b.placements[i].x, py: b.placements[i].y };
      select(i);
      g.classList.add('is-dragging');
    });
    g.addEventListener('pointermove', (e) => {
      if (!start) return;
      const p = toBouquet(e);
      const pl = b.placements[i];
      // Keep stems inside the wrap so the bouquet never falls apart.
      pl.x = Math.round(Math.min(390, Math.max(210, start.px + p.x - start.x)));
      pl.y = Math.round(Math.min(600, Math.max(430, start.py + p.y - start.y)));
      g.setAttribute('transform', placementTransform(pl));
    });
    const end = () => {
      if (!start) return;
      start = null;
      g.classList.remove('is-dragging');
      store.save();
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
    g.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        select(i);
        nudge({ scale: e.deltaY < 0 ? 0.04 : -0.04 });
      },
      { passive: false },
    );
  };

  const nudge = (d: { rot?: number; scale?: number }) => {
    if (selected == null) return;
    const pl = b.placements[selected];
    pl.rot = Math.max(-80, Math.min(80, pl.rot + (d.rot ?? 0)));
    pl.scale = +Math.max(0.45, Math.min(1.15, pl.scale + (d.scale ?? 0))).toFixed(2);
    stageWrap.querySelectorAll<SVGGElement>('.flower')[selected]?.setAttribute('transform', placementTransform(pl));
    store.save();
  };

  const toFront = () => {
    if (selected == null) return;
    const [f] = b.flowers.splice(selected, 1);
    const [p] = b.placements.splice(selected, 1);
    b.flowers.push(f);
    b.placements.push(p);
    selected = b.flowers.length - 1;
    store.save();
    render();
  };

  const remove = () => {
    if (selected == null) return;
    b.flowers.splice(selected, 1);
    b.placements.splice(selected, 1);
    selected = null;
    store.save();
    if (!b.flowers.length) return go('draw');
    toast('Flower removed');
    render();
  };

  const toolBtn = (name: string, label: string, fn: () => void) =>
    h('button.tool', { type: 'button', title: label, 'aria-label': label, onclick: fn }, icon(name));

  tools.append(
    toolBtn('rotl', 'Tilt left', () => nudge({ rot: -6 })),
    toolBtn('rotr', 'Tilt right', () => nudge({ rot: 6 })),
    h('span.tool-sep'),
    toolBtn('shrink', 'Smaller', () => nudge({ scale: -0.06 })),
    toolBtn('grow', 'Bigger', () => nudge({ scale: 0.06 })),
    h('span.tool-sep'),
    toolBtn('front', 'Bring to front', toFront),
    toolBtn('clear', 'Remove flower', remove),
  );

  const syncTools = () => {
    tools.classList.toggle('is-active', selected != null);
    hint.classList.toggle('is-hidden', selected != null);
  };
  const hint = h('p.stage-hint', null, 'drag a flower to move it · tap it to tilt & resize');

  // ---- Paper & ribbon -------------------------------------------------------
  const papers = h('div.papers', { role: 'radiogroup', 'aria-label': 'Wrapping paper' });
  const sync = (group: HTMLElement, value: number) =>
    [...group.children].forEach((el) => el.setAttribute('aria-checked', String(Number((el as HTMLElement).dataset.i) === value)));
  PAPER_ORDER.forEach((i) => {
    papers.append(
      h(
        'button.paper-chip',
        {
          type: 'button',
          role: 'radio',
          'data-i': i,
          title: PAPERS[i].name,
          onclick: () => {
            b.paper = i;
            store.save();
            sync(papers, i);
            render();
          },
        },
        paperSwatch(i),
        h('span.paper-name', null, PAPERS[i].name),
      ),
    );
  });
  sync(papers, b.paper);

  const ribbons = h('div.ribbons', { role: 'radiogroup', 'aria-label': 'Ribbon' });
  RIBBON_ORDER.forEach((i) => {
    ribbons.append(
      h(
        'button.ribbon-chip',
        {
          type: 'button',
          role: 'radio',
          'data-i': i,
          title: RIBBONS[i].name,
          'aria-label': RIBBONS[i].name,
          onclick: () => {
            b.ribbon = i;
            store.save();
            sync(ribbons, i);
            render();
          },
        },
        ribbonSwatch(i),
      ),
    );
  });
  sync(ribbons, b.ribbon);

  const shuffle = h(
    'button.ghost',
    {
      type: 'button',
      onclick: () => {
        b.placements = autoArrange(b.flowers.length, 1);
        // Shuffle stacking order too.
        const order = b.flowers.map((_, i) => i).sort(() => Math.random() - 0.5);
        b.flowers = order.map((i) => b.flowers[i]);
        b.placements = order.map((i) => b.placements[i]);
        selected = null;
        store.save();
        render();
      },
    },
    icon('shuffle'),
    h('span', null, 'Re-arrange'),
  );

  render();

  return h(
    'section.view.view--arrange',
    null,
    h(
      'div.intro',
      null,
      h(
        'div.intro-title',
        null,
        h('p.eyebrow', null, 'step two'),
        h('h1.display', null, 'Wrap it ', h('em', null, 'up')),
        sticker('bow', 'intro-sticker intro-sticker--a'),
        sticker('star', 'intro-sticker intro-sticker--b'),
      ),
      h('p.lede', null, 'Pick a cute paper and a ribbon, then nudge each bloom until it looks just right.'),
    ),
    h(
      'div.studio',
      null,
      h('div.stage', null, stageWrap, hint, tools),
      h(
        'aside.panel',
        null,
        tape('dots', 'tape--panel'),
        h('div.field', null, h('span.dymo', null, 'wrapping paper'), papers),
        h('div.field', null, h('span.dymo', null, 'ribbon'), ribbons),
        h('div.field', null, shuffle),
        h(
          'div.nav-row',
          null,
          h('button.primary.next', { type: 'button', onclick: () => go('send') }, h('span', null, 'Write a note'), icon('arrow')),
          h('button.ghost', { type: 'button', onclick: () => go('draw') }, icon('back'), h('span', null, 'Draw more flowers')),
        ),
      ),
    ),
  );
}
