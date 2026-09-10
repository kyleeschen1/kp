import { sha256 } from "../kernel/sha256.ts";
import type { KpSemanticAssetObject } from "./asset.ts";
import type { KpSemanticEquationProjection } from "./semantic-operation-projection.ts";
import { isKpVerifiedComposedGroupPartition, type KpVerifiedComposedGroupPartition } from "./composed-algebra-group-partition.ts";
import { projectKpContextualConstantSum } from "./contextual-constant-sum-projection.ts";
import { scalarEquation, scalarToken } from "./integer-multiple-equation-projection.ts";
import { projectKpStructuredScalarLatex } from "./structured-scalar-latex.ts";

const brand = Symbol("verified-equation-endpoint-handoff");
const issued = new WeakSet<object>();

/** An endpoint view exchange, not a transformation or a motion interval.
 * Only proof-owning binders mint this capability; consumers know no operation kinds. */
export interface KpVerifiedEquationEndpointHandoff {
  readonly [brand]: true;
  readonly semanticStateId: string;
  readonly revisionId: string;
  readonly source: KpSemanticEquationProjection;
  readonly target: KpSemanticEquationProjection;
  readonly coverage: readonly {
    readonly occurrenceId: string;
    readonly sourceSelectorId: string;
    readonly targetSelectorIds: readonly string[];
  }[];
}

/** The first bounded owner supports a checked binary sum inside an integer
 * multiple. There is deliberately no public unchecked map-to-capability API. */
export function bindKpComposedGroupEndpointHandoff(partition: KpVerifiedComposedGroupPartition): KpVerifiedEquationEndpointHandoff {
  if (!isKpVerifiedComposedGroupPartition(partition)) throw new TypeError("Endpoint handoff requires issued group partition evidence.");
  const evaluation = partition.evaluation;
  const source = projectKpContextualConstantSum(evaluation).endpoints[1];
  const id = `${source.object.id}.view.members`;
  const coefficient = scalarToken(id, "coefficient", String(evaluation.result.value), "factor");
  const group = [scalarToken(id, "group-open", "(", "delimiter"),
    scalarToken(id, "member-0", projectKpStructuredScalarLatex(partition.members[0], "display"), "term"),
    scalarToken(id, "group-plus", "+", "operator"),
    scalarToken(id, "member-1", projectKpStructuredScalarLatex(partition.members[1], "display"), "term"),
    scalarToken(id, "group-close", ")", "delimiter")];
  const target = scalarEquation(id, evaluation.factoring.orientation === "right" ? [coefficient, ...group] : [...group, coefficient]);
  const coverage = [
    { occurrenceId: evaluation.result.id, sourceSelectorId: `${source.object.id}.paint.result`, targetSelectorIds: [coefficient.id] },
    { occurrenceId: partition.group.id, sourceSelectorId: `${source.object.id}.paint.factor`, targetSelectorIds: group.map(token => token.id) }
  ];
  const handoff: KpVerifiedEquationEndpointHandoff = { [brand]: true, semanticStateId: source.object.id,
    source, target, coverage,
    revisionId: `sha256:${sha256(JSON.stringify({ partition: partition.revisionId, source, target, coverage }))}` };
  freeze(handoff);
  issued.add(handoff);
  return handoff;
}

export function isKpVerifiedEquationEndpointHandoff(value: unknown): value is KpVerifiedEquationEndpointHandoff {
  return typeof value === "object" && value !== null && issued.has(value);
}

/** Full endpoint snapshots remain required: equal LaTeX, IDs or revision text
 * cannot authorize different selectors, metadata, or context. */
export function createKpEquationEndpointHandoffResolver(handoffs: readonly KpVerifiedEquationEndpointHandoff[]) {
  if (!handoffs.every(isKpVerifiedEquationEndpointHandoff)) throw new TypeError("Use issued equation endpoint handoffs.");
  const candidates = [...handoffs], used = new Set<KpVerifiedEquationEndpointHandoff>();
  if (new Set(candidates).size !== candidates.length) throw new TypeError("Do not duplicate endpoint handoff capabilities.");
  const consume = (matches: readonly KpVerifiedEquationEndpointHandoff[]): boolean => {
    if (matches.length !== 1) return false;
    const match = matches[0]!;
    if (used.has(match)) throw new TypeError("An endpoint handoff cannot authorize multiple boundaries.");
    used.add(match);
    return true;
  };
  return Object.freeze({
    connect(source: KpSemanticAssetObject, target: KpSemanticAssetObject): boolean {
      const matches = candidates.filter(handoff => JSON.stringify(handoff.source.object) === JSON.stringify(source) &&
        JSON.stringify(handoff.target.object) === JSON.stringify(target));
      return consume(matches);
    },
    connectProjections(source: KpSemanticEquationProjection, target: KpSemanticEquationProjection): boolean {
      return consume(candidates.filter(handoff => JSON.stringify(handoff.source) === JSON.stringify(source) &&
        JSON.stringify(handoff.target) === JSON.stringify(target)));
    },
    finish(): void {
      if (used.size !== candidates.length) throw new TypeError("An endpoint handoff is unused, stale, or unrelated to this sequence.");
    }
  });
}

function freeze(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  // Projections freeze their shells before their contained asset objects.
  for (const child of Object.values(value)) freeze(child);
  Object.freeze(value);
}
