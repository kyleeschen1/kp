import { checkKpComposedAlgebraProofV2 } from '../composed-algebra-proof-v2.ts';
import { assertKpComposedAlgebraPresentationV2, resolveKpComposedAlgebraPresentationV2,
  type KpComposedAlgebraPresentationV2 as Presentation } from '../composed-algebra-presentation-v2.ts';
import { parse, Repair } from './source.ts';

export type { Presentation };

/** Explicit source in; verifier-issued complete presentation out. Examples and
 * editor lifetimes belong to callers, not this compilation boundary. */
export function compile(source: unknown): Presentation {
  return resolveKpComposedAlgebraPresentationV2(checkKpComposedAlgebraProofV2(source));
}
export function check(json: string) {
  try { return { status: 'compiled' as const, draft: compile(parse(json)) }; }
  catch (error) {
    if (!(error instanceof Repair)) throw error;
    return { status: 'repair-gap' as const, diagnostic: { code: error.code, path: error.path, expected: error.expected } };
  }
}
export function serialize(draft: Presentation): string {
  assertKpComposedAlgebraPresentationV2(draft);
  return JSON.stringify(draft.checked.source, null, 2) + '\n';
}
