import { mountKpLogProductKineticFigure } from
  "./kinetic-figure-log-product-entry.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected #app for the log-product figure.");
const session = mountKpLogProductKineticFigure({ root });

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) session.dispose();
});
