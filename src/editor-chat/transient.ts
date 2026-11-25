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
  let page = 'commands', epoch = 0, frame = 0;
  const position = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(0, Math.min(rect.width - 24, innerWidth - 16));
    dialog.style.left = `${Math.max(8, Math.min(rect.left + 12, innerWidth - width - 8))}px`;
    dialog.style.width = `${width}px`;
    dialog.style.bottom = `${Math.max(8, innerHeight - rect.bottom + 12)}px`;
  };
  const ancestors: Element[] = [];
  for (let node: Element | null = host; node; node = node.parentElement) ancestors.push(node);
  const follow = () => {
    cancelAnimationFrame(frame); frame = 0;
    if (!dialog.open) return;
    position();
    // ResizeObserver does not see translation. Follow an animating ancestor
    // only while it moves, including a reversal after the popup has opened.
    if (ancestors.some(node => node.getAnimations().some(animation => animation.playState === 'running'))) frame = requestAnimationFrame(follow);
  };
  const motion = (event: TransitionEvent) => { if (event.target instanceof Element && ancestors.includes(event.target)) follow(); };
  document.addEventListener('transitionrun', motion); document.addEventListener('transitionend', motion); document.addEventListener('transitioncancel', motion);
  window.addEventListener('resize', follow);
  const resize = new ResizeObserver(position); resize.observe(host);
  function hide(returnFocus = true) {
    if (!dialog.open) return;
    epoch++;
    cancelAnimationFrame(frame); frame = 0;
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
      follow();
    },
    update(values: readonly ChatCommand[]) { if (dialog.open && page === 'Commands') render(values); },
    dispose() {
      cancelAnimationFrame(frame); if (dialog.open) dialog.close(); disposeBody?.(); resize.disconnect();
      document.removeEventListener('transitionrun', motion); document.removeEventListener('transitionend', motion); document.removeEventListener('transitioncancel', motion);
      window.removeEventListener('resize', follow); dialog.remove();
    }
  };
}
