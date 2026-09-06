import { mountKpSupplyTaxKineticFigure } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts";
import { createKpAuthoringMarketFrameSession } from "./authoring-market-frame.ts";
import { encodeKpSemanticStateCompositionLogicalAddress } from "../../semantic-state/state-family-composition-address.ts";
import { renderKpSupplyTaxWelfareLedger } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-svg.ts";
import "./authoring-market.css";
import { renderKpAuthoringMarketStaticFacts } from "./authoring-market-facts.ts";
import type { prepareKpAuthoringMarketPreview } from "./authoring-market-preview-prepare.ts";

/** Opt-in composition only: the existing figure still owns paint and clocks. */
export function mountKpAuthoringMarket(input: { readonly root: HTMLElement;
  readonly prepared: ReturnType<typeof prepareKpAuthoringMarketPreview> }) {
  const { authored, facts, boundArticle, companion } = input.prepared;
  const frames = createKpAuthoringMarketFrameSession(authored, { cacheCapacity: 2 });
  let session: ReturnType<typeof mountKpSupplyTaxKineticFigure>;
  try {
    session = mountKpSupplyTaxKineticFigure({ root: input.root, source: {
      authority: authored.source.canonical,
      instruction: companion,
      sampleFrame(progress) {
        const sampled = frames.sample(progress);
        input.root.dataset["kpAuthoringMarketAddress"] = encodeKpSemanticStateCompositionLogicalAddress(sampled.address);
        input.root.dataset["kpAuthoringMarketSnapshotCount"] = String(frames.history.snapshots.length);
        return sampled.frame;
      }
    } });
  } catch (error) { frames.dispose(); throw error; }
  input.root.dataset["kpAuthoringMarket"] = "state-driven-tax";
  // Before/after comparison is a revision-owned endpoint view, not the live
  // sample. Keep it explicitly labelled and outside the reader's focal stage.
  const comparison = document.createElement("details");
  comparison.dataset["kpAuthoringMarketComparison"] = "endpoints";
  comparison.innerHTML = `<summary>Exact before/after accounting</summary>${renderKpSupplyTaxWelfareLedger(authored.source.canonical.semantics)}${renderKpAuthoringMarketStaticFacts(facts)}`;
  input.root.querySelector("[data-kp-supply-tax-focus-deck]")!.after(comparison);
  let disposed = false;
  return Object.freeze({
    authored,
    companion,
    facts,
    boundArticle,
    frames,
    dispose() {
      if (disposed) return;
      disposed = true;
      session.dispose();
      frames.dispose();
      input.root.replaceChildren();
      input.root.dataset["kpAuthoringMarket"] = "disposed";
    }
  });
}
