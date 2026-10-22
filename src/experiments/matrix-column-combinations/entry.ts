import "./style.css";
import "../matrix-example-page.css";

const root = document.querySelector<HTMLElement>("#comb-player")!;
let disposed = false, dispose: (() => void) | undefined;
const release = () => {
  if (disposed) return;
  disposed = true; dispose?.(); window.removeEventListener("pagehide", pagehide);
};
// A route can leave before its selected module arrives. The host cannot cancel
// that pending import because it has not mounted yet; the entry owns this gap.
const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) release(); };
window.addEventListener("pagehide", pagehide);
if (new URL(location.href).searchParams.get("compare") === "1") {
  void import("./comparison-host.ts").then(({ mountMatrixComparison }) => {
    if (!disposed) dispose = mountMatrixComparison(root);
  }).catch(error => { if (!disposed) { root.textContent = String(error); root.setAttribute("aria-busy", "false"); } });
} else if (new URL(location.href).searchParams.get("walk") === "1") {
  void import("./walk-host.ts").then(({ mountMatrixWalk }) => {
    if (!disposed) dispose = mountMatrixWalk(root);
  }).catch(error => { if (!disposed) { root.textContent = String(error); root.setAttribute("aria-busy", "false"); } });
} else if (new URL(location.href).searchParams.get("author") === "1") {
  void import("./author.ts").then(({ mountColumnAuthor }) => {
    if (!disposed) dispose = mountColumnAuthor(root);
  }).catch(error => { if (!disposed) { root.textContent = String(error); root.setAttribute("aria-busy", "false"); } });
} else {
  // Optional comparisons should not activate the ordinary calculation player.
  // Keep selection at the host boundary, with the same disposal guard as the
  // other lazy routes, rather than splitting mathematical or motion owners.
  void Promise.all([import("./reader.ts"), import("./page.ts")]).then(([{ mountColumnReader }, { loadColumnPage }]) => {
    if (!disposed) dispose = mountColumnReader(root, loadColumnPage);
  }).catch(error => { if (!disposed) { root.textContent = String(error); root.setAttribute("aria-busy", "false"); } });
}
import.meta.hot?.dispose(release);
