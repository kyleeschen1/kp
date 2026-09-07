import { createKpPerUnitTaxWelfareModel } from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import type { KpPerUnitTaxWelfareInputV1 } from "../../../domains/economics/per-unit-tax-welfare.ts";
import { createKpSupplyTaxGovernedSource } from "./economics-supply-tax-governed-source.ts";
import { evaluateKpSemanticDerivedValue } from "../../semantic-state/derived-evaluator.ts";
import { createKpSemanticSnapshotRecoveryIndex, pinKpAggregateSemanticSnapshot } from "../../semantic-state/pinned-recovery.ts";
import { createKpSemanticStateComposedMarketPacket } from "./semantic-state-composed-market.ts";

export class KpAuthoringMarketSourceError extends Error {
  readonly code = "kp.economics.unverified-state-operation";
  constructor(message: string) { super(message); this.name = "KpAuthoringMarketSourceError"; }
}

/** Domain-authorized source entrance; arbitrary state commits are not inputs. */
export function createKpAuthoredMarketSource(input: {
  readonly kind: "impose-per-unit-tax";
  readonly model?: KpPerUnitTaxWelfareInputV1;
  readonly parameters?: NonNullable<Parameters<typeof createKpSemanticStateComposedMarketPacket>[1]>;
}) {
  if (input.kind !== "impose-per-unit-tax") throw new KpAuthoringMarketSourceError("Choose the supported domain operation; generic updates have no lowering authority.");
  const original = createKpPerUnitTaxWelfareModel(input.model);
  const packet = createKpSemanticStateComposedMarketPacket(original.input, input.parameters ?? {
    demandPriceIntercept: original.input.demand.priceIntercept, taxAmount: original.input.tax.finalAmount
  });
  const applied = packet.chain.applications.find(item => item.memberId === packet.compositionHandles.root.children.timeline.children["tax-policy"].children["add-tax"].id)!;
  const lower = (candidate: typeof applied.application) => {
    // The applied-family instance is a local capability produced by this author
    // session. Matching values, IDs or a copied journal cannot mint that right.
    if (candidate !== applied.application) throw new KpAuthoringMarketSourceError("A generic or foreign commit cannot replace this session's verified tax application.");
    const { before, after } = candidate.commit;
    const beforeState = packet.stateHandles.pin(before);
    const afterState = packet.stateHandles.pin(after);
    if (JSON.stringify(beforeState.source.model.read()) !== JSON.stringify(afterState.source.model.read()) ||
      JSON.stringify(beforeState.drivers.demandPriceIntercept.read()) !== JSON.stringify(afterState.drivers.demandPriceIntercept.read())) {
      throw new KpAuthoringMarketSourceError("The tax operation cannot change model assumptions or demand.");
    }
    const read = (snapshot: typeof before) => evaluateKpSemanticDerivedValue({ graph: packet.graph,
      snapshot, target: packet.stateHandles.refs.outcomes.evaluation });
    const beforeValue = read(before);
    const afterValue = read(after);
    const sourceInput = beforeState.source.model.read();
    return createKpSupplyTaxGovernedSource({
      source: { ...sourceInput, demand: { ...sourceInput.demand, priceIntercept: beforeState.drivers.demandPriceIntercept.read() },
        tax: { ...sourceInput.tax, finalAmount: afterState.drivers.taxAmount.read() } },
      before: { market: beforeValue.market, accounting: beforeValue.accounting },
      after: { market: afterValue.market, accounting: afterValue.accounting },
      beforePin: pinKpAggregateSemanticSnapshot(before), afterPin: pinKpAggregateSemanticSnapshot(after),
      history: createKpSemanticSnapshotRecoveryIndex([before, after])
    });
  };
  return Object.freeze({ packet, application: applied.application, source: lower(applied.application), lower });
}
