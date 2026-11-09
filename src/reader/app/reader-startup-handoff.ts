/** Commit only a successfully rendered frame whose layout survived a frame
 * boundary. Font/viewport reservation may invalidate it in a microtask or RO.
 * The static document remains readable; its MathML retains accessibility
 * ownership until the canonical equation is ready to take over. */
export function createReaderStartupHandoff(input: {
  readonly requestFrame: (callback: () => void) => number;
  readonly cancelFrame: (id: number) => void;
  readonly commit: () => void;
}) {
  let phase: 'preparing' | 'settling' | 'committed' | 'disposed' = 'preparing';
  let revision = 0;
  let pending: number | undefined;
  return {
    arm() { if (phase === 'preparing') phase = 'settling'; },
    invalidate() {
      revision++;
      if (pending !== undefined) input.cancelFrame(pending);
      pending = undefined;
    },
    rendered() {
      if (phase !== 'settling') return;
      if (pending !== undefined) return;
      const renderedRevision = revision;
      pending = input.requestFrame(() => {
        pending = undefined;
        if (phase !== 'settling' || renderedRevision !== revision) return;
        phase = 'committed';
        input.commit();
      });
    },
    dispose() {
      phase = 'disposed';
      if (pending !== undefined) input.cancelFrame(pending);
      pending = undefined;
    }
  };
}
