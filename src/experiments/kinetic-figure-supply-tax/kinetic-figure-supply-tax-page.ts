import { mountKpSupplyTaxKineticFigure } from
  "./kinetic-figure-supply-tax-entry.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected #app for the supply-tax figure.");
const session = mountKpSupplyTaxKineticFigure({ root });

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) session.dispose();
});
