import { mountKpDeltaEpsilonKineticFigure } from
  "./kinetic-figure-delta-epsilon-entry.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected #app for the delta-epsilon figure.");
const session = mountKpDeltaEpsilonKineticFigure({ root });

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) session.dispose();
});
