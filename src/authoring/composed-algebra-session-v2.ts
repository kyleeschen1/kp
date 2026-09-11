import { createKpPreparedRevisionSession } from "./prepared-revision-session.ts";
import { checkKpComposedAlgebraProofV2 } from "./composed-algebra-proof-v2.ts";
import { assertKpComposedAlgebraPresentationV2, resolveKpComposedAlgebraPresentationV2, type KpComposedAlgebraPresentationV2 } from "./composed-algebra-presentation-v2.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { parseKpComposedAlgebraSourceV2 } from "./composed-algebra-source-v2.ts";
import primary from "./examples/composed-algebra-intuition.json" with { type: "json" };

export function prepareKpComposedAlgebraDraftV2(value: unknown = primary): KpComposedAlgebraPresentationV2 {
  return resolveKpComposedAlgebraPresentationV2(checkKpComposedAlgebraProofV2(value));
}
export function checkKpComposedAlgebraDraftV2(json: string) {
  try { return { status: "compiled" as const, draft: prepareKpComposedAlgebraDraftV2(parseKpComposedAlgebraSourceV2(json)) }; }
  catch (error) {
    if (!(error instanceof KpComposedAlgebraRepair)) throw error;
    return { status: "repair-gap" as const, diagnostic: { code: error.code, path: error.path, expected: error.expected } };
  }
}
export function exportKpComposedAlgebraSourceV2(draft: KpComposedAlgebraPresentationV2): string {
  assertKpComposedAlgebraPresentationV2(draft);
  return JSON.stringify(draft.checked.source, null, 2) + "\n";
}
export function createKpComposedAlgebraAuthoringSessionV2<Surface extends { dispose(): void }>(input: {
  readonly initial: KpComposedAlgebraPresentationV2;
  readonly prepare: (draft: KpComposedAlgebraPresentationV2) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: KpComposedAlgebraPresentationV2) => void;
}) {
  return createKpPreparedRevisionSession({ ...input, assertDraft: assertKpComposedAlgebraPresentationV2, check: checkKpComposedAlgebraDraftV2,
    preparationFailure: error => ({ code: "composed-algebra.preview", path: "$.states",
      expected: `Keep the last valid revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` }) });
}
