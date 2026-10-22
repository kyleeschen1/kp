import { createKpPreparedRevisionSession } from "../prepared-revision-session.ts";
import { assertDraft, check, type Draft } from "./compile.ts";

/** The host owns displayed resources; the shared transaction releases every
 * prepared candidate that fails or loses the race to a newer edit. */
export function session<Surface extends { dispose(): void }>(input: {
  readonly initial: Draft;
  readonly prepare: (draft: Draft) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: Draft) => void;
}) {
  return createKpPreparedRevisionSession({ ...input, assertDraft, check,
    preparationFailure: error => ({ code: "matrix.preview", path: "$",
      expected: `Keep the last displayed revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` }) });
}
