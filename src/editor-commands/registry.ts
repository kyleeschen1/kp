export type CommandScope = 'workspace' | 'notebook' | 'chat';
export interface CommandOrigin {
  scope: CommandScope;
  element?: HTMLElement | null;
  /** Owners validate identities, not the dialog's current DOM focus. */
  valid?: () => string | undefined;
}
export type Availability = { enabled: true; checked?: boolean } | { enabled: false; reason: string };
export const available = (checked?: boolean): Availability => checked === undefined ? { enabled: true } : { enabled: true, checked };
export const unavailable = (reason: string): Availability => ({ enabled: false, reason });
export type Target<T> = { found: true; value: T } | { found: false; reason: string };
export const target = <T>(value: T): Target<T> => ({ found: true, value });
export interface CommandDescription {
  id: string; title: string; category: string; scope?: CommandScope;
  keywords?: readonly string[]; keys?: readonly string[]; description?: string;
}
export type CommandResult = { ok: true } | { ok: false; reason: string };
export interface PreparedCommand extends CommandDescription {
  state(): Availability;
  execute(): Promise<CommandResult>;
}
export interface CommandHandle extends CommandDescription {
  prepare(origin?: CommandOrigin): PreparedCommand;
  invoke(origin?: CommandOrigin): Promise<CommandResult>;
  bind(button: HTMLButtonElement): void;
  dispose(): void;
}
export interface TargetedCommand<T> extends CommandHandle {
  forTarget(value: T, origin?: CommandOrigin): PreparedCommand;
  bindTarget(button: HTMLButtonElement, value: T): void;
  /** A mounted object's button resolves its current revision at invocation;
   * picker snapshots continue to hold their originally captured revision. */
  bindResolvedTarget(button: HTMLButtonElement, resolve: () => Target<T>): void;
}
type Registration = { description: CommandDescription; prepare(origin: CommandOrigin): PreparedCommand };

/** Descriptions are shared by every UI; execution stays in the registering owner.
 * Captured invocations cannot survive disposal or silently change their target. */
export class CommandRegistry {
  private readonly entries = new Map<string, Registration>();
  private readonly running = new Set<Registration>();
  private readonly listeners = new Set<() => void>();
  private readonly history: string[] = [];
  readonly origin: () => CommandOrigin;
  private readonly report: (message: string) => void;
  constructor(origin: () => CommandOrigin, report: (message: string) => void) { this.origin = origin; this.report = report; }
  add(spec: CommandDescription & {
    state?: (origin: CommandOrigin) => Availability;
    run: (origin: CommandOrigin) => unknown | Promise<unknown>;
  }): CommandHandle {
    return this.targeted({ ...spec, target: () => target(undefined),
      state: (_value, origin) => spec.state?.(origin) ?? available(), run: (_value, origin) => spec.run(origin) });
  }
  targeted<T>(spec: CommandDescription & {
    target: (origin: CommandOrigin) => Target<T>;
    state?: (value: T, origin: CommandOrigin) => Availability;
    run: (value: T, origin: CommandOrigin) => unknown | Promise<unknown>;
  }): TargetedCommand<T> {
    if (this.entries.has(spec.id)) throw new Error(`Command already registered: ${spec.id}`);
    const description: CommandDescription = { id: spec.id, title: spec.title, category: spec.category,
      ...(spec.scope ? { scope: spec.scope } : {}), ...(spec.keywords ? { keywords: spec.keywords } : {}),
      ...(spec.keys ? { keys: spec.keys } : {}), ...(spec.description ? { description: spec.description } : {}) };
    const cleanups = new Set<() => void>();
    const prepare = (origin: CommandOrigin, selected = spec.target(origin)): PreparedCommand => {
      const state = (): Availability => {
        if (this.entries.get(spec.id) !== registration) return unavailable('This command owner has closed');
        const invalid = spec.scope === 'workspace' ? undefined : origin.valid?.(); if (invalid) return unavailable(invalid);
        if (spec.scope && spec.scope !== 'workspace' && spec.scope !== origin.scope) return unavailable(`Use from the ${spec.scope} pane`);
        if (this.running.has(registration)) return unavailable('Operation in progress');
        if (!selected.found) return unavailable(selected.reason);
        return spec.state?.(selected.value, origin) ?? available();
      };
      return { ...description, state, execute: async () => {
        const readiness = state();
        if (!readiness.enabled || !selected.found) {
          const reason = !readiness.enabled ? readiness.reason : 'Target unavailable';
          this.report(reason); return { ok: false, reason };
        }
        this.running.add(registration); this.notify();
        try {
          await spec.run(selected.value, origin);
          if (this.entries.get(spec.id) === registration) {
            const old = this.history.indexOf(spec.id); if (old >= 0) this.history.splice(old, 1);
            this.history.unshift(spec.id); this.history.length = Math.min(30, this.history.length);
          }
          return { ok: true };
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error); this.report(reason); return { ok: false, reason };
        } finally { this.running.delete(registration); this.notify(); }
      } };
    };
    const registration: Registration = { description, prepare };
    this.entries.set(spec.id, registration);
    const buttonOrigin = (): CommandOrigin => ({ ...this.origin(), scope: spec.scope === 'workspace' ? this.origin().scope : spec.scope ?? this.origin().scope });
    const bind = (button: HTMLButtonElement, selection?: Target<T> | (() => Target<T>)) => {
      button.dataset['commandId'] = spec.id;
      let mounted = button.isConnected;
      let unsubscribe = () => {};
      const release = () => { unsubscribe(); cleanups.delete(release); };
      const refresh = () => {
        if (mounted && !button.isConnected) { release(); return; }
        mounted ||= button.isConnected;
        const value = prepare(buttonOrigin(), typeof selection === 'function' ? selection() : selection).state(); button.disabled = !value.enabled;
        button.title = value.enabled ? spec.description ?? spec.keys?.join(' · ') ?? '' : value.reason;
        if (value.enabled && value.checked !== undefined) button.setAttribute('aria-pressed', String(value.checked));
      };
      button.onmousedown = event => event.preventDefault();
      button.onclick = () => { void prepare(buttonOrigin(), typeof selection === 'function' ? selection() : selection).execute(); };
      // Object rows need live availability too (e.g. a save has just finished).
      // Release rebuilt rows and abandoned mounts instead of retaining their DOM.
      unsubscribe = this.subscribe(refresh); cleanups.add(release);
      refresh();
      queueMicrotask(() => { if (!button.isConnected) release(); else refresh(); });
    };
    this.notify();
    return { ...description, prepare: (origin = this.origin()) => prepare(origin),
      invoke: (origin = this.origin()) => prepare(origin).execute(),
      forTarget: (value, origin = this.origin()) => prepare(origin, target(value)),
      bind: button => bind(button), bindTarget: (button, value) => bind(button, target(value)),
      bindResolvedTarget: (button, resolve) => bind(button, resolve),
      dispose: () => { if (this.entries.get(spec.id) !== registration) return;
        this.entries.delete(spec.id); cleanups.forEach(cleanup => cleanup()); this.notify(); }
    };
  }
  snapshot(origin = this.origin()): readonly PreparedCommand[] { return [...this.entries.values()].map(entry => entry.prepare(origin)); }
  descriptions(): readonly CommandDescription[] { return [...this.entries.values()].map(entry => entry.description); }
  invoke(id: string, origin = this.origin()): Promise<CommandResult> {
    const entry = this.entries.get(id);
    if (entry) return entry.prepare(origin).execute();
    const reason = `Command unavailable: ${id}`; this.report(reason); return Promise.resolve({ ok: false, reason });
  }
  recent(): readonly string[] { return this.history; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  notify() { for (const listener of this.listeners) listener(); }
  dispose() { this.entries.clear(); this.running.clear(); this.notify(); this.listeners.clear(); }
}
