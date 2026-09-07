import { createKpCanonicalTaxReaderSource } from "./canonical-tax-source.ts";
import { mountKpSupplyTaxKineticFigure } from "./kinetic-figure-supply-tax-entry.ts";

/** Page lifetime owns both the existing host and its revision-local queries. */
export function mountKpCanonicalTaxReader(input: { readonly root: HTMLElement }) {
  const source = createKpCanonicalTaxReaderSource();
  let session: ReturnType<typeof mountKpSupplyTaxKineticFigure>;
  try { session = mountKpSupplyTaxKineticFigure({ root: input.root, source: source.source }); }
  catch (error) { source.dispose(); throw error; }
  input.root.dataset["kpCanonicalTaxSource"] = "framework-reference";
  input.root.dataset["kpCanonicalTaxSourceRevision"] = source.sourceRevision;
  let disposed = false;
  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      try { session.dispose(); }
      finally { source.dispose(); input.root.dataset["kpCanonicalTaxSource"] = "disposed"; }
    }
  });
}
