import { mountKpSupplyTaxScrollScore } from
  "./kinetic-figure-supply-tax-scroll-score-entry.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected #app for the Scroll Score Station.");
const session = mountKpSupplyTaxScrollScore({ root });
window.addEventListener("pagehide", () => session.dispose(), { once: true });
