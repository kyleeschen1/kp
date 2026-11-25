export type WindowId = 'page' | 'chat';
type WindowEntry = { element: HTMLElement; focus: () => void };

/** Focus-only host. CSS owns fixed pane positions; switching keyboard targets
 * preserves the editors, selections, native player and saved conversation. */
export function mountWindows(host: HTMLElement) {
  const entries = new Map<WindowId, WindowEntry>();
  const listeners = new Set<() => void>();
  const preferenceKey = 'kp.workspace.active-window.v1';
  let saved: WindowId | undefined, initialized = false, active: WindowId = 'page';
  try { const value = sessionStorage.getItem(preferenceKey); if (value === 'page' || value === 'chat') saved = value; } catch { /* Optional presentation preference. */ }
  const visible = () => [...entries].filter(([, entry]) => !entry.element.hidden);
  function reflectFocus() {
    host.dataset['activeWindow'] = active;
    for (const [id, entry] of entries) entry.element.dataset['windowActive'] = String(id === active && !entry.element.hidden);
    for (const listener of listeners) listener();
  }
  function activate(id: WindowId, focus = false) {
    const target = entries.get(id); if (!target || target.element.hidden) return;
    active = id; reflectFocus();
    if (initialized) try { sessionStorage.setItem(preferenceKey, id); } catch { /* Focus still works without storage. */ }
    if (focus) target.focus();
  }
  function cycle(reverse = false) {
    const windows = visible(), index = windows.findIndex(([id]) => id === active);
    const next = windows[(index + (reverse ? -1 : 1) + windows.length) % windows.length];
    if (next) activate(next[0], true);
  }
  const owner = (target: EventTarget | null) => target instanceof Element
    ? [...entries].find(([, entry]) => entry.element.contains(target)) : undefined;
  const onFocus = (event: FocusEvent) => { const entry = owner(event.target); if (entry) activate(entry[0]); };
  const onPointer = (event: PointerEvent) => {
    const entry = owner(event.target); if (!entry) return;
    const interactive = event.target instanceof Element && event.target.closest('button,a,input,textarea,select,summary,[contenteditable],[tabindex]');
    activate(entry[0], !interactive);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing || !event.ctrlKey || event.metaKey || event.altKey || event.code !== 'Backquote') return;
    if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
    event.preventDefault(); event.stopPropagation(); cycle(event.shiftKey);
  };
  host.addEventListener('focusin', onFocus); host.addEventListener('pointerdown', onPointer);
  document.addEventListener('keydown', onKey, true);
  return {
    activate, cycle,
    snapshot: () => ({ active, windows: visible().map(([id, entry]) => ({ id, element: entry.element })) }),
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    active: (id: WindowId) => active === id && entries.has(id) && !entries.get(id)?.element.hidden,
    restore() {
      // Mounting the document and chat can focus each in turn. Restore only
      // after both exist, without overwriting the user's last window meanwhile.
      initialized = true;
      const windows = visible();
      activate(windows.find(([id]) => id === saved)?.[0] ?? windows.find(([id]) => id === 'chat')?.[0] ?? 'page', true);
    },
    register(id: WindowId, element: HTMLElement, focus: () => void) {
      if (entries.has(id)) throw new Error('A workspace window already owns this identity.');
      element.classList.add('kp-window'); element.dataset['kpWindow'] = id;
      entries.set(id, { element, focus }); reflectFocus();
      return () => {
        entries.delete(id);
        element.classList.remove('kp-window'); delete element.dataset['kpWindow']; delete element.dataset['windowActive'];
        // Detaching during unload is not a user focus choice. Keep the saved
        // pane intact; an explicit close already calls activate().
        const next = visible()[0]; if (id === active && next) active = next[0];
        reflectFocus();
      };
    },
    dispose() { host.removeEventListener('focusin', onFocus); host.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey, true); entries.clear(); listeners.clear(); }
  };
}
