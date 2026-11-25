import katex from 'katex';
import type { Node as ProseNode } from 'prosemirror-model';
import type { NodeView } from 'prosemirror-view';

function paint(dom: HTMLElement, source: string, displayMode: boolean) {
  try {
    katex.render(source, dom, { displayMode, throwOnError: true, trust: false, strict: 'ignore', maxExpand: 1000, maxSize: 20 });
    dom.removeAttribute('data-invalid');
  } catch {
    dom.textContent = source; dom.dataset['invalid'] = 'true'; dom.title = 'Math could not be rendered. Original TeX is retained.';
  }
}
export function mathView(initial: ProseNode): NodeView {
  let node = initial;
  const dom = document.createElement(node.type.name === 'math_block' ? 'div' : 'span'); dom.className = 'kp-chat-math';
  dom.setAttribute('contenteditable', 'false');
  paint(dom, String(node.attrs['source']), node.type.name === 'math_block');
  return { dom, update(next) {
    if (next.type !== node.type) return false;
    if (next.attrs['source'] !== node.attrs['source']) paint(dom, String(next.attrs['source']), next.type.name === 'math_block');
    node = next; return true;
  }, ignoreMutation: mutation => mutation.type !== 'selection' };
}
export function renderNoteMath(host: HTMLElement) {
  for (const dom of host.querySelectorAll<HTMLElement>('[data-chat-math]')) paint(dom, dom.dataset['chatMath'] ?? '', dom.dataset['display'] === 'true');
}
