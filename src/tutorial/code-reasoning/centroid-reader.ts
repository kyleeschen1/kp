import { mountCentroidInspection } from "./centroid-inspection.ts";
const root = document.querySelector<HTMLElement>("[data-centroid-local-inspection]");
if (root) {
  try {
    const dispose = mountCentroidInspection(root);
    window.addEventListener("pagehide", dispose, { once: true });
  } catch (error) {
    // The accepted static reading remains usable when source evidence is stale.
    const status = root.querySelector<HTMLElement>("[data-centroid-error]");
    if (status) { status.hidden = false; status.textContent = error instanceof Error ? error.message : "Inspection unavailable"; }
  }
}
