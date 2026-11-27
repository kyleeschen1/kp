import { readNotebook, object, type Cell, type Inline } from './model.ts';
import './blocks.css';
import './preview.css';
import './theme.css';
import { readStyleSettings, applyStyles } from './styles.ts';
import { readEndpointCommentary } from '../reader/document/public-api.ts';
import { renderInlineObject } from './inline-source.ts';
import { CommandShortcut } from '../editor-commands/shortcut.ts';

/** Mounted only by the development preview host. Apply checked editorial data
 * without replacing the native equation, clock, story or passage containers. */
export function mountFractionNotebookPreview(input: {
  replaceAnnotations: (value: unknown) => void; refresh: () => void; preserveLayout: (change: () => void) => void;
}) {
  let selected: string | undefined;
  let captionId: string | undefined;
  const send = (data: unknown) => window.parent.postMessage(data, window.location.origin);
  const shortcut = new CommandShortcut();
  const resetShortcut = () => shortcut.reset();
  const focusWindow = () => send({ protocol: 'kp.fraction-notebook.v1', kind: 'window-focus' });
  const cycleWindow = (event: KeyboardEvent) => {
    const command = shortcut.next(event, performance.now());
    if (command !== 'pass') { event.preventDefault(); event.stopImmediatePropagation(); if (command === 'open') send({ protocol: 'kp.fraction-notebook.v1', kind: 'commands-open' }); return; }
    if (event.isComposing || !event.ctrlKey || event.altKey || event.metaKey || event.code !== 'Backquote') return;
    event.preventDefault(); event.stopPropagation();
    send({ protocol: 'kp.fraction-notebook.v1', kind: 'window-cycle', reverse: event.shiftKey });
  };
  document.addEventListener('pointerdown', focusWindow); document.addEventListener('focusin', focusWindow);
  document.addEventListener('keydown', cycleWindow, true);
  document.addEventListener('pointerdown', resetShortcut, true); window.addEventListener('blur', resetShortcut);
  const navigation = document.querySelector<HTMLDetailsElement>('.kp-rising-navigation');
  const moments = document.createElement('select'); moments.className = 'fn-preview-moments'; moments.setAttribute('aria-label', 'Animation moment');
  for (const beat of document.querySelectorAll<HTMLElement>('[data-kp-beat]')) {
    const option = document.createElement('option'); option.value = beat.id; option.textContent = beat.querySelector('h2')?.textContent ?? beat.id; moments.append(option);
  }
  moments.onchange = () => [...document.querySelectorAll<HTMLAnchorElement>('.kp-lesson-toc a')].find(link => link.hash.slice(1) === moments.value)?.click();
  document.body.append(moments);
  const toc = document.querySelector('.kp-lesson-toc');
  const syncMoment = new MutationObserver(() => {
    const active = toc?.querySelector<HTMLAnchorElement>('a[data-kp-toc-active=true]')?.hash.slice(1);
    if (active && [...moments.options].some(option => option.value === active)) moments.value = active;
  });
  if (toc) syncMoment.observe(toc, { attributes: true, attributeFilter: ['data-kp-toc-active'], subtree: true });
  const reportOptions = () => send({ protocol: 'kp.fraction-notebook.v1', kind: 'options-state', open: navigation?.open ?? false });
  navigation?.addEventListener('toggle', reportOptions);
  const append = (el: HTMLElement, content: readonly Inline[]) => {
    for (const inline of content) {
      let node: Node = inline.type === 'text' ? document.createTextNode(inline.text) : renderInlineObject(inline);
      if (inline.type === 'text') for (const mark of inline.marks) { const wrapper = document.createElement(mark); wrapper.append(node); node = wrapper; }
      if (inline.type === 'text') for (const annotation of inline.annotations) {
        const wrapper = document.createElement('span'); wrapper.dataset['annotationId'] = annotation.id; wrapper.append(node); node = wrapper;
      }
      el.append(node);
    }
  };
  const prose = (cell: Exclude<Cell, { type: 'story' | 'mathObject' | 'matrixObject' }>): HTMLElement => {
    const el = document.createElement(cell.type === 'articleHeader' ? 'header' : 'section');
    el.dataset['notebookCell'] = cell.id; el.id = cell.id;
    if (cell.type === 'articleHeader') {
      const title = document.createElement('h1'); title.id = cell.title.id; title.dataset['notebookCell'] = cell.title.id;
      append(title, cell.title.content); el.append(title);
      for (const author of cell.authors) {
        const credit = document.createElement('p'); credit.className = 'kp-document-byline'; credit.id = author.id; credit.dataset['notebookCell'] = author.id;
        credit.textContent = `${author.role === 'author' ? 'By' : author.role === 'editor' ? 'Edited by' : 'Translated by'} ${author.name}`;
        el.append(credit);
      }
    } else {
      el.className = 'fn-block'; el.dataset['layout'] = cell.layout; el.dataset['kind'] = cell.kind; el.dataset['folded'] = String(cell.folded);
      const content = document.createElement('div'); content.className = 'fn-block-content';
      if (cell.title) { const title = document.createElement('h2'); title.id = cell.title.id; title.dataset['notebookCell'] = cell.title.id;
        title.className = 'fn-block-title'; append(title, cell.title.content); content.append(title); }
      const paragraph = document.createElement('p'); append(paragraph, cell.content); content.append(paragraph);
      content.append(...cell.children.map(prose)); el.append(content);
      if (cell.children.length) {
        const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'fn-block-fold';
        const refresh = () => { const folded = el.dataset['folded'] === 'true'; toggle.textContent = folded ? '▸' : '▾';
          toggle.setAttribute('aria-expanded', String(!folded)); toggle.setAttribute('aria-label', `${folded ? 'Expand' : 'Collapse'} ${cell.children.length} child blocks`); };
        toggle.onclick = () => { el.dataset['folded'] = String(el.dataset['folded'] !== 'true'); refresh(); input.refresh(); };
        refresh(); el.prepend(toggle);
      }
    }
    return el;
  };
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    try {
      const message = object(event.data);
      if (message['protocol'] !== 'kp.fraction-notebook.v1') return;
      if (message['kind'] === 'styles') { input.preserveLayout(() => applyStyles(readStyleSettings(message['settings']))); return; }
      if (message['kind'] === 'presentation' && typeof message['animationOnly'] === 'boolean') {
        input.preserveLayout(() => { document.body.dataset['notebookAnimationOnly'] = String(message['animationOnly']); }); return;
      }
      if (message['kind'] === 'options' && typeof message['open'] === 'boolean' && navigation) {
        navigation.open = message['open'];
        if (navigation.open) navigation.querySelector<HTMLElement>('button,a,input')?.focus({ preventScroll: true });
        return;
      }
      if (message['kind'] === 'reveal' && typeof message['id'] === 'string') {
        selected = message['id'];
        const target = [...document.querySelectorAll<HTMLElement>('[data-notebook-cell]')].find(el => el.dataset['notebookCell'] === selected);
        if (target?.classList.contains('kp-animation-story') || selected === captionId) {
          // Story wrappers use display:contents. Navigate through the reader's
          // own passage control so its semantic playhead follows the reveal.
          const first = document.querySelector<HTMLElement>('.kp-animation-story [data-kp-beat]');
          [...document.querySelectorAll<HTMLAnchorElement>('.kp-lesson-toc a')].find(link => link.hash.slice(1) === first?.id)?.click();
        } else if (target) {
          // A selection reveal must make its folded ancestry visible before
          // measuring scroll position; it does not rewrite the saved draft.
          for (let parent = target.parentElement; parent; parent = parent.parentElement) {
            if (parent.matches('.fn-block[data-folded=true]')) parent.querySelector<HTMLButtonElement>(':scope > .fn-block-fold')?.click();
          }
          target.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
        return;
      }
      if (message['kind'] !== 'apply') return;
      const data = object(message['value']), notebook = readNotebook(data['notebook']);
      const notes = readEndpointCommentary(data['notes']);
      const beats = [...document.querySelectorAll<HTMLElement>('[data-kp-beat]')];
      if (!Array.isArray(data['beats']) || data['beats'].length !== beats.length) throw new Error('Preview cannot change the checked mathematical sequence.');
      const edits = data['beats'].map((raw: unknown, index) => {
        const step = object(raw), beat = beats[index]!;
        if (step['id'] !== beat.dataset['kpBeat'] || step['progressPermille'] !== Number(beat.dataset['kpCheckpoint'])
          || typeof step['title'] !== 'string' || typeof step['content'] !== 'string'
          || !Array.isArray(step['focusRefs']) || step['focusRefs'].some(ref => typeof ref !== 'string')) throw new Error('Preview topology differs from its checked source.');
        const title = beat.querySelector('h2'), text = beat.querySelector('.kp-beat-copy > p');
        if (!title || !text) throw new Error('Preview passage is missing.');
        return { beat, title, text, name: step['title'], content: step['content'], refs: step['focusRefs'].join(' ') };
      });
      const intro = document.querySelector('.kp-caption-document-intro'), after = document.querySelector('.kp-caption-document-after');
      const story = document.querySelector<HTMLElement>('.kp-animation-story');
      if (!intro || !after || !story) throw new Error('Preview host is unavailable.');
      const storyIndex = notebook.cells.findIndex(cell => cell.type === 'story');
      const elements = notebook.cells.map(cell => {
        if (cell.type === 'mathObject' || cell.type === 'matrixObject') throw new Error('Use the mathematical notebook preview for mathematical objects.');
        return cell.type === 'story' ? null : prose(cell);
      });
      const beforeNodes = elements.slice(0, storyIndex).filter((el): el is HTMLElement => el !== null);
      input.replaceAnnotations(notes);
      intro.replaceChildren(...beforeNodes); after.replaceChildren(...elements.slice(storyIndex + 1).filter((el): el is HTMLElement => el !== null));
      story.dataset['notebookCell'] = notebook.cells[storyIndex]!.id;
      const storyCell = notebook.cells[storyIndex]; if (storyCell?.type === 'story') captionId = storyCell.caption.id;
      for (const edit of edits) {
        edit.title.textContent = edit.name; edit.text.textContent = edit.content; edit.beat.dataset['kpFocus'] = edit.refs;
        const link = [...document.querySelectorAll<HTMLAnchorElement>('.kp-lesson-toc a')].find(a => a.hash.slice(1) === edit.beat.id);
        if (link) link.textContent = edit.name;
        const option = [...moments.options].find(item => item.value === edit.beat.id); if (option) option.textContent = edit.name;
      }
      const titleLink = document.querySelector<HTMLAnchorElement>('.kp-lesson-toc a');
      if (titleLink) { titleLink.href = `#${notebook.cells[0]!.id}`; titleLink.textContent = beforeNodes[0]?.querySelector('h1,h2')?.textContent ?? 'Fraction notebook'; }
      input.refresh();
      document.body.dataset['notebookRevision'] = String(notebook.revision);
      send({ protocol: 'kp.fraction-notebook.v1', kind: 'applied', revision: notebook.revision });
    } catch (error) { send({ protocol: 'kp.fraction-notebook.v1', kind: 'error', message: String(error) }); }
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-notebook-cell]') : null;
    if (!target || (event.target instanceof Element && event.target.closest('a,button,input,select'))) return;
    send({ protocol: 'kp.fraction-notebook.v1', kind: 'select', id: target.dataset['notebookCell'] });
  };
  window.addEventListener('message', onMessage); document.addEventListener('click', onClick);
  send({ protocol: 'kp.fraction-notebook.v1', kind: 'ready' });
  return { dispose() { document.removeEventListener('pointerdown', resetShortcut, true); window.removeEventListener('blur', resetShortcut); window.removeEventListener('message', onMessage); document.removeEventListener('click', onClick); document.removeEventListener('pointerdown', focusWindow); document.removeEventListener('focusin', focusWindow); document.removeEventListener('keydown', cycleWindow, true); navigation?.removeEventListener('toggle', reportOptions); syncMoment.disconnect(); moments.remove(); } };
}
