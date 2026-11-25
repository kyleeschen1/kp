import type { EditorView } from 'prosemirror-view';
import type { Command } from 'prosemirror-state';
import { addBlock, titleBlock, removeEmptyTitle, nestBlock, outdentBlock, moveBlock, mergeNext, selectedBlock, changeBlock, toggleFold } from './structure.ts';
import { setVimMode } from './vim.ts';

export function mountStructureControls(parent: HTMLElement, view: EditorView, report: (message: string) => void) {
  const details = document.createElement('details'); details.className = 'fn-structure';
  const summary = document.createElement('summary'); summary.textContent = 'Structure'; details.append(summary);
  const panel = document.createElement('div'); panel.className = 'fn-structure-controls'; details.append(panel);
  const buttons: { element: HTMLButtonElement; command: Command }[] = [];
  for (const [label, command, insert] of [
    ['Add block', addBlock, true], ['Add title', titleBlock, true], ['Remove empty title', removeEmptyTitle, false],
    ['Nest', nestBlock, false], ['Outdent', outdentBlock, false], ['Move up', moveBlock(-1), false],
    ['Move down', moveBlock(1), false], ['Merge next', mergeNext, false], ['Fold children', toggleFold, false]
  ] as const) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.onmousedown = event => event.preventDefault();
    button.onclick = () => {
      if (!command(view.state, view.dispatch, view)) report('Select a compatible content block. Merge keeps the first identity and requires an untitled next block without metadata.');
      else if (insert) setVimMode('insert')(view.state, view.dispatch);
      view.focus(); refresh();
    }; panel.append(button); buttons.push({ element: button, command });
  }
  const select = <T extends string>(label: string, values: readonly T[], update: (value: T) => Command) => {
    const wrapper = document.createElement('label'); wrapper.textContent = `${label} `;
    const picker = document.createElement('select'); picker.setAttribute('aria-label', label);
    for (const value of values) { const option = document.createElement('option'); option.value = value; option.textContent = value; picker.append(option); }
    picker.onchange = () => { const value = values.find(value => value === picker.value); if (value !== undefined) update(value)(view.state, view.dispatch, view); view.focus(); }; wrapper.append(picker); panel.append(wrapper); return picker;
  };
  const kind = select('Block type', ['paragraph', 'note'] as const, kind => changeBlock({ kind }));
  const layout = select('Children display', ['flow', 'bullets', 'numbered', 'outline'] as const, layout => changeBlock({ layout }));
  const location = document.createElement('span'); location.className = 'fn-structure-location'; panel.append(location);
  const refresh = () => {
    const selected = selectedBlock(view.state); kind.disabled = layout.disabled = !selected;
    if (selected) { kind.value = selected.node.attrs['kind']; layout.value = selected.node.attrs['layout']; }
    // Availability is computed without dispatch, so inspecting a command cannot mutate content.
    for (const { element, command } of buttons) element.disabled = !command(view.state);
    const names: string[] = [];
    for (let depth = 1; depth <= view.state.selection.$from.depth; depth++) {
      const node = view.state.selection.$from.node(depth);
      if (node.type.name === 'block') names.push(node.firstChild?.type.name === 'blockTitle' ? node.firstChild.textContent || 'Untitled' : node.attrs['kind']);
    }
    location.textContent = names.length ? names.join(' › ') : 'Select a content block';
  };
  parent.append(details); refresh(); return { refresh };
}
