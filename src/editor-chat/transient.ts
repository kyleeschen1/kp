export interface ChatCommand {
  key: string; label: string; run: () => void;
  unavailable?: string | undefined; close?: boolean;
}

/** The native dialog owns keyboard/focus while open. Commands are shared by
 * pointer and keyboard invocation; opening it never changes the saved selection. */
export function mountTransient(host: HTMLElement, restore: () => void) {
  const dialog = document.createElement('dialog'); dialog.className = 'kp-chat-transient';
  dialog.setAttribute('aria-label', 'Chat commands');
  const heading = document.createElement('div'); heading.className = 'kp-transient-heading';
  const title = document.createElement('strong'), close = document.createElement('button');
  close.type = 'button'; close.textContent = 'Esc'; close.setAttribute('aria-label', 'Close commands');
  const content = document.createElement('div'), choices = document.createElement('div'); choices.className = 'kp-transient-choices';
  heading.append(title, close); dialog.append(heading, content, choices); host.append(dialog);
  let commands: readonly ChatCommand[] = [], disposeBody: (() => void) | undefined;
  let page = 'commands', epoch = 0;
  const position = () => {
    const rect = host.getBoundingClientRect();
    dialog.style.left = `${Math.max(8, rect.left + 12)}px`;
    dialog.style.width = `${Math.min(rect.width - 24, innerWidth - 16)}px`;
    dialog.style.bottom = `${Math.max(8, innerHeight - rect.bottom + 12)}px`;
  };
  const resize = new ResizeObserver(position); resize.observe(host);
  function hide(returnFocus = true) {
    if (!dialog.open) return;
    epoch++;
    dialog.close();
    disposeBody?.(); disposeBody = undefined;
    if (returnFocus) restore();
  }
  function invoke(command: ChatCommand) {
    if (command.unavailable) return;
    if (command.close) hide(false);
    command.run();
  }
  function render(values: readonly ChatCommand[]) {
    commands = values;
    const focused = dialog.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset['commandKey'] : undefined;
    choices.replaceChildren();
    for (const command of commands) {
      const button = document.createElement('button'), key = document.createElement('kbd'), label = document.createElement('span');
      button.type = 'button'; button.dataset['commandKey'] = command.key; button.setAttribute('aria-label', command.label);
      button.disabled = Boolean(command.unavailable); button.title = command.unavailable ?? '';
      key.textContent = command.key === 'Backspace' ? '⌫' : command.key; label.textContent = command.label; button.append(key, label);
      if (command.unavailable) { const reason = document.createElement('small'); reason.textContent = command.unavailable; button.append(reason); }
      button.onclick = () => invoke(command); choices.append(button);
      if (focused === command.key && !button.disabled) button.focus({ preventScroll: true });
    }
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); hide(); });
  dialog.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape' || (event.ctrlKey && event.key.toLowerCase() === 'c')) { event.preventDefault(); event.stopPropagation(); hide(); return; }
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, [contenteditable=true]') || event.metaKey || event.ctrlKey || event.altKey) return;
    const command = commands.find(command => command.key === event.key);
    if (command) { event.preventDefault(); event.stopPropagation(); invoke(command); }
    else if (event.key.length === 1) { event.preventDefault(); event.stopPropagation(); }
  });
  close.onclick = () => hide();
  return {
    dialog, content, isOpen: () => dialog.open, page: () => page, epoch: () => epoch, hide,
    show(name: string, values: readonly ChatCommand[], body?: HTMLElement, cleanup?: () => void) {
      epoch++; disposeBody?.(); disposeBody = cleanup; page = name; title.textContent = name;
      content.replaceChildren(...(body ? [body] : [])); render(values); position();
      if (!dialog.open) dialog.showModal();
      // Native dialog focus is explicit, so a disabled first command cannot
      // leave a hidden editor receiving the next key.
      (choices.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? close).focus({ preventScroll: true });
    },
    update(values: readonly ChatCommand[]) { if (dialog.open && page === 'Commands') render(values); },
    dispose() { if (dialog.open) dialog.close(); disposeBody?.(); resize.disconnect(); dialog.remove(); }
  };
}
