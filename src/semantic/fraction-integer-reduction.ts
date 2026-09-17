import { createKpRational, equalKpRationals } from "../../domains/math/exact-rational.ts";
import type { KpExactFractionTermDraft } from "./exact-fraction-expression.ts";

const brand = Symbol("verified-integer-fraction-reduction"), issued = new WeakSet<object>();
export interface IntegerFractionReductionDraft {
  readonly id: string;
  readonly source: Readonly<{ stateId: string; term: KpExactFractionTermDraft }>;
  readonly target: Readonly<{ stateId: string; term: KpExactFractionTermDraft }>;
  readonly divisor: bigint;
}
export interface VerifiedIntegerFractionReduction extends IntegerFractionReductionDraft {
  readonly [brand]: true;
  readonly law: "divide-numerator-and-denominator-by-common-nonzero-integer";
  readonly exactValue: ReturnType<typeof createKpRational>;
  readonly correspondence: readonly Readonly<{ relation: "derivation"; source: string; target: string }>[];
}
export class IntegerFractionReductionError extends Error {}

/** An explicit common divisor is a witness, not a GCD solver or permission to
 * substitute any equal-valued fraction. Presentation is a separate capability. */
export function verifyIntegerFractionReduction(draft: IntegerFractionReductionDraft): VerifiedIntegerFractionReduction {
  const source = copyTerm(draft.source.term), target = copyTerm(draft.target.term), divisor = draft.divisor;
  const fail = (message: string): never => { throw new IntegerFractionReductionError(message); };
  if (typeof divisor !== "bigint" || divisor <= 1n) return fail("Supply an integer common divisor greater than one.");
  if (source.denominator.value <= 0n || target.denominator.value <= 0n) return fail("Denominators must be positive.");
  if (source.numerator.value !== target.numerator.value * divisor || source.denominator.value !== target.denominator.value * divisor)
    return fail("The same explicit divisor must produce both target integers exactly.");
  const ids = [draft.id, draft.source.stateId, draft.target.stateId];
  const occurrences = [source, target].flatMap(term => [term.termEntityId, term.fractionEntityId, term.divisionEntityId, term.numerator.entityId, term.denominator.entityId]);
  if ([...ids, ...occurrences].some(id => typeof id !== "string" || !/^[a-z][a-z0-9.-]*$/.test(id)) ||
      draft.source.stateId === draft.target.stateId || new Set(occurrences).size !== occurrences.length)
    return fail("Use distinct source/target states and state-local occurrence identities.");
  const exactValue = createKpRational(source.numerator.value, source.denominator.value);
  if (!equalKpRationals(exactValue, createKpRational(target.numerator.value, target.denominator.value))) return fail("Reduction changed the exact value.");
  const result: VerifiedIntegerFractionReduction = Object.freeze({ [brand]: true as const, id: draft.id,
    source: Object.freeze({ stateId: draft.source.stateId, term: source }), target: Object.freeze({ stateId: draft.target.stateId, term: target }),
    divisor, law: "divide-numerator-and-denominator-by-common-nonzero-integer", exactValue,
    correspondence: Object.freeze([
      Object.freeze({ relation: "derivation", source: source.numerator.entityId, target: target.numerator.entityId } as const),
      Object.freeze({ relation: "derivation", source: source.denominator.entityId, target: target.denominator.entityId } as const)
    ]) });
  issued.add(result);
  return result;
}
function copyTerm(term: KpExactFractionTermDraft): KpExactFractionTermDraft {
  for (const value of [term.numerator, term.denominator])
    if (typeof value.value !== "bigint" || typeof value.semanticId !== "string" || !value.semanticId)
      throw new IntegerFractionReductionError("Supply exact integer occurrences with semantic identity.");
  return Object.freeze({ termEntityId: term.termEntityId, fractionEntityId: term.fractionEntityId, divisionEntityId: term.divisionEntityId,
    numerator: Object.freeze({ ...term.numerator }), denominator: Object.freeze({ ...term.denominator }) });
}
export function isVerifiedIntegerFractionReduction(value: unknown): value is VerifiedIntegerFractionReduction {
  return !!value && typeof value === "object" && issued.has(value);
}
