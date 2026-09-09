import { checkBayesDraft, requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";

/** A local preview transaction, not a semantic store or playback clock.
 * Stale preparations own resources but never acquire display authority. */
export function createBayesAuthoringSession<Surface extends { dispose(): void }>(input: {
  readonly initial: PreparedBayesDraft;
  readonly prepare: (draft: PreparedBayesDraft) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: PreparedBayesDraft) => void;
}) {
  requirePreparedBayesDraft(input.initial);
  let current = input.initial, generation = 0, disposed = false;
  return Object.freeze({
    current: () => current,
    invalidate: () => { ++generation; },
    dispose: () => { disposed = true; ++generation; },
    async apply(json: string) {
      const ticket = ++generation;
      if (disposed) return { status: "superseded" as const };
      const candidate = checkBayesDraft(json);
      if (candidate.status === "repair-gap") return candidate;
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
        return { status: "repair-gap" as const, diagnostic: { code: "probability.preview", path: "$",
          expected: `Keep the last valid revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` } };
      } finally { surface?.dispose(); }
    }
  });
}
