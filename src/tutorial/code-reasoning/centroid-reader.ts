import { mountCentroidInspection } from "./centroid-inspection.ts";
import { mountCentroidRelation } from "./centroid-relation.ts";
const root = document.querySelector<HTMLElement>("[data-centroid-local-inspection]");
if (root) {
  try {
    const relation = document.querySelector<HTMLElement>("[data-centroid-relation]");
    const direct = new URL(location.href).searchParams.get("reading") === "relationships" && relation !== null;
    const dispose = direct ? mountCentroidRelation(relation) : mountCentroidInspection(root);
    if (direct) { root.hidden = true; relation.hidden = false; }
    window.addEventListener("pagehide", dispose, { once: true });
  } catch (error) {
    // The accepted static reading remains usable when source evidence is stale.
    const status = root.querySelector<HTMLElement>("[data-centroid-error]");
    if (status) { status.hidden = false; status.textContent = error instanceof Error ? error.message : "Inspection unavailable"; }
  }
}
