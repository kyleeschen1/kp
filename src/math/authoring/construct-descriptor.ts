export type KpSemanticConstructKind = "jacobian" | "hessian";

export type KpConstructCapabilityRequirement =
  | "differentiable-map"
  | "second-derivative-map"
  | "domain-basis"
  | "codomain-basis"
  | "symmetry-evidence";

export type KpConstructProjectionForm = "compact" | "operator" | "expanded";

export interface KpConstructChildDescriptor {
  readonly role: "compact" | "matrix" | "entry";
  readonly path: readonly string[];
  readonly cardinality: "one" | "many";
}

export interface KpConstructProjectionDescriptor {
  readonly form: KpConstructProjectionForm;
  readonly requires: readonly KpConstructCapabilityRequirement[];
}

export interface KpConstructGenerationInput {
  readonly name:
    | "source-function"
    | "parameter-order"
    | "basis-metadata"
    | "notation"
    | "symmetry-evidence";
  readonly source: "semantic-object" | "context-default" | "capability";
}

type NonEmpty<T> = readonly [T, ...T[]];

export interface KpSemanticConstructDescriptor {
  readonly kind: "semantic-construct-descriptor";
  readonly id: string;
  readonly construct: KpSemanticConstructKind;
  readonly macro: Readonly<{ id: string; version: 1 }>;
  readonly capabilityRequirements: NonEmpty<KpConstructCapabilityRequirement>;
  readonly children: NonEmpty<KpConstructChildDescriptor>;
  readonly projections: NonEmpty<KpConstructProjectionDescriptor>;
  readonly generationInputs: NonEmpty<KpConstructGenerationInput>;
}

export function createKpSemanticConstructDescriptor(
  input: Omit<KpSemanticConstructDescriptor, "kind">
): KpSemanticConstructDescriptor {
  requireText(input.id, "Construct descriptor id");
  requireText(input.macro.id, `Construct descriptor ${input.id} macro id`);
  requireNonEmpty(input.capabilityRequirements, input.id, "capabilities");
  requireNonEmpty(input.children, input.id, "children");
  requireNonEmpty(input.projections, input.id, "projections");
  requireNonEmpty(input.generationInputs, input.id, "generation inputs");
  requireUnique(input.capabilityRequirements, input.id, "capability");
  requireUnique(input.children.map(({ role }) => role), input.id, "child role");
  requireUnique(input.children.map(({ path }) => path.join(".")), input.id, "child path");
  requireUnique(input.projections.map(({ form }) => form), input.id, "projection");
  requireUnique(input.generationInputs.map(({ name }) => name), input.id, "generation input");
  requireRoles(input);

  return deepFreeze({
    kind: "semantic-construct-descriptor" as const,
    id: input.id,
    construct: input.construct,
    macro: { ...input.macro },
    capabilityRequirements: [...input.capabilityRequirements],
    children: input.children.map((child) => ({
      ...child,
      path: [...child.path]
    })),
    projections: input.projections.map((projection) => ({
      ...projection,
      requires: [...projection.requires]
    })),
    generationInputs: input.generationInputs.map((value) => ({ ...value }))
  }) as unknown as KpSemanticConstructDescriptor;
}

export const kpJacobianConstructDescriptor =
  createKpSemanticConstructDescriptor({
    id: "kp.math.construct.jacobian.v1",
    construct: "jacobian",
    macro: { id: "kp.math.macro.jacobian.v1", version: 1 },
    capabilityRequirements: [
      "differentiable-map",
      "domain-basis",
      "codomain-basis"
    ],
    children: [
      { role: "compact", path: ["compact"], cardinality: "one" },
      { role: "matrix", path: ["matrix"], cardinality: "one" },
      { role: "entry", path: ["matrix", "entries"], cardinality: "many" }
    ],
    projections: [
      { form: "compact", requires: ["differentiable-map"] },
      { form: "operator", requires: ["differentiable-map"] },
      {
        form: "expanded",
        requires: ["differentiable-map", "domain-basis", "codomain-basis"]
      }
    ],
    generationInputs: [
      { name: "source-function", source: "semantic-object" },
      { name: "parameter-order", source: "semantic-object" },
      { name: "basis-metadata", source: "capability" },
      { name: "notation", source: "context-default" }
    ]
  });

export const kpHessianConstructDescriptor =
  createKpSemanticConstructDescriptor({
    id: "kp.math.construct.hessian.v1",
    construct: "hessian",
    macro: { id: "kp.math.macro.hessian.v1", version: 1 },
    capabilityRequirements: [
      "second-derivative-map",
      "domain-basis",
      "codomain-basis",
      "symmetry-evidence"
    ],
    children: [
      { role: "compact", path: ["compact"], cardinality: "one" },
      { role: "matrix", path: ["matrix"], cardinality: "one" },
      { role: "entry", path: ["matrix", "entries"], cardinality: "many" }
    ],
    projections: [
      { form: "compact", requires: ["second-derivative-map"] },
      { form: "operator", requires: ["second-derivative-map"] },
      {
        form: "expanded",
        requires: [
          "second-derivative-map",
          "domain-basis",
          "codomain-basis",
          "symmetry-evidence"
        ]
      }
    ],
    generationInputs: [
      { name: "source-function", source: "semantic-object" },
      { name: "parameter-order", source: "semantic-object" },
      { name: "basis-metadata", source: "capability" },
      { name: "notation", source: "context-default" },
      { name: "symmetry-evidence", source: "capability" }
    ]
  });

function requireRoles(input: Omit<KpSemanticConstructDescriptor, "kind">): void {
  for (const role of ["compact", "matrix", "entry"] as const) {
    if (!input.children.some((child) => child.role === role)) {
      throw new Error(`Construct descriptor ${input.id} requires child role ${role}.`);
    }
  }
  for (const form of ["compact", "operator", "expanded"] as const) {
    if (!input.projections.some((projection) => projection.form === form)) {
      throw new Error(`Construct descriptor ${input.id} requires projection ${form}.`);
    }
  }
}

function requireNonEmpty(
  values: readonly unknown[],
  id: string,
  label: string
): void {
  if (values.length === 0) {
    throw new Error(`Construct descriptor ${id} requires ${label}.`);
  }
}

function requireUnique(values: readonly string[], id: string, label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Construct descriptor ${id} repeats a ${label}.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}
