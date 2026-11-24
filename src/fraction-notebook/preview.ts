import { readNotebook, object, type Cell, type Inline } from './model.ts';
import { readEndpointCommentary } from '../reader/document/public-api.ts';

/** Mounted only by the development preview host. Apply checked editorial data
 * without replacing the native equation, clock, story or passage containers. */
export function mountFractionNotebookPreview(input: {
  replaceAnnotations: (value: unknown) => void; refresh: () => void;
}) {
  let selected: string | undefined;
  let captionId: string | undefined;
  const send = (data: unknown) => window.parent.postMessage(data, window.location.origin);
  const append = (el: HTMLElement, content: readonly Inline[]) => {
    for (const inline of content) {
      let node: Node = document.createTextNode(inline.type === 'text' ? inline.text : inline.source);
      if (inline.type === 'text') for (const mark of inline.marks) { const wrapper = document.createElement(mark); wrapper.append(node); node = wrapper; }
      el.append(node);
    }
  };
  const prose = (cell: Exclude<Cell, { type: 'story' }>): HTMLElement => {
    const el = document.createElement(cell.type === 'articleHeader' ? 'header' : 'p');
    el.dataset['notebookCell'] = cell.id; el.id = cell.id;
    if (cell.type === 'articleHeader') {
      const title = document.createElement('h1'); title.id = cell.title.id; title.dataset['notebookCell'] = cell.title.id;
      append(title, cell.title.content); el.append(title);
      for (const author of cell.authors) {
        const credit = document.createElement('p'); credit.className = 'kp-document-byline'; credit.id = author.id; credit.dataset['notebookCell'] = author.id;
        credit.textContent = `${author.role === 'author' ? 'By' : author.role === 'editor' ? 'Edited by' : 'Translated by'} ${author.name}`;
        el.append(credit);
      }
    } else append(el, cell.content);
    return el;
  };
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    try {
      const message = object(event.data);
      if (message['protocol'] !== 'kp.fraction-notebook.v1') return;
      if (message['kind'] === 'reveal' && typeof message['id'] === 'string') {
        selected = message['id'];
        const target = [...document.querySelectorAll<HTMLElement>('[data-notebook-cell]')].find(el => el.dataset['notebookCell'] === selected);
        if (target?.classList.contains('kp-animation-story') || selected === captionId) {
          // Story wrappers use display:contents. Navigate through the reader's
          // own passage control so its semantic playhead follows the reveal.
          const first = document.querySelector<HTMLElement>('.kp-animation-story [data-kp-beat]');
          [...document.querySelectorAll<HTMLAnchorElement>('.kp-lesson-toc a')].find(link => link.hash.slice(1) === first?.id)?.click();
        } else target?.scrollIntoView({ block: 'center', behavior: 'instant' });
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
      const elements = notebook.cells.map(cell => cell.type === 'story' ? null : prose(cell));
      const beforeNodes = elements.slice(0, storyIndex).filter((el): el is HTMLElement => el !== null);
      input.replaceAnnotations(notes);
      intro.replaceChildren(...beforeNodes); after.replaceChildren(...elements.slice(storyIndex + 1).filter((el): el is HTMLElement => el !== null));
      story.dataset['notebookCell'] = notebook.cells[storyIndex]!.id;
      const storyCell = notebook.cells[storyIndex]; if (storyCell?.type === 'story') captionId = storyCell.caption.id;
      for (const edit of edits) {
        edit.title.textContent = edit.name; edit.text.textContent = edit.content; edit.beat.dataset['kpFocus'] = edit.refs;
        const link = [...document.querySelectorAll<HTMLAnchorElement>('.kp-lesson-toc a')].find(a => a.hash.slice(1) === edit.beat.id);
        if (link) link.textContent = edit.name;
      }
      const titleLink = document.querySelector<HTMLAnchorElement>('.kp-lesson-toc a');
      if (titleLink) { titleLink.href = `#${notebook.cells[0]!.id}`; titleLink.textContent = beforeNodes[0]!.querySelector('h1')?.textContent ?? ''; }
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
  return { dispose() { window.removeEventListener('message', onMessage); document.removeEventListener('click', onClick); } };
}
