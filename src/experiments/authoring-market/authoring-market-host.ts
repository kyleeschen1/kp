import { mountKpSupplyTaxKineticFigure } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts";
import { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFrameSession } from "./authoring-market-frame.ts";
import { encodeKpSemanticStateCompositionLogicalAddress } from "../../semantic-state/state-family-composition-address.ts";

/** Opt-in composition only: the existing figure still owns paint and clocks. */
export function mountKpAuthoringMarket(input: { readonly root: HTMLElement }) {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const frames = createKpAuthoringMarketFrameSession(authored, { cacheCapacity: 2 });
  let session: ReturnType<typeof mountKpSupplyTaxKineticFigure>;
  try {
    session = mountKpSupplyTaxKineticFigure({ root: input.root, source: {
      authority: authored.source.canonical,
      sampleFrame(progress) {
        const sampled = frames.sample(progress);
        input.root.dataset["kpAuthoringMarketAddress"] = encodeKpSemanticStateCompositionLogicalAddress(sampled.address);
        input.root.dataset["kpAuthoringMarketSnapshotCount"] = String(frames.history.snapshots.length);
        return sampled.frame;
      }
    } });
  } catch (error) { frames.dispose(); throw error; }
  input.root.dataset["kpAuthoringMarket"] = "state-driven-tax";
  let disposed = false;
  return Object.freeze({
    authored,
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
