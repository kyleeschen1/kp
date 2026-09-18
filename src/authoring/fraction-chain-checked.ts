import { sha256 } from "../kernel/public-api.ts";
import { readFractionChainSource, FractionChainRepair, fractionChainDiagnostic, type FractionChainSource, type FractionChainDiagnostic } from "./fraction-chain-source.ts";
import { resolveFractionChainMove } from "./fraction-chain-move-resolution.ts";

const brand = Symbol("checked-fraction-chain"), issued = new WeakSet<object>();
export type CheckedFractionChainStep = ReturnType<typeof resolveFractionChainMove>;
export interface CheckedFractionChain {
  readonly [brand]: true;
  readonly source: FractionChainSource;
  readonly revision: string;
  readonly steps: readonly CheckedFractionChainStep[];
}

/** Browser and build share exact source checking. Governed authoring compilation
 * is additional build work, not a transported proof the reader can trust. */
export function checkFractionChain(value: unknown):
  | { status: "checked"; chain: CheckedFractionChain } | FractionChainDiagnostic {
  const parsed = readFractionChainSource(value);
  if (parsed.status !== "parsed") return parsed;
  const source = parsed.source;
  try {
    const revision = sha256(JSON.stringify({ ...source, states: source.states.map(({ id, latex }) => ({ id, latex })) }));
    const steps = Object.freeze(source.moves.map((_, index) => Object.freeze(resolveFractionChainMove(source, index))));
    const chain: CheckedFractionChain = Object.freeze({ [brand]: true as const, source, revision, steps });
    issued.add(chain);
    return { status: "checked", chain };
  } catch (error) {
    if (error instanceof FractionChainRepair) return fractionChainDiagnostic(error);
    throw error;
  }
}

export function assertCheckedFractionChain(value: unknown): asserts value is CheckedFractionChain {
  if (!value || typeof value !== "object" || !issued.has(value)) throw new TypeError("Use the original source-checked fraction chain.");
}
