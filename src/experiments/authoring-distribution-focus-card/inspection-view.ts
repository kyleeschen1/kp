import "./inspection-view.css";
import { describeKpSymbolicInspectionValidity } from "../../semantic/symbolic-inspection-diagnostics.ts";
import type { KpInspectionSelection } from "./inspection-selection.ts";
import type { KpSymbolicInspectionOccurrence } from "../../semantic/symbolic-inspection-types.ts";

export function mountKpDistributionInspectionView(input: {
  readonly root: HTMLElement;
  readonly card: HTMLElement;
  readonly selection: KpInspectionSelection;
  readonly pause: () => void;
}) {
  const { root, card, selection } = input;
  const snapshot = selection.snapshot, evidence = snapshot.evidence;
  const layout = document.createElement("div"); layout.className = "kp-inspection-layout";
  const panel = document.createElement("aside"); panel.className = "kp-inspection-panel";
  panel.setAttribute("aria-label", "Inspect distribution");
  panel.innerHTML = `<h2>Inspect distribution</h2>
    <p>The shared factor multiplies each addend. Follow a part to see what persists, branches, or disappears.</p>
    <label>Occurrence <select aria-label="Occurrence to inspect"><option value="">Choose a part…</option></select></label>
    <p class="review-help">Pause anywhere and choose a part. At an endpoint, you can also click the equation.</p>
    <div data-inspection-result role="status" aria-live="polite"></div>
    <div data-inspection-links></div>
    <button type="button" data-inspection-clear>Clear inspection</button>
    <details><summary>Audit evidence</summary><p>This preview is restored only when it matches the canonical source and animation.</p><div data-inspection-audit></div></details>`;
  card.before(layout); layout.append(card, panel); root.classList.add("kp-inspection-host");
  const chooser = panel.querySelector<HTMLSelectElement>("select")!;
  const result = panel.querySelector<HTMLElement>("[data-inspection-result]")!;
  const links = panel.querySelector<HTMLElement>("[data-inspection-links]")!;
  const audit = panel.querySelector<HTMLElement>("[data-inspection-audit]")!;
  const clearButton = panel.querySelector<HTMLButtonElement>("[data-inspection-clear]")!;
  const occurrences = snapshot.occurrences;
  const title = (item: KpSymbolicInspectionOccurrence) => `${item.side === "source" ? "Source" : "Target"} ${occurrences.filter(candidate => candidate.side === item.side).indexOf(item) + 1}: ${item.label}`;
  occurrences.forEach((item, index) => chooser.add(new Option(title(item), String(index))));
  const validity = describeKpSymbolicInspectionValidity(evidence);
  const addText = (parent: HTMLElement, tag: "p" | "dt" | "dd", text: string) => {
    const node = document.createElement(tag); node.textContent = text; parent.append(node); return node;
  };
  addText(audit, "p", validity.summary);
  addText(audit, "p", validity.limitation);
  const facts = document.createElement("dl"); audit.append(facts);
  const fact = (label: string, value: string) => { addText(facts, "dt", label); addText(facts, "dd", value); };
  fact("Operation", evidence.operation);
  fact("Declared laws", validity.lawIds.join(", ") || "No law references supplied.");
  fact("Assumptions supplied", validity.assumptions.join("; ") || "None listed; this is not a claim of assumption-free mathematics.");
  fact("Source revision", evidence.sourceRevision); fact("Target revision", evidence.targetRevision);
  fact("Transformation", evidence.transformationId);
  const selectedFacts = document.createElement("p"); audit.append(selectedFacts);
  const choose = (item: KpSymbolicInspectionOccurrence) => {
    input.pause(); selection.select(item.side, item.selectorId, "keyboard");
  };
  const clear = () => { selection.clear("keyboard"); selection.clear("pointer"); };
  const render = () => {
    const selected = selection.read();
    result.replaceChildren(); links.replaceChildren();
    clearButton.disabled = !selected;
    if (!selected) { chooser.value = ""; result.textContent = "Select an occurrence to trace its correspondence."; selectedFacts.textContent = ""; return; }
    chooser.value = String(occurrences.indexOf(selected.occurrence));
    addText(result, "p", title(selected.occurrence));
    for (const record of selected.records) addText(result, "p", record.summary);
    if (!selected.records.length) addText(result, "p", "No correspondence is declared for this occurrence.");
    else if (!selected.counterparts.length) addText(result, "p", selected.occurrence.side === "source"
      ? "This occurrence has no target counterpart." : "This occurrence has no source counterpart.");
    for (const counterpart of selected.counterparts) {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = `Follow ${title(counterpart).toLowerCase()}`;
      button.onclick = () => { choose(counterpart); chooser.focus(); };
      links.append(button);
    }
    selectedFacts.textContent = `Selector: ${selected.occurrence.selectorId}. Equation object: ${selected.occurrence.objectId}. Source provenance: ${selected.occurrence.provenance?.sourceIds.join(", ") ?? "not supplied"}. Relations: ${selected.records.map(record => record.relation).join(", ") || "none"}.`;
  };
  chooser.onchange = () => { const item = occurrences[Number(chooser.value)]; if (chooser.value !== "" && item) choose(item); else clear(); };
  clearButton.onclick = () => { clear(); chooser.focus(); };
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { clear(); card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!.focus(); } };
  panel.addEventListener("keydown", escape);
  const unsubscribe = selection.subscribe(render); render();
  return () => {
    unsubscribe(); panel.removeEventListener("keydown", escape);
    chooser.onchange = null; clearButton.onclick = null;
    layout.before(card); layout.remove(); root.classList.remove("kp-inspection-host");
  };
}
