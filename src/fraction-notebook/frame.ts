/** One real modeline stays above native dialogs without replacing their focus
 * trap. Its spacer owns layout; the top-layer frame owns paint. During a modal
 * the frame belongs to that dialog and its controls remain inert, as before. */
export function mountWorkspaceFrame(root: HTMLElement, bar: HTMLElement) {
  const frame = document.createElement('div'); frame.className = 'kp-workspace-frame'; frame.popover = 'manual';
  const space = document.createElement('div'); space.className = 'kp-modeline-space'; space.setAttribute('aria-hidden', 'true');
  root.insertBefore(space, bar); root.append(frame); frame.append(bar);
  let disposed = false;
  function synchronize() {
    if (disposed) return;
    const dialogs = Array.from(root.querySelectorAll<HTMLDialogElement>('dialog[open]'));
    const modal = dialogs.reverse().find(dialog => dialog.matches(':modal'));
    const parent = modal ?? root;
    bar.inert = Boolean(modal);
    // Moving an open popover can remove it from the top layer. Close explicitly
    // before reparenting and reopen after the modal so paint order is definite.
    if (frame.parentElement !== parent || !frame.matches(':popover-open')) {
      if (frame.matches(':popover-open')) frame.hidePopover();
      parent.append(frame); frame.showPopover();
    }
  }
  function measure() {
    const height = bar.getBoundingClientRect().height;
    space.style.height = `${height}px`;
    root.style.setProperty('--kp-modeline-height', `${height}px`);
  }
  const observer = new MutationObserver(synchronize);
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['open'] });
  const resize = new ResizeObserver(measure); resize.observe(bar);
  synchronize(); measure();
  return { dispose() {
    disposed = true; observer.disconnect(); resize.disconnect();
    if (frame.matches(':popover-open')) frame.hidePopover();
    bar.inert = false; root.insertBefore(bar, space); frame.remove(); space.remove();
    root.style.removeProperty('--kp-modeline-height');
  } };
}
