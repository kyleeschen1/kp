import example from "../../examples/algebra/fraction-chain.json" with { type: "json" };
import { compileFractionChain } from "./fraction-chain-compilation.ts";

export function createFractionChainAuthorExample() {
  return { ...structuredClone(example), moves: example.moves.map(({ hint: _hint, ...move }) => ({ ...move })) };
}

/** Report exact checked moves, without serializing live proof or promising paint
 * certification for arbitrary numeric callers. The host rechecks source. */
export function checkFractionChainAuthorSource(json: string) {
  let value: unknown;
  try { value = JSON.parse(json); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { status: "repair-required" as const, code: "fraction-chain.source" as const, path: "$", expected: "Provide valid fraction-chain JSON." };
  }
  const result = compileFractionChain(value);
  if (result.status !== "compiled") return result;
  return Object.freeze({ status: "compiled" as const, domain: "algebra" as const,
    revisionId: result.compilation.revision, checkpointCount: result.compilation.source.states.length,
    moves: result.compilation.steps.map((step, index) => ({ id: result.compilation.source.moves[index]!.id,
      kind: step.kind, from: result.compilation.source.states[index]!.id, to: result.compilation.source.states[index + 1]!.id })),
    editorialStatus: "editorial-not-proof" as const, presentationStatus: "not-certified-by-this-check" as const });
}
