export interface KpRevisionRepairDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly expected: string;
}

/** Extracted from the Bayes preview transaction. This owns preparation lifetime,
 * not semantic truth, display resources after commit, or a playback clock. */
export function createKpPreparedRevisionSession<Draft, Surface extends { dispose(): void }>(input: {
  readonly initial: Draft;
  readonly assertDraft: (value: Draft) => void;
  readonly check: (json: string) => { readonly status: "compiled"; readonly draft: Draft } |
    { readonly status: "repair-gap"; readonly diagnostic: KpRevisionRepairDiagnostic };
  readonly prepare: (draft: Draft) => Promise<Surface>;
  // Commit must publish synchronously after all fallible preparation succeeds.
  readonly commit: (surface: Surface, draft: Draft) => void;
  readonly preparationFailure: (error: unknown) => KpRevisionRepairDiagnostic;
}) {
  input.assertDraft(input.initial);
  let current = input.initial, generation = 0, disposed = false;
  return Object.freeze({
    current: () => current,
    invalidate: () => { ++generation; },
    dispose: () => { disposed = true; ++generation; },
    async apply(json: string) {
      const ticket = ++generation;
      if (disposed) return { status: "superseded" as const };
      const candidate = input.check(json);
      if (candidate.status === "repair-gap") return candidate;
      input.assertDraft(candidate.draft);
      let surface: Surface | undefined;
      try {
        surface = await input.prepare(candidate.draft);
        if (disposed || ticket !== generation) return { status: "superseded" as const };
        input.commit(surface, candidate.draft);
        current = candidate.draft;
        surface = undefined;
        return { status: "applied" as const, current };
      } catch (error) {
        if (disposed || ticket !== generation) return { status: "superseded" as const };
        return { status: "repair-gap" as const, diagnostic: input.preparationFailure(error) };
      } finally { surface?.dispose(); }
    }
  });
}
