import { renderBouquet } from '../bouquet';
import { encodeBouquet } from '../codec';
import { sticker, tape } from '../decor';
import { h, icon, toast } from '../dom';
import { longLink, shorten } from '../links';
import { MAX_NAME, MAX_NOTE } from '../model';
import { store } from '../store';

export function sendView(go: (step: 'arrange' | 'draw') => void): HTMLElement {
  const b = store.bouquet;
  const preview = h('div.bouquet-stage.bouquet-stage--small', null, renderBouquet(b, { sparkles: true }).root);

  const input = (key: 'to' | 'from', placeholder: string) =>
    h('input.line-input', {
      type: 'text',
      value: b[key],
      placeholder,
      maxLength: MAX_NAME,
      autocomplete: 'off',
      oninput: (e: Event) => {
        b[key] = (e.target as HTMLInputElement).value;
        store.save();
        invalidate();
      },
    });

  const counter = h('span.counter');
  const note = h('textarea.note-input', {
    rows: 5,
    maxLength: MAX_NOTE,
    placeholder: 'write something sweet…',
    value: b.note,
    oninput: () => {
      b.note = note.value;
      counter.textContent = `${MAX_NOTE - note.value.length}`;
      store.save();
      invalidate();
    },
  });
  counter.textContent = `${MAX_NOTE - b.note.length}`;

  const card = h(
    'div.note-card',
    null,
    tape('glitter', 'tape--note'),
    sticker('cherry', 'note-sticker'),
    h('label.note-row', null, h('span.note-label', null, 'To'), input('to', 'their name')),
    h('div.note-lines', null, note, counter),
    h('label.note-row.note-row--from', null, h('span.note-label', null, 'From'), input('from', 'your name')),
  );

  const result = h('div.share-result');
  // The link is a snapshot; once the note changes, it has to be wrapped again.
  const invalidate = () => {
    if (!view.classList.contains('is-done')) return;
    view.classList.remove('is-done');
    result.classList.remove('is-in', 'panel');
    result.replaceChildren();
  };
  const wrapBtn = h('button.primary.next', { type: 'button' }, h('span', null, 'Wrap it & get the link'), icon('arrow'));

  wrapBtn.addEventListener('click', async () => {
    wrapBtn.disabled = true;
    try {
      const code = await encodeBouquet(b);
      const url = (await shorten(code)) ?? longLink(code);
      showResult(url);
    } catch (err) {
      console.error(err);
      toast('Something went wrong wrapping your bouquet');
    } finally {
      wrapBtn.disabled = false;
    }
  });

  const showResult = (url: string) => {
    const field = h('input.link-field', { type: 'text', readOnly: true, value: url, 'aria-label': 'Bouquet link', onfocus: (e: Event) => (e.target as HTMLInputElement).select() });
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied — go make someone’s day');
      } catch {
        field.select();
        toast('Press ⌘C / Ctrl+C to copy');
      }
    };
    const actions = h(
      'div.share-actions',
      null,
      h('button.primary', { type: 'button', onclick: copy }, icon('copy'), h('span', null, 'Copy link')),
      'share' in navigator
        ? h(
            'button.ghost',
            {
              type: 'button',
              onclick: () =>
                navigator
                  .share({ title: b.to ? `Flowers for ${b.to}` : 'Flowers for you', text: 'I hand-drew you a bouquet 💐', url })
                  .catch(() => {}),
            },
            icon('share'),
            h('span', null, 'Share'),
          )
        : null,
      h('a.ghost', { href: url, target: '_blank', rel: 'noopener' }, icon('eye'), h('span', null, 'Preview')),
    );
    result.replaceChildren(
      tape('lilac', 'tape--panel'),
      h('h2.result-title', null, 'All wrapped ', h('em', null, '& ready!')),
      h('p.muted', null, 'Send this link to them — it opens straight into your bouquet.'),
      field,
      actions,
      h(
        'button.text-btn',
        {
          type: 'button',
          onclick: () => {
            store.reset();
            go('draw');
          },
        },
        'Start a new bouquet',
      ),
    );
    result.classList.add('is-in', 'panel');
    view.classList.add('is-done');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const view = h(
    'section.view.view--send',
    null,
    h(
      'div.intro',
      null,
      h(
        'div.intro-title',
        null,
        h('p.eyebrow', null, 'step three'),
        h('h1.display', null, 'Add a ', h('em', null, 'little note')),
        sticker('daisy', 'intro-sticker intro-sticker--a'),
        sticker('heart', 'intro-sticker intro-sticker--b'),
      ),
      h('p.lede', null, 'A few words go a long way. Then wrap it up and send the link however you like.'),
    ),
    h(
      'div.studio.studio--send',
      null,
      h('div.stage', null, preview),
      h(
        'div.send-side',
        null,
        card,
        h(
          'div.nav-row',
          null,
          wrapBtn,
          h('button.ghost', { type: 'button', onclick: () => go('arrange') }, icon('back'), h('span', null, 'Back to arranging')),
        ),
        result,
      ),
    ),
  );
  return view;
}
