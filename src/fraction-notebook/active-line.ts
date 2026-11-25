import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

/** Selection stays in ProseMirror. Only the selected text block gets a
 * decoration; measured visual-line geometry is transient view-root CSS. */
export function activeLine() {
  return new Plugin({
    props: { decorations(state) {
      const { $head } = state.selection;
      if (!$head.depth || !$head.parent.isTextblock) return null;
      return DecorationSet.create(state.doc, [Decoration.node($head.before(), $head.after(), { class: 'kp-active-textblock' })]);
    } },
    view(view) {
      const document = view.dom.ownerDocument;
      let pending = 0, visible = false, disposed = false, observed: HTMLElement | undefined;
      const set = (name: string, value: string) => { if (view.dom.style.getPropertyValue(name) !== value) view.dom.style.setProperty(name, value); };
      function hide() {
        visible = false;
        view.dom.removeAttribute('data-kp-line-visible');
        if (observed) resize.unobserve(observed);
        observed = undefined;
      }
      function paint() {
        pending = 0;
        const { $head, head } = view.state.selection;
        if (disposed || !view.dom.isConnected || !view.hasFocus() || !$head.depth || !$head.parent.isTextblock) { hide(); return; }
        const block = view.nodeDOM($head.before());
        if (!(block instanceof HTMLElement) || !block.getClientRects().length) { hide(); return; }
        const rect = block.getBoundingClientRect();
        let caret = view.coordsAtPos(head);
        // At a soft wrap the same document position can sit on either line.
        // Insert/Visual follow the native range head only after it agrees with
        // editor state. Normal follows the next glyph, like its block cursor.
        const native = document.getSelection();
        if (view.dom.dataset['vimMode'] !== 'normal' && native?.focusNode && block.contains(native.focusNode)
          && view.posAtDOM(native.focusNode, native.focusOffset) === head) {
          const range = document.createRange(); range.setStart(native.focusNode, native.focusOffset); range.collapse(true);
          const bounds = range.getBoundingClientRect();
          if (bounds.height > 0) caret = bounds;
        }
        const leading = Number.parseFloat(getComputedStyle(block).lineHeight);
        const height = Math.min(rect.height, Math.max(caret.bottom - caret.top, Number.isFinite(leading) ? leading : 0));
        const top = Math.max(0, Math.min(rect.height - height, (caret.top + caret.bottom - height) / 2 - rect.top + block.scrollTop));
        if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0) { hide(); return; }
        if (observed !== block) { if (observed) resize.unobserve(observed); observed = block; resize.observe(block); }
        set('--kp-active-line-y', `${top.toFixed(2)}px`); set('--kp-active-line-height', `${height.toFixed(2)}px`);
        if (!visible) view.dom.setAttribute('data-kp-line-visible', 'true');
        visible = true;
      }
      function schedule() {
        if (!disposed && !pending && (visible || view.hasFocus())) pending = requestAnimationFrame(paint);
      }
      // Observe the selected block as well as the root: changing a heading font
      // or wrapping a short paragraph need not change the editor's outer size.
      const resize = new ResizeObserver(schedule); resize.observe(view.dom);
      view.dom.addEventListener('focus', schedule, true); view.dom.addEventListener('blur', schedule, true);
      document.addEventListener('scroll', schedule, true); document.addEventListener('selectionchange', schedule);
      document.fonts.addEventListener('loadingdone', schedule);
      window.addEventListener('resize', schedule); schedule();
      return { update: schedule, destroy() {
        disposed = true; cancelAnimationFrame(pending); resize.disconnect(); hide();
        view.dom.style.removeProperty('--kp-active-line-y'); view.dom.style.removeProperty('--kp-active-line-height');
        view.dom.removeEventListener('focus', schedule, true); view.dom.removeEventListener('blur', schedule, true);
        document.removeEventListener('scroll', schedule, true); document.removeEventListener('selectionchange', schedule);
        document.fonts.removeEventListener('loadingdone', schedule);
        window.removeEventListener('resize', schedule);
      } };
    }
  });
}
