import { kpCanonicalFunctionWrapMotionProfile as wrap } from "../../animation/function-wrap-motif.ts";
import { cloneElementWithComputedStyles, makeKpMaterialOwnerInert, stripKpMaterialCloneAuthority } from "../../rendering/computed-style-clone.ts";
import { prepareFusion } from "../dot-product-passage/fusion.ts";
import type { ColumnExample } from "./model.ts";

const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const windowProgress = (t: number, start: number, end: number) => ease((t - start) / (end - start));

/** Reversible local trial: reuse optical profiles without claiming native
 * compositor certification. Original expressions remain as readable history;
 * inert contributor occurrences carry the derivation into the next line. */
export function prepareContinuity(stage: HTMLElement, layer: HTMLElement, native: ReadonlyMap<string, HTMLElement>, scene: ColumnExample) {
  const semanticIds = new Map<string, string>();
  for (const term of scene.combination.terms) term.pairs.forEach((pair, row) => {
    semanticIds.set(`factor-${term.index}-${row}`, pair.right.id);
    semanticIds.set(`entry-${term.index}-${row}`, pair.left.id);
    semanticIds.set(`scaled-${term.index}-${row}`, term.entries[row]!.id);
  });
  scene.combination.result.entries.forEach((entry, row) => semanticIds.set(`sum-${row}`, entry.id));
  const required = (key: string) => {
    const node = native.get(key);
    if (!node) throw new Error(`Column continuity requires native endpoint ${key}.`);
    return node;
  };
  const bounds = stage.getBoundingClientRect();
  const copies: HTMLElement[] = [];
  const copy = (source: HTMLElement, occurrence: string, resultId: string, sourceId?: string) => {
    const rect = source.getBoundingClientRect();
    const holder = document.createElement("span");
    holder.style.cssText = `position:absolute;left:${rect.left - bounds.left}px;top:${rect.top - bounds.top}px;width:${rect.width}px;height:${rect.height}px;`;
    holder.dataset["contributorOccurrence"] = occurrence;
    holder.dataset["resultId"] = resultId;
    if (sourceId) holder.dataset["sourceId"] = sourceId;
    const ink = cloneElementWithComputedStyles(source);
    stripKpMaterialCloneAuthority(ink); makeKpMaterialOwnerInert(holder);
    ink.style.display = "inline-block"; ink.style.transformOrigin = "center";
    holder.append(ink); layer.append(holder); copies.push(holder);
    return ink;
  };
  const evaluations: { phase: number; project: (t: number) => void; copies: HTMLElement[] }[] = [];
  const evaluation = (phase: number, operands: string[], operators: HTMLElement[], target: string) => {
    const start = copies.length;
    const result = required(target);
    const resultId = semanticIds.get(target);
    if (!resultId || operands.some(key => !semanticIds.has(key))) throw new Error(`Missing semantic evaluation relation for ${target}.`);
    result.style.display = "inline-block"; result.style.transformOrigin = "center";
    const inputs = operands.map((key, i) => copy(required(key), `${target}:input:${i}`, resultId, semanticIds.get(key)));
    const syntax = operators.map((node, i) => copy(node, `${target}:operator:${i}`, resultId));
    evaluations.push({ phase, project: prepareFusion(stage, inputs, syntax, result), copies: copies.slice(start) });
  };
  for (const term of scene.combination.terms) term.pairs.forEach((_, row) => {
    evaluation(4, [`factor-${term.index}-${row}`, `entry-${term.index}-${row}`], [required(`times-${term.index}-${row}`)], `scaled-${term.index}-${row}`);
  });
  const plus = stage.querySelector<HTMLElement>('[data-sum-operator] .katex-html');
  if (!plus) throw new Error("Column continuity requires the sum operator.");
  scene.combination.result.entries.forEach((_, row) => {
    evaluation(5, scene.combination.terms.map(term => `scaled-${term.index}-${row}`), [plus], `sum-${row}`);
  });
  const reveals = [...stage.querySelectorAll<HTMLElement>("[data-reveal]")];
  const enclosures = reveals.flatMap(shell => [...shell.querySelectorAll<HTMLElement>(".katex-html .mopen, .katex-html .mclose")].map(node => ({ shell, node, height: node.getBoundingClientRect().height })));
  return {
    materialTransitEnd: wrap.materialTransit.end,
    render(phase: number, local: number) {
      for (const { shell, node } of enclosures) {
        // Distribution already owns its source-to-target bracket reflow.
        if (phase === 3 && Number(shell.dataset["reveal"]) <= 3) continue;
        node.style.transform = ""; node.style.opacity = "1";
      }
      for (const evaluation of evaluations) {
        const active = phase === evaluation.phase;
        evaluation.project(phase < evaluation.phase ? 0 : active ? local : 1);
        for (const holder of evaluation.copies) holder.style.opacity = active && local > 0 && local < 1 ? "1" : "0";
      }
      if (![1, 2, 4, 5].includes(phase) || local === 1) return;
      for (const shell of reveals) {
        if (Number(shell.dataset["reveal"]) !== phase) continue;
        const hasEntries = shell.querySelector("[data-kp-comb-key]");
        const hasEnclosure = shell.querySelector(".katex-html .mopen");
        // Syntax has its own reception window; never switch an entire line on.
        shell.style.opacity = hasEntries || hasEnclosure ? "1" : String(windowProgress(local, wrap.syntaxResolution.start, wrap.syntaxResolution.end));
      }
      if (phase === 1 || phase === 2) {
        for (const [key, node] of native) {
          if (phase === 1 && key.startsWith("column-")) node.style.opacity = local >= wrap.materialTransit.end ? "1" : "0";
          if (phase === 2 && key.startsWith("weight-")) node.style.opacity = "0";
        }
      }
      for (const { shell, node, height } of enclosures) {
        if (Number(shell.dataset["reveal"]) !== phase) continue;
        // Evaluation finishes before its result enclosure settles around it.
        const t = phase === 1 ? windowProgress(local, wrap.enclosureReception.start, wrap.enclosureReception.end) : windowProgress(local, .72, 1);
        const side = node.classList.contains("mopen") ? -1 : 1;
        node.style.display = "inline-block"; node.style.transformOrigin = "center";
        node.style.opacity = String(t);
        node.style.transform = `translateX(${side * height * .42 * (1 - t)}px) scale(${1 + (wrap.enclosureReception.initialScale - 1) * (1 - t)})`;
      }
    },
    dispose() {
      for (const holder of copies) holder.remove();
      for (const { node } of enclosures) { node.style.transform = ""; node.style.opacity = "1"; }
      for (const node of native.values()) node.style.clipPath = "";
    }
  };
}
