export interface DeferredCardSession { dispose(): void }
export type DeferredCardResult =
  | { readonly kind: "ready" }
  | { readonly kind: "disposed" }
  | { readonly kind: "failed"; readonly cause: unknown };
type State =
  | { readonly kind: "idle" }
  | { readonly kind: "loading"; readonly pending: Promise<DeferredCardResult> }
  | { readonly kind: "ready"; readonly session: DeferredCardSession }
  | { readonly kind: "failed"; readonly cause: unknown }
  | { readonly kind: "disposed" };

/** This host owns mount lifetime, not module registration or animation time.
 * Preparation may finish after disposal; it must never resurrect a card. */
export function createDeferredCardSession(
  prepare: () => Promise<() => DeferredCardSession | Promise<DeferredCardSession>>
) {
  let state: State = { kind: "idle" };
  const disposed = () => state.kind === "disposed";
  return Object.freeze({
    status: (): State["kind"] => state.kind,
    activate(): Promise<DeferredCardResult> {
      if (state.kind === "loading") return state.pending;
      if (state.kind === "ready" || state.kind === "disposed") return Promise.resolve({ kind: state.kind });
      const pending = Promise.resolve().then(() => disposed() ? undefined : prepare()).then(async mount => {
        if (!mount || disposed()) return { kind: "disposed" } as const;
        const session = await mount();
        if (disposed()) { session.dispose(); return { kind: "disposed" } as const; }
        state = { kind: "ready", session };
        return { kind: "ready" } as const;
      }).catch((cause: unknown): DeferredCardResult => {
        if (disposed()) return { kind: "disposed" };
        state = { kind: "failed", cause };
        return { kind: "failed", cause };
      });
      state = { kind: "loading", pending };
      return pending;
    },
    dispose(): void {
      if (state.kind === "disposed") return;
      const previous = state;
      state = { kind: "disposed" };
      if (previous.kind === "ready") previous.session.dispose();
    }
  });
}
