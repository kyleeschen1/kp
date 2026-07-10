import type { KpSemanticObject } from "./document.ts";

export const SEMANTIC_DERIVATION_RELATIONS = [
  "same-value",
  "same-function",
  "same-linear-map",
  "same-solution-set",
  "renderable-view",
  "sampled-approximation",
  "visual-only"
] as const;

export type SemanticDerivationRelation =
  typeof SEMANTIC_DERIVATION_RELATIONS[number];

export const SEMANTIC_DERIVATION_STATUSES = [
  "exact",
  "lossy",
  "sampled",
  "partial",
  "unsupported"
] as const;

export type SemanticDerivationStatus =
  typeof SEMANTIC_DERIVATION_STATUSES[number];

export type SemanticDeriveCapabilityLifecycle =
  | "active"
  | "planned"
  | "proposed";

export const SEMANTIC_DERIVE_CAPABILITY_IDS = [
  "expression.latex",
  "expression.graph2d",
  "expression.graph3d",
  "equation.graph2d",
  "graph2d.exact-latex",
  "graph2d.sampled-latex",
  "matrix.linear-map",
  "linear-map.matrix",
  "rotation.matrix",
  "scale.matrix"
] as const;

export type SemanticDeriveCapabilityId =
  typeof SEMANTIC_DERIVE_CAPABILITY_IDS[number];

export interface SemanticDeriveCapabilityDescriptor {
  readonly id: SemanticDeriveCapabilityId;
  readonly title: string;
  readonly sourceType: string;
  readonly targetType: string;
  readonly relation: SemanticDerivationRelation;
  readonly derivationStatus: SemanticDerivationStatus;
  readonly status: SemanticDeriveCapabilityLifecycle;
  readonly summary: string;
  readonly requiredTraits: readonly string[];
  readonly assumptions: readonly string[];
}

export interface SemanticDerivationProvenance {
  readonly capabilityId: SemanticDeriveCapabilityId;
  readonly implementationId: string;
  readonly sourceRevisionId?: string;
  readonly sourceSelectors: readonly string[];
  readonly targetSelectors: readonly string[];
  readonly assumptions: readonly string[];
}

export interface SemanticDerivationRecord {
  readonly id: string;
  readonly kind: "derive";
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly relation: SemanticDerivationRelation;
  readonly status: SemanticDerivationStatus;
  readonly provenance: SemanticDerivationProvenance;
}

export interface CreateSemanticDerivationRecordInput {
  readonly id: string;
  readonly descriptor: SemanticDeriveCapabilityDescriptor;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly sourceRevisionId?: string;
  readonly sourceSelectors?: readonly string[];
  readonly targetSelectors?: readonly string[];
  readonly assumptions?: readonly string[];
  readonly implementationId?: string;
}

export interface SemanticDerivationDiagnostic {
  readonly capabilityId: SemanticDeriveCapabilityId;
  readonly sourceObjectId: string;
  readonly reason: string;
}

export type SemanticDeriveResult =
  | {
      readonly kind: "derived";
      readonly object: KpSemanticObject;
      readonly record: SemanticDerivationRecord;
    }
  | {
      readonly kind: "unsupported";
      readonly diagnostic: SemanticDerivationDiagnostic;
    };

export const SEMANTIC_DERIVE_IMPLEMENTATION_ID = "kp.semantic-derive.v0";

export const semanticDeriveCapabilityDescriptors:
  readonly SemanticDeriveCapabilityDescriptor[] = [
    {
      id: "expression.latex",
      title: "Expression to LaTeX",
      sourceType: "expression",
      targetType: "latex-form",
      relation: "same-value",
      derivationStatus: "exact",
      status: "active",
      summary: "Derive an exact LaTeX representation from an expression AST.",
      requiredTraits: [],
      assumptions: ["expression tree is valid"]
    },
    {
      id: "expression.graph2d",
      title: "Expression to Graph2D",
      sourceType: "expression",
      targetType: "graph-2d",
      relation: "same-function",
      derivationStatus: "exact",
      status: "active",
      summary: "Derive an exact 2D graph scene from a one-variable expression.",
      requiredTraits: ["function"],
      assumptions: ["one-variable expression", "explicit x domain"]
    },
    {
      id: "expression.graph3d",
      title: "Expression to Graph3D",
      sourceType: "expression",
      targetType: "graph-3d",
      relation: "same-function",
      derivationStatus: "exact",
      status: "active",
      summary: "Derive an exact surface graph from a two-variable expression.",
      requiredTraits: ["function"],
      assumptions: ["two-variable expression", "explicit x and y domains"]
    },
    {
      id: "equation.graph2d",
      title: "Equation to Graph2D",
      sourceType: "equation",
      targetType: "graph-2d",
      relation: "same-solution-set",
      derivationStatus: "exact",
      status: "planned",
      summary:
        "Derive an exact 2D graph only when the equation classifier proves an explicit curve.",
      requiredTraits: ["classifiable equation"],
      assumptions: ["explicit 2D equation"]
    },
    {
      id: "graph2d.exact-latex",
      title: "Graph2D to exact LaTeX",
      sourceType: "graph-2d",
      targetType: "latex-form",
      relation: "same-function",
      derivationStatus: "exact",
      status: "planned",
      summary:
        "Recover LaTeX only when the graph stores exact symbolic source provenance.",
      requiredTraits: ["symbolic provenance"],
      assumptions: ["graph was derived from symbolic source"]
    },
    {
      id: "graph2d.sampled-latex",
      title: "Graph2D samples to LaTeX approximation",
      sourceType: "graph-2d",
      targetType: "latex-form",
      relation: "sampled-approximation",
      derivationStatus: "sampled",
      status: "planned",
      summary:
        "Expose sampled data or approximate fits, but must not claim exact symbolic LaTeX.",
      requiredTraits: ["sampled data"],
      assumptions: ["sampled points do not prove exact symbolic identity"]
    },
    {
      id: "matrix.linear-map",
      title: "Matrix to LinearMap",
      sourceType: "matrix",
      targetType: "linear-map",
      relation: "same-linear-map",
      derivationStatus: "exact",
      status: "planned",
      summary:
        "Derive a linear-map representation from a matrix with explicit basis provenance.",
      requiredTraits: ["rectangular matrix"],
      assumptions: ["selected basis"]
    },
    {
      id: "linear-map.matrix",
      title: "LinearMap to Matrix",
      sourceType: "linear-map",
      targetType: "matrix",
      relation: "same-linear-map",
      derivationStatus: "exact",
      status: "planned",
      summary: "Derive a matrix representation for a linear map in a selected basis.",
      requiredTraits: ["linear map"],
      assumptions: ["selected basis"]
    },
    {
      id: "rotation.matrix",
      title: "Rotation to Matrix",
      sourceType: "rotation",
      targetType: "matrix",
      relation: "same-linear-map",
      derivationStatus: "exact",
      status: "proposed",
      summary: "Derive a matrix representation for a rotation object.",
      requiredTraits: ["linear transform"],
      assumptions: ["selected basis", "angle unit"]
    },
    {
      id: "scale.matrix",
      title: "Scale to Matrix",
      sourceType: "scale",
      targetType: "matrix",
      relation: "same-linear-map",
      derivationStatus: "exact",
      status: "proposed",
      summary: "Derive a matrix representation for a scale object.",
      requiredTraits: ["linear transform"],
      assumptions: ["selected basis"]
    }
  ];

export function explainSemanticDeriveCapability(
  id: SemanticDeriveCapabilityId
): SemanticDeriveCapabilityDescriptor {
  const descriptor = semanticDeriveCapabilityDescriptors.find(
    (candidate) => candidate.id === id
  );

  if (descriptor === undefined) {
    throw new Error(`Unknown semantic derive capability ${id}.`);
  }

  return descriptor;
}

export function listSemanticDeriveCapabilitiesForType(
  sourceType: string
): readonly SemanticDeriveCapabilityDescriptor[] {
  return semanticDeriveCapabilityDescriptors.filter(
    (descriptor) => descriptor.sourceType === sourceType
  );
}

export function createSemanticDerivationRecord(
  input: CreateSemanticDerivationRecordInput
): SemanticDerivationRecord {
  const provenanceWithoutRevision = {
    capabilityId: input.descriptor.id,
    implementationId:
      input.implementationId ?? SEMANTIC_DERIVE_IMPLEMENTATION_ID,
    sourceSelectors: input.sourceSelectors ?? [],
    targetSelectors: input.targetSelectors ?? [],
    assumptions: input.assumptions ?? input.descriptor.assumptions
  };

  return {
    id: input.id,
    kind: "derive",
    sourceObjectId: input.sourceObjectId,
    targetObjectId: input.targetObjectId,
    relation: input.descriptor.relation,
    status: input.descriptor.derivationStatus,
    provenance:
      input.sourceRevisionId === undefined
        ? provenanceWithoutRevision
        : {
            ...provenanceWithoutRevision,
            sourceRevisionId: input.sourceRevisionId
          }
  };
}
