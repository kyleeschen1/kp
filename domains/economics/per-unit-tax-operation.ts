import { createKpPerUnitTaxWelfareModel, type KpPerUnitTaxMarketStateV1 } from "./per-unit-tax-welfare-model.ts";
import { createKpPerUnitTaxWelfareAccounting, type KpPerUnitTaxWelfareStateV1 } from "./per-unit-tax-welfare-accounting.ts";
import type { KpPerUnitTaxWelfareInputV1 } from "./per-unit-tax-welfare.ts";

/** Domain operation, not a claim that its changing values are equal. */
export const kpPerUnitTaxOperation = Object.freeze({
  id: "kp.economics.impose-per-unit-tax", version: "1.0.0",
  packId: "project.economics.supply-tax", definitionId: "definition.economics.per-unit-tax",
  transformType: "imposePerUnitTax",
  lawIds: Object.freeze(["law.economics.supply-tax.market-clearing",
    "law.economics.supply-tax.wedge-equals-tax", "law.economics.supply-tax.welfare-closes"]),
  reverse: "authored-history-only",
  lifecycle: "immutable-state-occurrences",
  assumptions: Object.freeze(["linear bounded market", "zero initial and positive final tax",
    "original supply remains marginal-cost evidence"])
} as const);

export class KpPerUnitTaxOperationError extends Error {
  readonly code = "kp.economics.invalid-tax-operation";
  readonly path: string;
  constructor(path: string, cause?: unknown) {
    super(`Invalid per-unit-tax evidence at ${path}.`, { cause });
    this.name = "KpPerUnitTaxOperationError";
    this.path = path;
  }
}

export function verifyKpPerUnitTaxOperation(input: {
  readonly source: KpPerUnitTaxWelfareInputV1;
  readonly before: { readonly market: KpPerUnitTaxMarketStateV1; readonly accounting: KpPerUnitTaxWelfareStateV1 };
  readonly after: { readonly market: KpPerUnitTaxMarketStateV1; readonly accounting: KpPerUnitTaxWelfareStateV1 };
}) {
  // Re-run the domain owners; booleans or matching IDs in supplied state do not
  // substitute for executed clearing, incidence and welfare laws.
  let model: ReturnType<typeof createKpPerUnitTaxWelfareModel>;
  let accounting: ReturnType<typeof createKpPerUnitTaxWelfareAccounting>;
  try {
    model = createKpPerUnitTaxWelfareModel(input.source);
    accounting = createKpPerUnitTaxWelfareAccounting(model);
  } catch (cause) { throw new KpPerUnitTaxOperationError("source", cause); }
  for (const [side, phase] of [["before", "untaxed"], ["after", "taxed"]] as const) {
    if (JSON.stringify(input[side].market) !== JSON.stringify(model.states[phase])) {
      throw new KpPerUnitTaxOperationError(`${side}.market`);
    }
    if (JSON.stringify(input[side].accounting) !== JSON.stringify(accounting.states[phase])) {
      throw new KpPerUnitTaxOperationError(`${side}.accounting`);
    }
  }
  return Object.freeze({ operation: kpPerUnitTaxOperation, model, accounting });
}
