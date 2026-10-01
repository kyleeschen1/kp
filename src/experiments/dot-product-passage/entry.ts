import "./page.css";
import { passage, comparisonPassage } from "./source.ts";
import { mountDotPlayer } from "./player.ts";

const compare = new URLSearchParams(location.search).has("compare");
const examples = [{ root: document.querySelector<HTMLElement>("#dot-player")!, passage }];
if (compare) {
  const heading = document.createElement("h2"); heading.textContent = "Same presentation, different matrices";
  const root = document.createElement("div"); root.id = "dot-player-second";
  document.querySelector("#matrix-story")!.append(heading, root);
  examples.push({ root, passage: comparisonPassage });
}
let disposed = false;
const cleanups: (() => void)[] = [];
for (const example of examples) {
  void mountDotPlayer(example.root, example.passage, !compare).then(dispose => {
    if (disposed) dispose(); else cleanups.push(dispose);
  }).catch(error => {
    example.root.setAttribute("aria-busy", "false"); example.root.dataset["gap"] = "true";
    example.root.textContent = `The dot passage could not be prepared: ${error instanceof Error ? error.message : String(error)}`;
  });
}
import.meta.hot?.dispose(() => { disposed = true; cleanups.forEach(dispose => dispose()); });
