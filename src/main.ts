import './style.css';
import { decodeBouquet } from './codec';
import { sticker } from './decor';
import { h, toast } from './dom';
import { installShop } from './shop';
import { installPaints } from './sparkle';
import { store } from './store';
import { arrangeView } from './views/arrange';
import { drawView } from './views/draw';
import { receiveView } from './views/receive';
import { sendView } from './views/send';

installPaints();
installShop();

type Step = 'draw' | 'arrange' | 'send';
type View = HTMLElement & { cleanup?: () => void; beforeLeave?: () => void };
const STEPS: { id: Step; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'arrange', label: 'Arrange' },
  { id: 'send', label: 'Send' },
];

const app = document.getElementById('app')!;
let current: View | null = null;

function logo() {
  return h('a.logo', { href: location.pathname, 'aria-label': 'Posy home' }, sticker('flower', 'logo-mark'), h('span.logo-word', null, 'posy'));
}

function header(step: Step | null) {
  const idx = STEPS.findIndex((x) => x.id === step);
  const nav = step
    ? h(
        'ol.steps',
        { 'aria-label': 'Progress' },
        ...STEPS.map((s, i) => {
          return h(
            'li.step',
            { class: i === idx ? 'is-current' : i < idx ? 'is-done' : '' },
            h(
              'button.step-btn',
              {
                type: 'button',
                disabled: i === idx,
                'aria-current': i === idx ? 'step' : null,
                onclick: () => {
                  current?.beforeLeave?.();
                  if (s.id !== 'draw' && !store.bouquet.flowers.length) return toast('Draw a flower first — or tap Surprise me');
                  compose(s.id);
                },
              },
              h('span.step-num', null, i < idx ? '✓' : String(i + 1)),
              h('span.step-label', null, s.label),
            ),
          );
        }),
      )
    : null;
  return h('header.masthead', null, logo(), nav);
}

function mount(view: View, step: Step | null) {
  current?.cleanup?.();
  current = view;
  app.replaceChildren(
    header(step),
    view,
    h('footer.colophon', null, 'made by hand with ', h('span.heart', null, '♡'), ' & a little glitter · your bouquet lives only in its link'),
  );
  window.scrollTo({ top: 0 });
}

function compose(step: Step) {
  const go = (s: Step) => {
    if (s === 'draw') history.replaceState(null, '', location.pathname);
    compose(s);
  };
  const view = step === 'draw' ? drawView(go) : step === 'arrange' ? arrangeView(go) : sendView(go);
  mount(view, step);
}

async function route() {
  const match = location.hash.match(/^#b=([A-Za-z0-9_-]+)$/);
  if (!match) return compose('draw');
  try {
    const bouquet = await decodeBouquet(match[1]);
    mount(
      receiveView(bouquet, () => {
        history.pushState(null, '', location.pathname);
        compose('draw');
      }),
      null,
    );
  } catch (err) {
    console.error(err);
    mount(
      h(
        'section.view.view--lost',
        null,
        h('p.eyebrow', null, 'oh no'),
        h('h1.display', null, 'These flowers got ', h('em', null, 'lost in the post')),
        h('p.lede', null, 'The link looks incomplete — it may have been cut off when it was shared. Ask the sender to copy it again.'),
        h('a.primary', { href: location.pathname }, 'Draw your own bouquet'),
      ),
      null,
    );
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
route();
