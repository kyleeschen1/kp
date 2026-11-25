import { Selection, TextSelection } from 'prosemirror-state';
import type { RichSurface } from './rich-text.ts';
import type { ReadingPoint } from './protocol.ts';
import { textIndex } from './rich-document.ts';

export type ReadingBookmark = {
  anchor: ReadingPoint | null; head: ReadingPoint | null;
  scroll: { messageId: string | null; top: number; scrollTop: number };
};
export function transcriptNavigation(surface: RichSurface, host: HTMLElement, branchId: () => string | undefined, onNavigate: () => void) {
  function offsets() {
    const result: { id: string; start: number; size: number }[] = [];
    surface.view.state.doc.forEach((node, pos) => { if (node.type.name === 'chat_message') result.push({ id: String(node.attrs['id']), start: pos + 1, size: node.content.size }); });
    return result;
  }
  function pointAt(pos: number): ReadingPoint | null {
    const id = branchId(); if (!id) return null;
    const values = offsets(), message = values.find(value => pos >= value.start && pos <= value.start + value.size) ?? values[0];
    return message ? { branchId: id, messageId: message.id, offset: Math.max(0, Math.min(message.size, pos - message.start)) } : null;
  }
  function position(point: ReadingPoint | null) {
    if (!point || point.branchId !== branchId()) return null;
    const message = offsets().find(value => value.id === point.messageId);
    return message ? message.start + Math.min(message.size, point.offset) : null;
  }
  function capture(): ReadingBookmark {
    const top = host.getBoundingClientRect().top;
    const node = [...host.querySelectorAll<HTMLElement>('[data-message-id]')].find(node => node.getBoundingClientRect().bottom > top + 1);
    return { anchor: pointAt(surface.view.state.selection.anchor), head: pointAt(surface.view.state.selection.head),
      scroll: { messageId: node?.dataset['messageId'] ?? null, top: node ? node.getBoundingClientRect().top - top : 0, scrollTop: host.scrollTop } };
  }
  function restoreScroll(scroll: ReadingBookmark['scroll']) {
    const node = [...host.querySelectorAll<HTMLElement>('[data-message-id]')].find(node => node.dataset['messageId'] === scroll.messageId);
    if (node) host.scrollTop += node.getBoundingClientRect().top - host.getBoundingClientRect().top - scroll.top;
    else host.scrollTop = scroll.scrollTop;
  }
  function restore(bookmark: ReadingBookmark, focus = true) {
    const anchor = position(bookmark.anchor), head = position(bookmark.head), { view } = surface;
    if (anchor !== null && head !== null) view.dispatch(view.state.tr.setSelection(TextSelection.between(view.state.doc.resolve(anchor), view.state.doc.resolve(head))));
    if (focus) surface.focus(); restoreScroll(bookmark.scroll);
    return anchor !== null && head !== null;
  }
  function jump(point: ReadingPoint) {
    const pos = position(point); if (pos === null) return false;
    const { view } = surface;
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(pos))).scrollIntoView()); surface.focus(); return true;
  }
  function message(direction: -1 | 1) {
    const values = offsets(), current = pointAt(surface.view.state.selection.head), index = values.findIndex(value => value.id === current?.messageId);
    const target = values[Math.max(0, Math.min(values.length - 1, index + direction))];
    if (target && branchId()) jump({ branchId: branchId()!, messageId: target.id, offset: 1 });
  }
  function search(query: string, direction: -1 | 1 = 1) {
    const index = textIndex(surface.view.state.doc), haystack = index.text.toLocaleLowerCase(), needle = query.toLocaleLowerCase();
    const matches: { from: number; to: number }[] = [];
    if (needle) for (let from = haystack.indexOf(needle); from >= 0 && matches.length < 1000; from = haystack.indexOf(needle, from + Math.max(1, needle.length))) {
      const start = index.positions[from], end = index.positions[from + needle.length - 1];
      if (start !== undefined && end !== undefined) matches.push({ from: start, to: end + 1 });
    }
    const head = surface.view.state.selection.head;
    const target = direction === 1 ? matches.find(match => match.from > head) ?? matches[0]
      : [...matches].reverse().find(match => match.to < head) ?? matches.at(-1);
    if (target) surface.view.dispatch(surface.view.state.tr.setSelection(TextSelection.create(surface.view.state.doc, target.from, target.to)).scrollIntoView());
    return matches.length;
  }
  function paragraph(direction: -1 | 1) {
    const { view } = surface, positions: number[] = [];
    view.state.doc.descendants((node, pos) => { if (node.isTextblock) positions.push(pos + 1); });
    const head = view.state.selection.head;
    const next = direction === 1 ? positions.find(pos => pos > head) ?? positions.at(-1) : [...positions].reverse().find(pos => pos < head) ?? positions[0];
    if (next !== undefined) view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(next))).scrollIntoView());
  }
  function page(direction: -1 | 1) {
    host.scrollTop += direction * host.clientHeight / 2;
    const rect = host.getBoundingClientRect(), pos = surface.view.posAtCoords({ left: rect.left + rect.width / 2, top: rect.top + rect.height / 2 });
    if (pos) surface.view.dispatch(surface.view.state.tr.setSelection(Selection.near(surface.view.state.doc.resolve(pos.pos))));
    onNavigate();
  }
  function latest() {
    const { view } = surface; view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)).scrollIntoView()); surface.focus(); host.scrollTop = host.scrollHeight;
  }
  return { capture, restore, restoreScroll, jump, message, paragraph, page, latest, search, point: () => pointAt(surface.view.state.selection.head) };
}
