import "./style.css";
import { compile } from "../../authoring/algebra/compile.ts";
import { mountComposedAlgebraCardV2 } from "../composed-algebra/card.ts";
import { AnchoredAlgebraGap, bindAnchoredCommentary } from "./commentary.ts";
import { mountAnchoredLabels } from "./anchors.ts";

const root = document.querySelector<HTMLElement>("[data-anchored-algebra]")!;
const errorOutput = root.querySelector<HTMLElement>("[data-anchored-error]")!;
const report = (error: unknown) => {
  errorOutput.hidden = false;
  errorOutput.textContent = error instanceof Error ? error.message : String(error);
  root.dataset["anchoredStatus"] = "repair-gap";
};
async function mount() {
  const encoded = root.querySelector("[data-anchored-source]")?.textContent;
  if (!encoded) throw new AnchoredAlgebraGap("source", "Load the checked page source.");
  const draft = compile(JSON.parse(encoded)), commentary = bindAnchoredCommentary(draft);
  const requested = new URL(location.href);
  if (requested.searchParams.has("revision") && requested.searchParams.get("revision") !== draft.revisionId)
    throw new AnchoredAlgebraGap("location.revision", "This link belongs to a different explanation revision; no replacement was selected.");
  // Validate before mounting; a bad direct link must not silently show step one.
  const requestedState = requested.hash ? decodeURIComponent(requested.hash.slice(1)) : commentary.stops[0]!.stateId;
  const initial = commentary.progressFor(requestedState);
  // The native shell appends its own surface. Static and enhanced math must
  // never participate in the stage grid at the same time.
  root.querySelector<HTMLElement>("[data-anchored-static]")!.hidden = true;
  const surface = await mountComposedAlgebraCardV2(root, draft);
  const stage = surface.card.querySelector<HTMLElement>("[data-distribution-stage]")!;
  const labels = mountAnchoredLabels(stage);
  let disposed = false;
  const render = (invalidate = false) => {
    if (disposed) return;
    try {
      labels.render(commentary.at(surface.clock.getSnapshot().progress), invalidate);
      errorOutput.hidden = true; root.dataset["anchoredStatus"] = "ready";
    } catch (error) { labels.render(undefined); report(error); }
  };
  const unsubscribe = surface.clock.subscribe(() => render());
  const restore = () => {
    try {
      const url = new URL(location.href);
      if (url.searchParams.has("revision") && url.searchParams.get("revision") !== draft.revisionId)
        throw new AnchoredAlgebraGap("location.revision", "Restore the matching source revision.");
      const progress = commentary.progressFor(url.hash ? decodeURIComponent(url.hash.slice(1)) : commentary.stops[0]!.stateId);
      surface.cancel(); surface.clock.pause(); surface.clock.seek(progress); render();
    } catch (error) { report(error); }
  };
  window.addEventListener("hashchange", restore);
  const jump = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-anchored-jump]");
    if (!link) return;
    event.preventDefault(); history.pushState(null, "", link.href); restore();
  };
  root.addEventListener("click", jump);
  // Native preparation already observes window resize. Repaint labels after it,
  // and invalidate endpoint measurements when a local container changes size.
  const resize = () => render(true);
  window.addEventListener("resize", resize);
  const observer = new ResizeObserver(() => render(true)); observer.observe(stage);
  const dispose = () => {
    if (disposed) return; disposed = true; observer.disconnect(); unsubscribe(); labels.dispose(); surface.dispose();
    root.removeEventListener("click", jump); window.removeEventListener("resize", resize); window.removeEventListener("hashchange", restore); window.removeEventListener("pagehide", pagehide);
  };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { surface.cancel(); surface.clock.pause(); } else dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  surface.clock.seek(initial); render();
}
void mount().catch(report);
