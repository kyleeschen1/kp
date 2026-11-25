/** One iframe remains mounted. Its box follows the document's animation slot,
 * or fills the focused result/reading pane; layout never reparents the player. */
export function mountWorkspace(root: HTMLElement, workspace: HTMLElement, documentPane: HTMLElement, editor: HTMLElement, result: HTMLElement) {
  let pending = 0;
  const layout = () => {
    pending = 0;
    const editing = root.classList.contains('fn-editing'), focused = root.classList.contains('fn-focus');
    const box = workspace.getBoundingClientRect();
    if (!editing) {
      Object.assign(result.style, { left: '0px', top: '0px', width: '100%', height: '100%', visibility: 'visible' });
    } else if (focused) {
      const narrow = box.width <= 760;
      const percent = parseFloat(workspace.style.getPropertyValue('--notebook-width')) || 50;
      const left = narrow ? 0 : box.width * percent / 100 + 9;
      Object.assign(result.style, { left: `${left}px`, top: narrow ? '50%' : '0px', width: `${box.width - left}px`, height: narrow ? '50%' : '100%', visibility: 'visible' });
    } else {
      const slot = editor.querySelector('.fn-animation-slot')?.getBoundingClientRect();
      Object.assign(result.style, slot ? { left: `${slot.left - box.left}px`, top: `${slot.top - box.top}px`, width: `${slot.width}px`, height: `${slot.height}px`, visibility: 'visible' }
        : { visibility: 'hidden' });
    }
    documentPane.inert = !editing || focused;
  };
  const schedule = () => { if (!pending) pending = requestAnimationFrame(layout); };
  const observer = new ResizeObserver(schedule); observer.observe(workspace); observer.observe(editor.firstElementChild ?? editor);
  const mutation = new MutationObserver(schedule); mutation.observe(editor, { childList: true, subtree: true, attributes: true });
  editor.addEventListener('scroll', schedule, { passive: true });
  layout();
  return { refresh: layout, dispose() { cancelAnimationFrame(pending); observer.disconnect(); mutation.disconnect(); editor.removeEventListener('scroll', schedule); } };
}
