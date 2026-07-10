import type { SemanticDeriveCapabilityId } from "./derive-protocols.ts";
import type {
  Curve2DObject,
  Graph2DObject,
  GraphLatexProvenance,
  GraphSceneObject
} from "./graph.ts";

export type GraphLatexDerivation =
  | ExactGraphLatexDerivation
  | SampledGraphLatexDerivation;

export interface ExactGraphLatexDerivation {
  readonly kind: "exact";
  readonly descriptorId: Extract<
    SemanticDeriveCapabilityId,
    "graph2d.exact-latex"
  >;
  readonly graphId: string;
  readonly latex: string;
  readonly sourceObjectIds: readonly string[];
  readonly provenance: readonly GraphLatexProvenance[];
}

export interface SampledGraphLatexDerivation {
  readonly kind: "sampled";
  readonly descriptorId: Extract<
    SemanticDeriveCapabilityId,
    "graph2d.sampled-latex"
  >;
  readonly graphId: string;
  readonly reason: string;
  readonly sourceObjectIds: readonly string[];
}

export function deriveGraphLatexFromScene(
  objects: readonly GraphSceneObject[],
  graphId: string
): GraphLatexDerivation {
  const graph = objects.find(
    (object): object is Graph2DObject =>
      object.type === "graph-2d" && object.id === graphId
  );

  if (graph === undefined) {
    throw new Error(`Cannot derive LaTeX for unknown 2D graph ${graphId}.`);
  }

  const curves = objects.filter(
    (object): object is Curve2DObject =>
      object.type === "curve-2d" && object.graphId === graph.id
  );
  const sourceObjectIds = curves.map((curve) => curve.id);
  const provenance = curves.flatMap((curve) =>
    curve.latexProvenance?.kind === "exact"
      ? [curve.latexProvenance]
      : []
  );

  if (curves.length === 0 || provenance.length !== curves.length) {
    return {
      kind: "sampled",
      descriptorId: "graph2d.sampled-latex",
      graphId: graph.id,
      reason:
        "Graph LaTeX is sampled because at least one curve lacks exact LaTeX provenance.",
      sourceObjectIds
    };
  }

  return {
    kind: "exact",
    descriptorId: "graph2d.exact-latex",
    graphId: graph.id,
    latex: combineGraphLatex(provenance.map((record) => record.latex)),
    sourceObjectIds,
    provenance
  };
}

function combineGraphLatex(latexValues: readonly string[]): string {
  return latexValues.length === 1
    ? latexValues[0] ?? ""
    : String.raw`\begin{aligned}${latexValues.join(String.raw`\\`)}\end{aligned}`;
}
