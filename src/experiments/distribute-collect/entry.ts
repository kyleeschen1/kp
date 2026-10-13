import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "../common-factor/style.css";
import "../composed-algebra/style.css";
import { distributeCollectExample } from "./page.ts";
import { mountDistributeCollectCard } from "../composed-algebra/card.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
async function mount() {
  const draft = distributeCollectExample(location.href);
  const surface = await mountDistributeCollectCard(root, draft);
  const dispose = () => { surface.dispose(); window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => {
    if (event.persisted) { surface.cancel(); surface.clock.pause(); } else dispose();
  };
  window.addEventListener("pagehide", pagehide);
  import.meta.hot?.dispose(dispose);
  root.dataset["composedStatus"] = "ready";
}
void mount().catch(error => {
  root.dataset["composedStatus"] = "repair-gap";
  const output = root.querySelector<HTMLElement>("[data-composed-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  root.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input").forEach(control => { control.disabled = true; });
});
