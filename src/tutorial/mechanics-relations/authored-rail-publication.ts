import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource } from "../../../domains/public-api.ts";
import { checkForceEnergy, forceEnergySource } from "../../../domains/physics/force-energy-derivation.ts";
import { createEnergyDerivationPlan, createForceEnergyPlan } from "../../semantic/momentum-energy-derivation-plan.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { compileMomentumEnergyPublication } from "./momentum-energy-publication.ts";
import { renderMomentumEnergyReader } from "./momentum-energy-reader-publication.ts";

export const authoredRailExample = "examples/physics/energy-as-a-function.article.md";
export const authoredRailSourceLimit = 100_000;
export interface AuthoredRailRepair {
  readonly code: "source-limit" | "unsupported-reference" | "reference-location" | "missing-reference" | "publication-repair";
  readonly line: number;
  readonly message: string;
}
export type AuthoredRailResult =
  | { readonly status: "repair"; readonly sourceId: string; readonly repair: AuthoredRailRepair }
  | { readonly status: "checked"; readonly sourceId: string; readonly sourceRevision: string;
      readonly title: string; readonly html: string; readonly railIds: readonly string[];
      readonly editorialAuthority: "author-supplied-not-proof" };

/** Build-only inclusion: source names a checked derivation, never serialized
 * correspondence or motion. Existing publication checking still verifies the
 * expanded chain against its domain owner before it reaches the reader. */
export function compileAuthoredRailPublication(text: string, sourceId: string): AuthoredRailResult {
  const repair = (code: AuthoredRailRepair["code"], line: number, message: string): AuthoredRailResult =>
    ({ status: "repair", sourceId, repair: { code, line, message } });
  if (new TextEncoder().encode(text).length > authoredRailSourceLimit)
    return repair("source-limit", 1, "Keep the Article within 100,000 UTF-8 bytes.");
  const railIds: string[] = [];
  let passage: string | undefined;
  let fence: string | undefined;
  const expanded: string[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const codeFence = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (codeFence) {
      if (!fence) fence = codeFence;
      else if (codeFence[0] === fence[0] && codeFence.length >= fence.length) fence = undefined;
    }
    if (!fence) {
      const start = /^:::kp-passage\{#([a-zA-Z0-9_.-]+)(?:\s[^}]*)?\}\s*$/.exec(line);
      if (start) passage = start[1];
      else if (/^:::\s*$/.test(line)) passage = undefined;
    }
    if (!line.includes("{{kp-derivation:")) { expanded.push(line); continue; }
    const reference = /^\s*\{\{kp-derivation:(physics\.[a-z-]+)@1\}\}\s*$/.exec(line)?.[1];
    if (reference !== "physics.energy-from-momentum" && reference !== "physics.force-to-energy")
      return repair("unsupported-reference", index + 1,
        "Use physics.energy-from-momentum@1 or physics.force-to-energy@1 on its own line; other derivations require semantic support.");
    const id = reference.slice("physics.".length);
    if (fence || passage !== id || railIds.includes(id))
      return repair("reference-location", index + 1, `Include this derivation once, inside the #${id} passage and outside code fences.`);
    try {
      const states = checkedStates(id);
      expanded.push(`$$\\begin{aligned}\n${states.join("\\\\\n")}\n\\end{aligned}$$`);
      railIds.push(id);
    } catch (error) {
      return repair("publication-repair", index + 1, error instanceof Error ? error.message : String(error));
    }
  }
  if (!railIds.length) return repair("missing-reference", 1, "Include at least one supported checked derivation.");
  try {
    const publication = compileMomentumEnergyPublication(expanded.join("\n"), undefined, undefined, sourceId);
    // This bounded authoring path supplies equation rails only. Physics-stage
    // imports require their own source and static-asset delivery contract.
    if (publication.article.document.blocks.some(block => block.kind === "stage" || block.kind === "motion"))
      return repair("publication-repair", 1, "This authoring path supports equation rails and prose, not physics motion stages.");
    for (const block of publication.article.document.blocks) {
      if (block.kind === "passage" && ["power-correspondence", "momentum-space", "momentum-move"].includes(block.id))
        return repair("publication-repair", 1, `#${block.id} selects a different physics presentation. Use an ordinary prose passage id here.`);
      if (block.kind === "passage" && ["energy-from-momentum", "force-to-energy"].includes(block.id) && !railIds.includes(block.id))
        return repair("missing-reference", 1, `Use the checked derivation reference in #${block.id}, rather than a copied equation chain.`);
    }
    const rendered = renderMomentumEnergyReader(publication);
    const sourceRevision = `sha256:${sha256(text)}`;
    return { status: "checked", sourceId, sourceRevision, title: rendered.document.title,
      html: `<div data-authored-rail-revision="${sourceRevision}">${rendered.html}</div>`,
      railIds, editorialAuthority: "author-supplied-not-proof" };
  } catch (error) {
    return repair("publication-repair", 1, error instanceof Error ? error.message : String(error));
  }
}

function checkedStates(id: string): readonly string[] {
  if (id === "energy-from-momentum") {
    const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
    if (checked.status !== "checked") throw new Error(checked.code);
    return createEnergyDerivationPlan(checked.model).view.states;
  }
  const checked = checkForceEnergy(forceEnergySource);
  if (checked.status !== "checked") throw new Error(checked.code);
  return createForceEnergyPlan(checked.model).view.states;
}
