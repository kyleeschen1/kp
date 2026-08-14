import { kpEigenvectorAttentionalFixture } from "./eigenvector-math.ts";

export type KpEigenvectorSemanticKind =
  | "transformation"
  | "vector"
  | "vector-family"
  | "eigenspace"
  | "eigenvalue"
  | "scalar"
  | "relation";

export type KpEigenvectorRepresentationKind =
  | "diagram"
  | "equation"
  | "prose"
  | "prediction"
  | "manipulation"
  | "recall-cue";

export interface KpEigenvectorSemanticRepresentation {
  readonly id: string;
  readonly kind: KpEigenvectorRepresentationKind;
  readonly semanticObjectId: string;
  readonly selector: string;
}

export interface KpEigenvectorSemanticObject {
  readonly id: string;
  readonly kind: KpEigenvectorSemanticKind;
  readonly label: string;
  readonly meaning: string;
  readonly roles: readonly string[];
  readonly representations: readonly KpEigenvectorSemanticRepresentation[];
}

const vectorId = kpEigenvectorAttentionalFixture.persistentVector.id;
const transformationId = kpEigenvectorAttentionalFixture.transformation.id;
const eigenspaceId = kpEigenvectorAttentionalFixture.invariantLine.id;

export const kpEigenvectorSemanticRegistry = [
  semanticObject({
    id: transformationId,
    kind: "transformation",
    label: "A",
    meaning: "The fixed linear transformation applied throughout the experience.",
    roles: ["context", "operator"],
    representations: [
      representation("diagram.transformation.A", "diagram", "[data-kp-object='transformation-A']"),
      representation("equation.transformation.A", "equation", "[data-kp-equation-object='transformation-A']")
    ]
  }),
  semanticObject({
    id: "eigenvector-demo/vector/fan",
    kind: "vector-family",
    label: "ordinary vectors",
    meaning: "Context vectors whose directions generally change under A.",
    roles: ["context", "contrast"],
    representations: [
      representation("diagram.vector.fan", "diagram", "[data-kp-object='vector-fan']"),
      representation("prose.vector.fan", "prose", "[data-kp-prose-object='vector-fan']")
    ]
  }),
  semanticObject({
    id: vectorId,
    kind: "vector",
    label: "v",
    meaning: "The same nonzero vector across geometry, notation, prediction, manipulation, and recall.",
    roles: ["persistent-identity", "eigenvector", "focus"],
    representations: [
      representation("diagram.vector.v", "diagram", "[data-kp-object='vector-v']"),
      representation("equation.vector.v", "equation", "[data-kp-equation-object='vector-v']"),
      representation("prose.vector.v", "prose", "[data-kp-prose-object='vector-v']"),
      representation("prediction.vector.v", "prediction", "[data-kp-prediction-object='vector-v']"),
      representation("manipulation.vector.v", "manipulation", "[data-kp-manipulation-object='vector-v']"),
      representation("recall.vector.v", "recall-cue", "[data-kp-recall-object='vector-v']")
    ]
  }),
  semanticObject({
    id: "eigenvector-demo/eigenvalue/lambda-3",
    kind: "eigenvalue",
    label: "λ = 3",
    meaning: "The scale factor recorded for A along the persistent direction.",
    roles: ["scale-factor", "definition"],
    representations: [
      representation("equation.eigenvalue.lambda", "equation", "[data-kp-equation-object='eigenvalue-lambda']"),
      representation("diagram.eigenvalue.lambda", "diagram", "[data-kp-object='eigenvalue-lambda']"),
      representation("recall.eigenvalue.lambda", "recall-cue", "[data-kp-recall-object='eigenvalue-lambda']")
    ]
  }),
  semanticObject({
    id: eigenspaceId,
    kind: "eigenspace",
    label: "span(v)",
    meaning: "The complete λ=3 eigenspace; its nonzero members are eigenvectors.",
    roles: ["invariant-line", "result"],
    representations: [
      representation("diagram.eigenspace.lambda-3", "diagram", "[data-kp-object='eigenspace-lambda-3']"),
      representation("equation.eigenspace.span-v", "equation", "[data-kp-equation-object='eigenspace-span-v']"),
      representation("manipulation.eigenspace.lambda-3", "manipulation", "[data-kp-manipulation-object='eigenspace-lambda-3']"),
      representation("recall.eigenspace.lambda-3", "recall-cue", "[data-kp-recall-object='eigenspace-lambda-3']")
    ]
  }),
  semanticObject({
    id: "eigenvector-demo/relation/Av-lambda-v",
    kind: "relation",
    label: "Av = λv",
    meaning: "The defining relation connecting the transformation, vector, and scale factor.",
    roles: ["definition", "handoff"],
    representations: [
      representation("equation.relation.Av-lambda-v", "equation", "[data-kp-equation-object='relation-Av-lambda-v']"),
      representation("recall.relation.Av-lambda-v", "recall-cue", "[data-kp-recall-object='relation-Av-lambda-v']")
    ]
  }),
  semanticObject({
    id: "eigenvector-demo/scalar/c",
    kind: "scalar",
    label: "c",
    meaning: "The learner-controlled scalar multiplying v.",
    roles: ["coefficient", "manipulation"],
    representations: [
      representation("equation.scalar.c", "equation", "[data-kp-equation-object='scalar-c']"),
      representation("manipulation.scalar.c", "manipulation", "[data-kp-manipulation-object='scalar-c']")
    ]
  }),
  semanticObject({
    id: "eigenvector-demo/scalar/lambda-c",
    kind: "scalar",
    label: "λc",
    meaning: "The output coefficient obtained by multiplying c by the eigenvalue.",
    roles: ["derived-coefficient", "result"],
    representations: [
      representation("equation.scalar.lambda-c", "equation", "[data-kp-equation-object='scalar-lambda-c']"),
      representation("manipulation.scalar.lambda-c", "manipulation", "[data-kp-manipulation-object='scalar-lambda-c']")
    ]
  })
] as const satisfies readonly KpEigenvectorSemanticObject[];

export function checkKpEigenvectorSemanticRegistry(
  registry: readonly KpEigenvectorSemanticObject[] = kpEigenvectorSemanticRegistry
): readonly string[] {
  const issues: string[] = [];
  const objectIds = new Set<string>();
  const representationIds = new Set<string>();
  for (const object of registry) {
    if (objectIds.has(object.id)) {
      issues.push(`Duplicate semantic object id ${object.id}.`);
    }
    objectIds.add(object.id);
    if (object.representations.length === 0) {
      issues.push(`Semantic object ${object.id} has no representations.`);
    }
    for (const representation of object.representations) {
      if (representation.semanticObjectId !== object.id) {
        issues.push(`Representation ${representation.id} points to ${representation.semanticObjectId}, not ${object.id}.`);
      }
      if (representationIds.has(representation.id)) {
        issues.push(`Duplicate representation id ${representation.id}.`);
      }
      representationIds.add(representation.id);
    }
  }
  return issues;
}

export function findKpEigenvectorSemanticObject(
  id: string
): KpEigenvectorSemanticObject {
  const object = kpEigenvectorSemanticRegistry.find((candidate) =>
    candidate.id === id
  );
  if (object === undefined) {
    throw new Error(`Unknown eigenvector semantic object ${id}.`);
  }
  return object;
}

function semanticObject(input: Omit<KpEigenvectorSemanticObject, "representations"> & {
  readonly representations: readonly Omit<KpEigenvectorSemanticRepresentation, "semanticObjectId">[];
}): KpEigenvectorSemanticObject {
  return {
    ...input,
    representations: input.representations.map((candidate) => ({
      ...candidate,
      semanticObjectId: input.id
    }))
  };
}

function representation(
  id: string,
  kind: KpEigenvectorRepresentationKind,
  selector: string
): Omit<KpEigenvectorSemanticRepresentation, "semanticObjectId"> {
  return { id, kind, selector };
}
