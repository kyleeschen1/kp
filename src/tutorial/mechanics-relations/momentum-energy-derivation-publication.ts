import katex from "katex";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource, type EnergyDerivationDetail } from "../../../domains/public-api.ts";
import { compileCheckedDerivation } from "../../authoring/momentum-energy-derivation-authoring.ts";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";
import { createDerivationOutline } from "./energy-derivation-outline.ts";
import { createDerivationInspectionComposition, createDerivationRefinementMapping } from "../../animation/derivation-inspection-composition.ts";
import { momentumDependency, resolveMomentumDependency, renderMomentumDivisionDepth } from "./momentum-dependency-publication.ts";

import { assertEnergyDerivationPlan, createEnergyDerivationPlan, unfoldDerivationInspection, type EnergyDerivationPlan } from "../../semantic/momentum-energy-derivation-plan.ts";
import { createForceEnergyPlan } from "../../semantic/momentum-energy-derivation-plan.ts";
import { checkForceEnergy, forceEnergySource } from "../../../domains/physics/force-energy-derivation.ts";

export function renderForceEnergyPassage(markdown: string, revision: string) {
  const checked = checkForceEnergy(forceEnergySource);
  if (checked.status !== "checked") throw new Error(checked.code);
  return renderCheckedDerivationPassage(markdown, revision, {
    coarse: createForceEnergyPlan(checked.model), fine: createForceEnergyPlan(checked.model, "mass-refinement"), measuredInspectionLane: true
  });
}

export function renderEnergyDerivationPassage(markdown: string, publicationRevision: string) {
  const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  if (checked.status !== "checked") throw new Error(checked.code);
  const coarse = createEnergyDerivationPlan(checked.model), reference = coarse.recall!;
  return renderCheckedDerivationPassage(markdown, publicationRevision, {
    coarse, fine: createEnergyDerivationPlan(checked.model, "mass-refinement"),
    inspections: [unfoldDerivationInspection(coarse, "scale-magnitude")]
  }, `<template data-derivation-recall-template data-provenance-target="${reference.passageId}"><details data-derivation-recall><summary>Recall the momentum definition</summary>${html(resolveMomentumDependency(momentumDependency("reminder")))}${renderMomentumDivisionDepth()}<a href="#${reference.passageId}">Visit the original definition</a></details></template>
  <template data-derivation-use-template data-provenance-target="${reference.passageId}"><details data-derivation-recall><summary>Recall the momentum definition</summary>
  ${html(resolveMomentumDependency(momentumDependency("reminder")))}${renderMomentumDivisionDepth()}
  ${html(String.raw`**Use here:** replace the velocity inside the squared magnitude with the whole quotient $\mathbf p/m$. The surrounding $\tfrac12 m$ and the square stay in place. We are changing variables, not changing the energy.`)}
  <div class="energy-derivation-actions"><button type="button" data-derivation-use-result="${reference.id}">Show this substitution</button></div>
  <p data-derivation-use-status role="status" hidden></p>
  <a href="#${reference.passageId}">Visit the original definition</a></details></template>`);
}

/** A shared static record and progressive enhancement scaffold. Both plans
 * must be proof-issued; text cannot silently replace the mathematical source. */
export function renderCheckedDerivationPassage(markdown: string, publicationRevision: string,
  plans: { readonly coarse: EnergyDerivationPlan; readonly fine: EnergyDerivationPlan; readonly inspections?: readonly EnergyDerivationPlan[]; readonly measuredInspectionLane?: true }, recall = "") {
  assertEnergyDerivationPlan(plans.coarse); assertEnergyDerivationPlan(plans.fine);
  const refinement = plans.fine.view.refinement;
  const parentIndex = plans.coarse.moves.findIndex(move => `${plans.coarse.operationPrefix}.${move.id}` === refinement?.parentTransitionId);
  if (parentIndex < 0 || plans.coarse.model !== plans.fine.model ||
      plans.fine.view.states[parentIndex] !== plans.coarse.view.states[parentIndex] ||
      plans.fine.view.states.at(-1) !== plans.coarse.view.states.at(-1))
    throw new Error("Refinement requires the same checked source and outer endpoints");
  const refinements = [plans.fine, ...(plans.inspections ?? [])].map(plan => ({ plan,
    mapping: createDerivationRefinementMapping(plans.coarse, plan) }));
  const match = /\$\$\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$\$/.exec(markdown);
  if (!match || match.index === undefined) throw new Error("Energy derivation requires its source-owned aligned chain");
  const normalize = (s: string) => s.replaceAll(/\s|&|\\left|\\right/g, "").replaceAll(String.raw`\frac12`, String.raw`\frac{1}{2}`);
  const states = match[1]!.trim().replace(/\.$/, "").split(String.raw`\\`).map(s => {
    const value = normalize(s); return value.startsWith("=") ? `${plans.coarse.notation.result}${value}` : value;
  });
  if (states.length !== plans.coarse.view.states.length || states.some((s, i) => s !== normalize(plans.coarse.view.states[i]!)))
    throw new Error("Energy derivation source changed: repair the bounded semantic binding before publication");
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, strict: "ignore",
    trust: context => context.command === "\\htmlData" });
  const staticRefinement = (plan: EnergyDerivationPlan, parent: number) => {
    const fine = plan.view;
    const outline = createDerivationOutline(fine, plans.coarse.majorSteps, plans.coarse.operationPrefix);
    // The outer result already follows this disclosure in the written record.
    return fine.steps.slice(parent, parent + fine.refinement!.childOperationIds.length).map((step, offset) => `<p><strong><span data-static-transition-number>${outline[offset + parent]!.label}</span> · ${step.title}</strong></p>${html(step.cue)}${offset < fine.refinement!.childOperationIds.length - 1 ? math(fine.states[offset + parent + 1]!) : ""}`).join("");
  };
  function renderTrace(detail: EnergyDerivationDetail, selected = refinements[0]!): string {
  const plan = detail === "coarse" ? plans.coarse : selected.plan;
  const parentIndex = selected.mapping.parent;
  const parentId = plans.coarse.moves[parentIndex]!.id;
  const compiled = compileCheckedDerivation(plan);
  const endpoints = (move: (typeof compiled.moves)[number]) => `<div class="energy-derivation-endpoint" data-derivation-source>${math(move.annotated[0]!)}</div><div class="energy-derivation-endpoint" data-derivation-target>${math(move.annotated[1]!)}</div><div data-kp-editor-equation-material-layer></div>`;
  const inspection = (move: (typeof compiled.moves)[number]) => {
    const childPlan = plan.inspections?.[move.id] ?? (plan.compactInspection === "refinement" ? plans.fine : undefined);
    if (!childPlan) return endpoints(move);
    const composition = createDerivationInspectionComposition(plan, childPlan, move.index);
    const children = compileCheckedDerivation(childPlan);
    return composition.indices.map(index => `<div class="energy-derivation-stage" data-derivation-child="${index}" data-child-operation="${children.moves[index]!.id}">${endpoints(children.moves[index]!)}</div>`).join("");
  };
  const view = plan.view;
  const outline = createDerivationOutline(view, plan.majorSteps, plan.operationPrefix);
  const reason = (i: number) => {
    const step = compiled.moves[i];
    if (!step) return "";
    const node = outline[i]!;
    const parent = node.depth === 1 && node.first
      ? `<div class="energy-derivation-nested-context" data-nested-context><span>Inside step ${node.parent.label} · ${node.parent.title}</span><div class="energy-derivation-actions"><button type="button" data-refinement-collapse hidden>Collapse step ${node.parent.label}</button></div></div>` : "";
    const available = detail === "coarse" ? refinements.find(candidate => candidate.mapping.parent === i) : undefined;
    const staticDetail = available
      ? `<details data-refinement-static><summary>${available.plan === plans.fine ? plan.refinementLabel ?? "Smaller cancellation steps" : "Smaller norm-scaling steps"}</summary>${staticRefinement(available.plan, i)}</details><div class="energy-derivation-actions"><button type="button" data-refinement-expand="${step.id}"${available.plan === plans.fine ? "" : " data-refinement-norm"} hidden>Inspect smaller steps</button></div>` : "";
    const childPlan = plan.inspections?.[step.id];
    const composedReason = childPlan ? `<details data-composed-reason><summary>See the component operations</summary>${childPlan.view.steps.map((child, j) =>
      `<p><strong>${child.title}</strong></p>${html(child.cue)}${math(childPlan.view.states[j + 1]!)}${html(child.why)}`).join("")}</details>` : "";
    return `<div class="energy-derivation-interleave energy-derivation-reason" data-derivation-interleave="${i}" data-step-label="${node.label}"${node.depth === 1 ? ` data-parent-step="${node.parent.label}"` : ""} aria-label="Step ${node.label}: ${step.title}">${parent}<div class="energy-derivation-interleave-text"><strong><span data-transition-number>${node.label}</span> · ${step.title}</strong>${html(step.cue)}<details><summary>Why is this allowed?</summary>${html(step.why)}</details>${composedReason}${staticDetail}</div></div>`;
  };
  // The first destination keeps the substitution's compound fragment identity
  // for record/inspection correspondence. Later moves retain their own templates.
  return `<div class="energy-derivation" data-energy-derivation${plans.measuredInspectionLane ? ' data-measured-inspection-lane' : ''} data-refinement-parent-id="${parentId}" data-refinement-default="${plan.refinementDefault === true}" data-derivation-reading="${plan.cancellationScore.kind}" data-derivation-source-revision="${plan.sourceRevision}" data-derivation-namespace="${plan.namespace}" data-refinement-first="${selected.plan.moves[parentIndex]!.id}" data-derivation-detail="${detail}" data-derivation-revision="${publicationRevision}${detail === "coarse" ? "" : `:mass-refinement.v1:${parentId}`}">
    <p data-derivation-status role="status" hidden></p>
    <div class="energy-derivation-workspace">
    <div class="energy-derivation-chain">
      <ol class="energy-derivation-history">${view.states.map((_, i) => `<li data-derivation-row="${i}"${detail === "coarse" ? ` data-coarse-row="${i}"` : selected.mapping.rows.some(row => row.fine === i) ? ` data-coarse-row="${selected.mapping.rows.find(row => row.fine === i)!.coarse}"` : ""}${i === parentIndex ? " data-refinement-anchor" : ""}${outline[i]?.depth === 1 ? ` data-nested-step data-nested-first="${outline[i].first}" data-nested-last="${outline[i].last}"` : ""}>
        <div class="energy-derivation-equation">${math(i === 1 && plan.moves[0]!.operationKind === "substitute" ? compiled.moves[0]!.annotated[1]! : compiled.moves[i]?.annotated[0] ?? compiled.moves.at(-1)!.annotated[1]!)}</div>
        ${reason(i)}
      </li>`).join("")}</ol>
      <div class="energy-derivation-rail" data-derivation-rail aria-hidden="true" hidden>${view.states.map(() => `<span></span>`).join("")}</div>
      <div class="energy-derivation-stage" data-derivation-stage hidden></div>
      <div class="energy-derivation-scope" data-derivation-scope hidden>
        <button type="button" data-derivation-handle role="slider" aria-orientation="vertical" aria-label="Derivation lens" aria-valuemin="0" aria-valuemax="${compiled.moves.length}" aria-valuenow="0" title="Drag to follow the derivation"><span aria-hidden="true">↕</span></button>
      </div>
    </div>
    </div>
    <p class="energy-derivation-key" data-derivation-hint hidden>Drag the handle down to follow the derivation; up to retrace it.</p>
    <div class="energy-derivation-transport" data-derivation-transport hidden>
      <div class="energy-derivation-actions" role="group" aria-label="Transition playback">
        <button type="button" data-derivation-previous aria-label="Previous transition">‹ Previous</button>
        <button type="button" data-derivation-next aria-label="Next transition">Next ›</button>
      </div>
    </div>
    ${recall}
    ${compiled.moves.map(move => `<template data-derivation-template="${move.index}" data-transition-id="${move.id}">${inspection(move)}</template>`).join("")}
    ${detail === "coarse" ? refinements.map(candidate => `<template data-refinement-view="${plans.coarse.moves[candidate.mapping.parent]!.id}"${candidate.plan === plans.fine ? "" : " data-refinement-norm"}>${renderTrace("mass-refinement", candidate)}</template>`).join("") : ""}
  </div>`;
  }
  return html(markdown.slice(0, match.index)) + renderTrace("coarse") + html(markdown.slice(match.index + match[0].length));
}
