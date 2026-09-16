import { newtonianMomentumV1 as claim } from "../../../domains/public-api.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";

// Bounded build-time transclusion. Deliberately no arbitrary recursive includes,
// notation substitutions, or promotion of prose into mathematical authority.
const views = Object.freeze({
  definition: `**Definition — momentum.** Weight velocity by mass:\n\n$$${claim.premise}.$$\n\nMomentum records directed motion. Two carts at the same velocity have different momenta if their masses differ. It is not a force stored inside a cart.`,
  velocity: `Since $${claim.assumption}$, divide both sides by mass to isolate velocity:\n\n$$${claim.result}.$$\n\nThis is the same relationship solved for a different variable, not another physical law. It lets us replace velocity when momentum is the quantity we know.`,
  reminder: `**Earlier:** $${claim.premise}$. With $${claim.assumption}$, dividing by mass gives:\n\n$$${claim.result}.$$`,
  division: `Positive mass is nonzero. Multiplication by $m$ therefore has an inverse: divide every component of $m\\mathbf v$ by the same scalar to recover $\\mathbf v$. At $m=0$, this rearrangement would not be licensed. Mass need not be constant over time for this pointwise rearrangement.`,
});
export type MomentumDependencyView = keyof typeof views;
export interface MomentumDependencyReference {
  readonly concept: typeof claim.id;
  readonly version: typeof claim.version;
  readonly view: MomentumDependencyView;
}
export const momentumDependencyIntegrity = `sha256:${sha256(JSON.stringify({ claim, views }))}`;
export class MomentumDependencyRepair extends Error {
  readonly code = "physics.dependency.unsupported-reference";
}
export function resolveMomentumDependency(reference: MomentumDependencyReference): string {
  if (reference.concept !== claim.id || reference.version !== claim.version || !Object.hasOwn(views, reference.view) ||
      Object.keys(reference).some(key => !["concept", "version", "view"].includes(key)))
    throw new MomentumDependencyRepair("Unsupported momentum dependency identity, version, view or notation binding");
  return views[reference.view];
}
export function momentumDependency(view: MomentumDependencyView): MomentumDependencyReference {
  return Object.freeze({ concept: claim.id, version: claim.version, view });
}
export function renderMomentumDivisionDepth() {
  return `<details data-momentum-dependency="division"><summary>Why may we divide by mass?</summary>${html(resolveMomentumDependency(momentumDependency("division")))}</details>`;
}
export interface MomentumDependencyOccurrence {
  readonly passageId: string;
  readonly reference: MomentumDependencyReference;
  readonly integrity: string;
}

/** Resolve inside explicit passage boundaries before Article compilation, so
 * both static and interactive publications consume the same expanded record. */
export function compileMomentumDependencies(text: string) {
  const occurrences: MomentumDependencyOccurrence[] = [];
  const markdown = text.replace(/(:::kp-passage\{#([\w-]+)\}\n)([\s\S]*?)(\n:::)/g,
    (_whole, open: string, passageId: string, body: string, close: string) => {
      const resolved = body.replace(/\{\{kp-concept:([^}]+)\}\}/g, (_token, address: string) => {
        const match = /^physics\.newtonian-momentum@1\.0\.0\/(definition|velocity|reminder|division)$/.exec(address);
        if (!match) throw new MomentumDependencyRepair(`Unsupported concept include: ${address}`);
        const view = match[1] as MomentumDependencyView;
        const reference = momentumDependency(view);
        occurrences.push(Object.freeze({ passageId, reference, integrity: momentumDependencyIntegrity }));
        return resolveMomentumDependency(reference);
      });
      return open + resolved + close;
    });
  if (markdown.includes("{{kp-concept:")) throw new MomentumDependencyRepair("Concept include must resolve inside an explicit passage");
  return Object.freeze({ markdown, occurrences: Object.freeze(occurrences) });
}
