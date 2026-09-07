import { mountKpSurfaceContourKineticFigure } from
  "../../tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-entry.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected #app for the surface-contour figure.");
const session = mountKpSurfaceContourKineticFigure({ root });

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) session.dispose();
});
