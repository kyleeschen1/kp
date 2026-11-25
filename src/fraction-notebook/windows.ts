import { mountWindowActivation } from './window-activation.ts';

type WindowId = 'page' | 'chat';
type WindowEntry = { element: HTMLElement; focus: () => void };

/** Host-only focus/stacking. Editors and the iframe keep their DOM, selections,
 * clocks and persistence; changing the front window never remounts content. */
export function mountWindows(host: HTMLElement) {
  const entries = new Map<WindowId, WindowEntry>();
  let order: WindowId[] = [];
  const preferenceKey = 'kp.workspace.active-window.v1';
  let saved: WindowId | undefined, initialized = false, active: WindowId = 'page';
  try { const value = sessionStorage.getItem(preferenceKey); if (value === 'page' || value === 'chat') saved = value; } catch { /* Optional presentation preference. */ }
  const visible = () => order.flatMap(id => {
    const entry = entries.get(id); return entry && !entry.element.hidden ? [[id, entry] as const] : [];
  });
  function arrange() {
    const windows = visible();
    host.style.setProperty('--kp-window-stack-depth', String(Math.max(0, windows.length - 1)));
    for (const [id, entry] of entries) entry.element.dataset['windowActive'] = String(id === active && !entry.element.hidden);
    windows.forEach(([_, entry], rank) => {
      entry.element.style.setProperty('--kp-window-rank', String(rank));
      entry.element.style.setProperty('--kp-window-position', String(windows.length === 1 ? .5 : rank / (windows.length - 1)));
      entry.element.style.setProperty('--kp-window-layer', String(windows.length - rank));
    });
  }
  function raise(id: WindowId, focus = false) {
    const target = entries.get(id); if (!target || target.element.hidden) return;
    active = id; host.dataset['activeWindow'] = id;
    order = [id, ...order.filter(key => key !== id)]; arrange();
    if (initialized) try { sessionStorage.setItem(preferenceKey, id); } catch { /* Focus still works without storage. */ }
    if (focus) target.focus();
  }
  function cycle(reverse = false) {
    activation.cancel();
    const windows = visible(), index = windows.findIndex(([id]) => id === active);
    const next = windows[(index + (reverse ? -1 : 1) + windows.length) % windows.length];
    if (next) raise(next[0], true);
  }
  const owner = (target: EventTarget | null) => target instanceof Element
    ? [...entries].find(([, entry]) => entry.element.contains(target)) : undefined;
  const activation = mountWindowActivation(host, (target, focus) => { const entry = owner(target); if (entry) raise(entry[0], focus); });
  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing || !event.ctrlKey || event.metaKey || event.altKey || event.code !== 'Backquote') return;
    if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
    event.preventDefault(); event.stopPropagation(); cycle(event.shiftKey);
  };
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
      entries.set(id, { element, focus }); order.push(id); arrange();
      return () => {
        entries.delete(id); order = order.filter(key => key !== id);
        element.classList.remove('kp-window'); delete element.dataset['kpWindow']; delete element.dataset['windowActive'];
        for (const key of ['rank', 'position', 'layer']) element.style.removeProperty(`--kp-window-${key}`);
        // Detaching during unload is not a user focus choice. Keep the saved
        // front window intact; an explicit close already calls raise().
        const next = visible()[0]; if (id === active && next) { active = next[0]; host.dataset['activeWindow'] = active; }
        arrange();
      };
    },
    dispose() { activation.dispose(); document.removeEventListener('keydown', onKey, true); entries.clear(); order = []; host.style.removeProperty('--kp-window-stack-depth'); }
  };
}
