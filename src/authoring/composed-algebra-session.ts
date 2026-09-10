import { createKpPreparedRevisionSession } from "./prepared-revision-session.ts";
import { checkKpComposedAlgebraProof } from "./composed-algebra-proof.ts";
import { assertKpComposedAlgebraPresentation, resolveKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "./composed-algebra-presentation.ts";
import { KpComposedAlgebraRepair, parseKpComposedAlgebraSource } from "./composed-algebra-source.ts";
import primary from "./examples/composed-algebra-primary.json" with { type: "json" };

export function prepareKpComposedAlgebraDraft(value: unknown = primary): KpComposedAlgebraPresentation {
  return resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(value));
}
export function checkKpComposedAlgebraDraft(json: string) {
  try { return { status: "compiled" as const, draft: prepareKpComposedAlgebraDraft(parseKpComposedAlgebraSource(json)) }; }
  catch (error) {
    if (!(error instanceof KpComposedAlgebraRepair)) throw error;
    return { status: "repair-gap" as const, diagnostic: { code: error.code, path: error.path, expected: error.expected } };
  }
}
export function exportKpComposedAlgebraSource(draft: KpComposedAlgebraPresentation): string {
  assertKpComposedAlgebraPresentation(draft);
  return JSON.stringify(draft.checked.source, null, 2) + "\n";
}
/** Presentation authority is the draft capability; native preparation still
 * belongs to the shared transaction, before any displayed revision changes. */
export function createKpComposedAlgebraAuthoringSession<Surface extends { dispose(): void }>(input: {
  readonly initial: KpComposedAlgebraPresentation;
  readonly prepare: (draft: KpComposedAlgebraPresentation) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: KpComposedAlgebraPresentation) => void;
}) {
  return createKpPreparedRevisionSession({ ...input, assertDraft: assertKpComposedAlgebraPresentation, check: checkKpComposedAlgebraDraft,
    preparationFailure: error => ({ code: "composed-algebra.preview", path: "$.states",
      expected: `Keep the last valid revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` }) });
}
