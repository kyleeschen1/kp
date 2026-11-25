type WindowId = 'page' | 'chat';
type WindowEntry = { element: HTMLElement; focus: () => void };

/** Host-only focus/stacking. Editors and the iframe keep their DOM, selections,
 * clocks and persistence; changing the front window never remounts content. */
export function mountWindows(host: HTMLElement) {
  const entries = new Map<WindowId, WindowEntry>();
  const preferenceKey = 'kp.workspace.active-window.v1';
  let saved: WindowId | undefined, initialized = false, active: WindowId = 'page';
  try { const value = sessionStorage.getItem(preferenceKey); if (value === 'page' || value === 'chat') saved = value; } catch { /* Optional presentation preference. */ }
  const visible = () => [...entries].filter(([, entry]) => !entry.element.hidden);
  function raise(id: WindowId, focus = false) {
    const target = entries.get(id); if (!target || target.element.hidden) return;
    active = id; host.dataset['activeWindow'] = id;
    for (const [key, entry] of entries) entry.element.dataset['windowActive'] = String(key === id);
    if (initialized) try { sessionStorage.setItem(preferenceKey, id); } catch { /* Focus still works without storage. */ }
    if (focus) target.focus();
  }
  function cycle(reverse = false) {
    const windows = visible(), index = windows.findIndex(([id]) => id === active);
    const next = windows[(index + (reverse ? -1 : 1) + windows.length) % windows.length];
    if (next) raise(next[0], true);
  }
  const owner = (target: EventTarget | null) => target instanceof Element
    ? [...entries].find(([, entry]) => entry.element.contains(target)) : undefined;
  const onFocus = (event: FocusEvent) => { const entry = owner(event.target); if (entry) raise(entry[0]); };
  const onPointer = (event: PointerEvent) => {
    const entry = owner(event.target); if (!entry) return;
    // An exposed background edge is also a pointer route to a covered window.
    const interactive = event.target instanceof Element && event.target.closest('button,a,input,textarea,select,summary,[contenteditable],[tabindex]');
    raise(entry[0], !interactive);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing || !event.ctrlKey || event.metaKey || event.altKey || event.code !== 'Backquote') return;
    if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
    event.preventDefault(); event.stopPropagation(); cycle(event.shiftKey);
  };
  host.addEventListener('focusin', onFocus); host.addEventListener('pointerdown', onPointer);
  document.addEventListener('keydown', onKey, true);
  return {
    raise, cycle,
    active: (id: WindowId) => active === id && entries.has(id) && !entries.get(id)?.element.hidden,
    restore() {
      // Mounting the document and chat can focus each in turn. Restore only
      // after both exist, without overwriting the user's last window meanwhile.
      initialized = true;
      const windows = visible();
      raise(windows.find(([id]) => id === saved)?.[0] ?? windows.find(([id]) => id === 'chat')?.[0] ?? 'page', true);
    },
    register(id: WindowId, element: HTMLElement, focus: () => void) {
      if (entries.has(id)) throw new Error('A workspace window already owns this identity.');
      element.classList.add('kp-window'); element.dataset['kpWindow'] = id;
      entries.set(id, { element, focus }); raise(active);
      return () => { entries.delete(id); element.classList.remove('kp-window'); delete element.dataset['kpWindow']; };
    },
    dispose() { host.removeEventListener('focusin', onFocus); host.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey, true); entries.clear(); }
  };
}
