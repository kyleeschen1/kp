import { mountKpSupplyTaxKineticFigure } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts";
import { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";

/** Opt-in composition only: the existing figure still owns paint and clocks. */
export function mountKpAuthoringMarket(input: { readonly root: HTMLElement }) {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const session = mountKpSupplyTaxKineticFigure(input);
  // This baseline host prepares verified source; later adapters connect its
  // sampled values. Do not label this intermediate mount state-driven.
  input.root.dataset["kpAuthoringMarket"] = "canonical-baseline";
  let disposed = false;
  return Object.freeze({
    authored,
    dispose() {
      if (disposed) return;
      disposed = true;
      session.dispose();
      input.root.replaceChildren();
      input.root.dataset["kpAuthoringMarket"] = "disposed";
    }
  });
}
