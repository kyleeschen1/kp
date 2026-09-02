import { mountKpSupplyTaxKineticFigure } from
  "./kinetic-figure-supply-tax-entry.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected #app for the supply-tax figure.");
const session = mountKpSupplyTaxKineticFigure({ root });

const handlePageHide = (event: PageTransitionEvent): void => {
  if (!event.persisted) session.dispose();
};

window.addEventListener("pagehide", handlePageHide);

if (import.meta.hot !== undefined) {
  // This host composes four renderer-owned clocks. We intentionally do not
  // accept HMR here: Vite must reload the document rather than combine module
  // generations inside one page. Disposal remains useful when this entry
  // module itself is replaced before Vite escalates the update.
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", handlePageHide);
    session.dispose();
  });
}
