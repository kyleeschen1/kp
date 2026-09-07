import { evaluateKpPerUnitTaxBuyerFacingSupplyPrice } from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import { kpPerUnitTaxWelfareFrameSchemaVersion, type KpPerUnitTaxWelfareFrameV1 } from "../../../domains/economics/per-unit-tax-welfare-frame.ts";
import { createKpSemanticStateQuerySession } from "../../semantic-state/authoring-query-session.ts";
import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { projectKpAuthoringMarketClockAddress } from "./authoring-market-clock-address.ts";

/** One state evaluation supplies the existing tax-frame projection. */
export function createKpAuthoringMarketFrameSession(
  authored: ReturnType<typeof createKpAuthoredMarketSource>,
  options: { readonly cacheCapacity?: number } = {}
) {
  const { packet, source } = authored;
  const query = createKpSemanticStateQuerySession(packet.explanation, options);
  const semantics = source.canonical.semantics;
  return Object.freeze({
    history: query.history,
    inspect: query.inspect, reset: query.reset, dispose: query.dispose,
    sample(readerProgress: number) {
      const { address, progress } = projectKpAuthoringMarketClockAddress({ packet, member: "tax", progress: readerProgress });
      const evaluation = query.evaluate(address, packet.stateHandles.refs.outcomes.evaluation);
      const dto = Object.freeze({ numerator: progress.numerator.toString(), denominator: progress.denominator.toString() });
      const { model, market, accounting } = evaluation;
      // Shape projection only. Clearing and welfare were already computed by
      // the state derivation; curve evaluation stays with the domain owner.
      const frame: KpPerUnitTaxWelfareFrameV1 = Object.freeze({
        schemaVersion: kpPerUnitTaxWelfareFrameSchemaVersion,
        id: `frame.${semantics.id}.forward.${dto.numerator}-of-${dto.denominator}`,
        assetId: semantics.id, direction: "forward", playbackProgress: dto, modelProgress: dto,
        phase: progress.numerator === 0n ? "untaxed" : progress.numerator === progress.denominator ? "taxed" : "tax-transit",
        curves: Object.freeze({ demandId: model.input.demand.id, originalSupplyId: model.input.supply.id,
          buyerFacingSupplyId: model.input.supply.taxedId, originalSupplyIntercept: model.input.supply.priceIntercept,
          buyerFacingSupplyIntercept: evaluateKpPerUnitTaxBuyerFacingSupplyPrice({ model, phase: market.phase,
            quantity: { numerator: "0", denominator: "1" } }) }),
        market: Object.freeze({ taxAmount: market.taxAmount, quantity: market.quantity,
          consumerPrice: market.consumerPrice, producerPrice: market.producerPrice, priceWedge: market.priceWedge }),
        welfare: Object.freeze({ consumerSurplus: accounting.consumerSurplus, producerSurplus: accounting.producerSurplus,
          governmentRevenue: accounting.governmentRevenue, totalSurplus: accounting.totalSurplus,
          deadweightLoss: evaluation.deadweightLoss }),
        activeSemanticIds: Object.freeze([model.input.demand.id, model.input.supply.id, model.input.supply.taxedId,
          model.input.tax.id, model.input.wedgeId, ...semantics.entities.regions.map(({ id }) => id)])
      });
      return Object.freeze({ revisionId: source.authority.revisionId, address, evaluation, frame });
    }
  });
}
