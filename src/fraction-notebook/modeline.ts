import type { mountWindows, WindowId } from './windows.ts';
import type { CommandRegistry } from '../editor-commands/registry.ts';

interface Surface { mode: string; name: string; description: string }
const modes: Record<string, readonly [string, string]> = { normal: ['N', 'Normal'], insert: ['I', 'Insert'], visual: ['V', 'Visual'] };

/** Observe the focused editor's own mode. Streaming into a different editor
 * must never turn the modeline into a report about that background surface. */
export function mountModeline(root: HTMLElement, windows: ReturnType<typeof mountWindows>, registry: CommandRegistry) {
  const bar = document.createElement('footer'); bar.className = 'kp-modeline'; bar.setAttribute('aria-label', 'Workspace modeline');
  const mode = document.createElement('span'); mode.className = 'kp-modeline-mode';
  const surface = document.createElement('span'); surface.className = 'kp-modeline-surface';
  const navigation = document.createElement('nav'); navigation.setAttribute('aria-label', 'Workspace panes');
  const clock = document.createElement('time'); clock.className = 'kp-modeline-time';
  const buttons = new Map<WindowId, HTMLButtonElement>();
  for (const [id, label] of [['chat', 'Chat'], ['page', 'KP']] as const) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-label', `Focus ${label} pane`); button.title = 'Switch pane · Ctrl-`';
    button.dataset['commandId'] = `workspace.focus-${id}`;
    button.onclick = () => { void registry.invoke(`workspace.focus-${id}`); }; navigation.append(button); buttons.set(id, button);
  }
  bar.append(mode, surface, navigation, clock); root.append(bar);
  const remembered = new Map<WindowId, Surface>();
  let pending = 0, timer: ReturnType<typeof setTimeout> | undefined, disposed = false;
  function describe(target: Element, id: WindowId): Surface {
    const name = id === 'chat' ? 'Chat' : 'KP';
    if (target.matches('iframe')) return { mode: 'R', name: `${name} › ${root.classList.contains('fn-editing') ? 'animation' : 'reading'}`, description: 'Reading' };
    if (target.closest('.fn-command-bar, .kp-rich-command')) return { mode: 'C', name: `${name} › command`, description: 'Command' };
    if (target.matches('input, textarea, select')) return { mode: 'I', name: `${name} › ${target.getAttribute('aria-label') ?? 'input'}`, description: 'Text input' };
    const editor = target.closest<HTMLElement>('[data-vim-mode]');
    if (editor) {
      const rich = target.closest<HTMLElement>('.kp-rich');
      const label = rich?.classList.contains('kp-rich-transcript') ? 'transcript'
        : rich?.classList.contains('kp-rich-composer') ? 'draft'
        : rich?.classList.contains('kp-rich-comment') ? 'note'
        : target.closest('.fn-code') ? 'animation source' : 'document';
      const [letter, description] = modes[editor.dataset['vimMode'] ?? ''] ?? ['—', 'Editor'];
      return { mode: letter, description, name: `${name} › ${label}${rich && target.closest('.cm-editor') ? ' source' : ''}` };
    }
    return { mode: '—', name: `${name} › controls`, description: 'Controls' };
  }
  function render() {
    pending = 0;
    const snapshot = windows.snapshot(), active = snapshot.windows.find(entry => entry.id === snapshot.active);
    if (!active) return;
    const target = document.activeElement;
    if (target && active.element.contains(target)) remembered.set(active.id, describe(target, active.id));
    // A modal borrows input focus without replacing the pane's return surface.
    const transient = target?.closest<HTMLElement>('dialog[open] [data-editor-surface][data-vim-mode]');
    const [transientMode, description] = modes[transient?.dataset['vimMode'] ?? ''] ?? ['—', 'Editor'];
    const current = transient ? { mode: transientMode, description, name: transient.dataset['editorSurface']! }
      : remembered.get(active.id) ?? { mode: '—', name: active.id === 'page' ? 'KP' : 'Chat', description: 'Pane' };
    mode.textContent = `[${current.mode}]`; mode.setAttribute('aria-label', `${current.description} · ${current.name}`);
    surface.textContent = root.dataset['commandPrefix'] ? `${root.dataset['commandPrefix']} · ${current.name}` : current.name; bar.title = `${current.description} · ${current.name}`;
    for (const [id, button] of buttons) {
      button.hidden = !snapshot.windows.some(entry => entry.id === id);
      button.setAttribute('aria-pressed', String(id === snapshot.active));
    }
  }
  const schedule = () => { if (!pending && !disposed) pending = requestAnimationFrame(render); };
  // Mode attributes are an editor-owned projection, not another Vim state.
  const observer = new MutationObserver(schedule);
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-vim-mode', 'data-command-prefix'] });
  const unsubscribe = windows.subscribe(schedule);
  document.addEventListener('focusin', schedule);
  const format = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function tick() {
    clearTimeout(timer);
    const now = new Date(), parts = new Map(format.formatToParts(now).map(part => [part.type, part.value]));
    clock.dateTime = now.toISOString(); clock.textContent = `${parts.get('weekday')}, ${parts.get('month')} ${parts.get('day')} ${parts.get('hour')}:${parts.get('minute')}`;
    clock.title = `${Intl.DateTimeFormat().resolvedOptions().timeZone} · local time`;
    timer = setTimeout(tick, 60000 - now.getTime() % 60000);
  }
  document.addEventListener('visibilitychange', tick); render(); tick();
  return { dispose() {
    disposed = true; cancelAnimationFrame(pending); clearTimeout(timer); observer.disconnect(); unsubscribe();
    document.removeEventListener('focusin', schedule); document.removeEventListener('visibilitychange', tick); bar.remove();
  } };
}
