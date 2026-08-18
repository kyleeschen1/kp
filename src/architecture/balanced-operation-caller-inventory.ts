export type KpBalancedOperationCategory =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "apply-log";

export type KpBalancedOperationAuthoringExposure =
  | "canonical-equation-series"
  | "specialized-authored-program"
  | "semantic-assets-only";

export interface KpBalancedOperationCallerInventoryEntry {
  readonly id: string;
  readonly category: KpBalancedOperationCategory;
  readonly transformType: string;
  readonly semanticAuthority: {
    readonly kind:
      | "generated-definition"
      | "specialized-compiler"
      | "fragmented-semantic-assets";
    readonly id: string;
    readonly sourcePath: string;
    readonly sourceNeedle: string;
  };
  readonly lawId: string;
  readonly assumptions: readonly string[];
  readonly roles: readonly ["lhs", "rhs", "relation", "applied-operation"];
  readonly presentation: {
    readonly status: "registered" | "motif-only";
    readonly route: string;
    readonly sourcePath: string;
    readonly sourceNeedle: string;
  };
  readonly authoring: {
    readonly exposure: KpBalancedOperationAuthoringExposure;
    readonly operationId?: string | undefined;
    readonly sourcePath: string;
    readonly sourceNeedle: string;
  };
  readonly literalSourcePaths: readonly string[];
  readonly gaps: readonly string[];
}

export interface KpBalancedOperationCallerInventory {
  readonly schemaVersion: "kp.balanced-operation-caller-inventory.v1";
  readonly entries: readonly KpBalancedOperationCallerInventoryEntry[];
}

const algebraFamilyPath =
  "src/animation/symbolic-manipulation-families/algebra.ts";
const generatedDefinitionsPath =
  "src/semantic/generated-algebra-transform-definition-registry.ts";
const equationSeriesPath =
  "src/authoring/equation-series-operation-declarations.ts";
const rearrangementPath =
  "src/animation/equation-linear-rearrangement-kind.ts";
const motifDefaultsPath =
  "src/animation/motifs/equation-visual-motif-defaults.ts";
const logCompilerPath =
  "src/semantic/log-exponent-transformation-compiler.ts";
const logProgramPath =
  "src/semantic/log-exponent-authored-operations.ts";

const rawEntries = [
  entry({
    id: "balanced-operation.add",
    category: "add",
    transformType: "addBothSides",
    semanticAuthority: evidence(
      "generated-definition",
      "definition.generated.linear-solve.add-both-sides",
      generatedDefinitionsPath,
      'transformType: "addBothSides"'
    ),
    lawId: "law.equation.add-both-sides",
    assumptions: ["Adding equal quantities preserves equality."],
    presentation: presentation(
      "registered",
      "synchronized-balanced-introduction",
      rearrangementPath,
      'rearrangement("addBothSides", "balanced-introduction", false)'
    ),
    authoring: authoring(
      "canonical-equation-series",
      equationSeriesPath,
      "kpCanonicalOperationRegistry.entries.map(canonicalDeclaration)",
      "kp.algebra.add-both-sides"
    ),
    literalSourcePaths: [
      "src/animation/animation-design-diagnostics.ts",
      rearrangementPath,
      motifDefaultsPath,
      algebraFamilyPath,
      "src/semantic/both-sides-operation-registration.ts",
      "src/semantic/both-sides-operation-registrations/additive.ts",
      "src/semantic/canonical-operation-registry.ts",
      "src/semantic/generated-algebra-canonical-composition.ts",
      generatedDefinitionsPath,
      "src/semantic/generated-algebra-tutorial-fixture.ts"
    ],
    gaps: []
  }),
  entry({
    id: "balanced-operation.subtract",
    category: "subtract",
    transformType: "subtractBothSides",
    semanticAuthority: evidence(
      "generated-definition",
      "definition.generated.linear-solve.subtract-both-sides",
      generatedDefinitionsPath,
      'transformType: "subtractBothSides"'
    ),
    lawId: "law.equation.subtract-both-sides",
    assumptions: ["Subtracting equal quantities preserves equality."],
    presentation: presentation(
      "registered",
      "synchronized-balanced-introduction",
      rearrangementPath,
      'rearrangement("subtractBothSides", "balanced-introduction", true)'
    ),
    authoring: authoring(
      "canonical-equation-series",
      equationSeriesPath,
      "kpCanonicalOperationRegistry.entries.map(canonicalDeclaration)",
      "kp.algebra.subtract-both-sides"
    ),
    literalSourcePaths: [
      "src/animation/animation-design-diagnostics.ts",
      rearrangementPath,
      "src/animation/fraction-composition-visual-motifs.ts",
      motifDefaultsPath,
      "src/animation/semantic-motion-library-promotion.ts",
      algebraFamilyPath,
      "src/animation/verified-linear-problem-animation-compiler.ts",
      "src/reader/compiler/fraction-composition-preservation-manifest.ts",
      "src/semantic/algebra-trace-port-fixture.ts",
      "src/semantic/both-sides-operation-registration.ts",
      "src/semantic/both-sides-operation-registrations/additive.ts",
      "src/semantic/canonical-operation-registry.ts",
      "src/semantic/fraction-solve-macro.ts",
      "src/semantic/fractional-linear-equation-asset.ts",
      "src/semantic/generated-algebra-canonical-composition.ts",
      generatedDefinitionsPath,
      "src/semantic/generated-algebra-tutorial-fixture.ts",
      "src/semantic/linear-solve-asset.ts"
    ],
    gaps: []
  }),
  entry({
    id: "balanced-operation.multiply",
    category: "multiply",
    transformType: "multiplyBothSides",
    semanticAuthority: evidence(
      "fragmented-semantic-assets",
      "definition.symbolic.algebra.multiply-both-sides",
      algebraFamilyPath,
      'transformType: "multiplyBothSides"'
    ),
    lawId: "law.equation.multiply-both-sides",
    assumptions: [
      "Multiplying both sides preserves equality; equivalence requires a non-zero multiplier."
    ],
    presentation: presentation(
      "registered",
      "synchronized-balanced-introduction",
      rearrangementPath,
      'rearrangement("multiplyBothSides", "balanced-introduction", false)'
    ),
    authoring: authoring(
      "semantic-assets-only",
      algebraFamilyPath,
      'id: "definition.symbolic.algebra.multiply-both-sides"'
    ),
    literalSourcePaths: [
      rearrangementPath,
      "src/animation/fraction-composition-visual-motifs.ts",
      motifDefaultsPath,
      algebraFamilyPath,
      "src/reader/compiler/fraction-composition-preservation-manifest.ts",
      "src/semantic/fraction-solve-macro.ts",
      "src/semantic/fractional-linear-certified-transfer.ts",
      "src/semantic/fractional-linear-equation-asset.ts"
    ],
    gaps: [
      "Multiply-both-sides has direct semantic assets and presentation defaults but no generated transform definition, canonical operation-registry entry, or equation-series authoring declaration."
    ]
  }),
  entry({
    id: "balanced-operation.divide",
    category: "divide",
    transformType: "divideBothSides",
    semanticAuthority: evidence(
      "generated-definition",
      "definition.generated.linear-solve.divide-both-sides",
      generatedDefinitionsPath,
      'transformType: "divideBothSides"'
    ),
    lawId: "law.equation.divide-both-sides",
    assumptions: [
      "Dividing equal quantities by the same non-zero value preserves equality."
    ],
    presentation: presentation(
      "registered",
      "divide-both-sides",
      rearrangementPath,
      'rearrangement("divideBothSides", "divide-both-sides", false)'
    ),
    authoring: authoring(
      "canonical-equation-series",
      equationSeriesPath,
      "kpCanonicalOperationRegistry.entries.map(canonicalDeclaration)",
      "kp.algebra.divide-both-sides"
    ),
    literalSourcePaths: [
      "src/animation/animation-design-diagnostics.ts",
      rearrangementPath,
      "src/animation/fraction-composition-visual-motifs.ts",
      motifDefaultsPath,
      algebraFamilyPath,
      "src/animation/verified-linear-problem-animation-compiler.ts",
      "src/reader/compiler/fraction-composition-preservation-manifest.ts",
      "src/semantic/canonical-operation-registry.ts",
      "src/semantic/divide-both-sides-equation-asset.ts",
      "src/semantic/fraction-solve-macro.ts",
      "src/semantic/generated-algebra-canonical-composition.ts",
      generatedDefinitionsPath,
      "src/semantic/generated-algebra-tutorial-fixture.ts"
    ],
    gaps: []
  }),
  entry({
    id: "balanced-operation.apply-natural-log",
    category: "apply-log",
    transformType: "applyNaturalLogBothSides",
    semanticAuthority: evidence(
      "specialized-compiler",
      "transformation.log-exponent.apply-log-both-sides",
      logCompilerPath,
      'transformType: "applyNaturalLogBothSides"'
    ),
    lawId: "law.equation.apply-injective-function",
    assumptions: [
      "assumption.log-exponent.power-positive",
      "assumption.log-exponent.right-positive",
      "assumption.log-exponent.log-injective"
    ],
    presentation: presentation(
      "registered",
      "synchronized-balanced-introduction + specialized-log-envelope",
      rearrangementPath,
      'rearrangement("applyNaturalLogBothSides", "balanced-introduction", false)'
    ),
    authoring: authoring(
      "specialized-authored-program",
      logProgramPath,
      'kind: "apply-natural-log-both-sides"',
      "operation.log-exponent.apply-log-both-sides"
    ),
    literalSourcePaths: [rearrangementPath, logCompilerPath],
    gaps: [
      "Apply-log is governed inside the specialized log-exponent program but is not exposed through the tool-neutral equation-series operation registry."
    ]
  }),
  entry({
    id: "balanced-operation.divide-by-log-base",
    category: "divide",
    transformType: "divideBothSidesByLogBase",
    semanticAuthority: evidence(
      "specialized-compiler",
      "transformation.log-exponent.divide-by-log-base",
      logCompilerPath,
      'transformType: "divideBothSidesByLogBase"'
    ),
    lawId: "law.equation.divide-both-sides",
    assumptions: ["assumption.log-exponent.log-base-nonzero"],
    presentation: presentation(
      "registered",
      "specialized-log-envelope",
      "src/animation/log-exponent-operation-presentation-registry.ts",
      'id: "operation.log-exponent.divide-by-log-base"'
    ),
    authoring: authoring(
      "specialized-authored-program",
      logProgramPath,
      'kind: "divide-both-sides-by-log-base"',
      "operation.log-exponent.divide-by-log-base"
    ),
    literalSourcePaths: [logCompilerPath],
    gaps: [
      "The log-base divisor is domain-verified and cohesive, but its both-sides semantics are not yet projected through the shared equation-series authoring registry."
    ]
  })
] as const;

export function createKpBalancedOperationCallerInventory(
  entries: readonly KpBalancedOperationCallerInventoryEntry[] = rawEntries
): KpBalancedOperationCallerInventory {
  const ids = new Set<string>();
  const transforms = new Map<string, KpBalancedOperationCallerInventoryEntry>();
  entries.forEach((candidate) => {
    if (ids.has(candidate.id)) {
      throw new Error(`Duplicate balanced-operation inventory id ${candidate.id}.`);
    }
    ids.add(candidate.id);
    const prior = transforms.get(candidate.transformType);
    if (prior !== undefined) {
      throw new Error(
        `Contradictory balanced-operation authority for ${candidate.transformType}: ` +
        `${prior.id} and ${candidate.id}.`
      );
    }
    transforms.set(candidate.transformType, candidate);
    if (candidate.literalSourcePaths.length === 0) {
      throw new Error(`Balanced operation ${candidate.id} has no discovered source.`);
    }
    if (new Set(candidate.literalSourcePaths).size !==
        candidate.literalSourcePaths.length) {
      throw new Error(`Balanced operation ${candidate.id} repeats a source path.`);
    }
  });
  return Object.freeze({
    schemaVersion: "kp.balanced-operation-caller-inventory.v1" as const,
    entries: Object.freeze([...entries])
  });
}

export const kpBalancedOperationCallerInventory =
  createKpBalancedOperationCallerInventory();

function entry(
  input: Omit<KpBalancedOperationCallerInventoryEntry, "roles">
): KpBalancedOperationCallerInventoryEntry {
  return Object.freeze({
    ...input,
    roles: Object.freeze([
      "lhs",
      "rhs",
      "relation",
      "applied-operation"
    ] as const),
    assumptions: Object.freeze([...input.assumptions]),
    literalSourcePaths: Object.freeze([...input.literalSourcePaths]),
    gaps: Object.freeze([...input.gaps])
  });
}

function evidence(
  kind: KpBalancedOperationCallerInventoryEntry["semanticAuthority"]["kind"],
  id: string,
  sourcePath: string,
  sourceNeedle: string
): KpBalancedOperationCallerInventoryEntry["semanticAuthority"] {
  return Object.freeze({ kind, id, sourcePath, sourceNeedle });
}

function presentation(
  status: KpBalancedOperationCallerInventoryEntry["presentation"]["status"],
  route: string,
  sourcePath: string,
  sourceNeedle: string
): KpBalancedOperationCallerInventoryEntry["presentation"] {
  return Object.freeze({ status, route, sourcePath, sourceNeedle });
}

function authoring(
  exposure: KpBalancedOperationAuthoringExposure,
  sourcePath: string,
  sourceNeedle: string,
  operationId?: string
): KpBalancedOperationCallerInventoryEntry["authoring"] {
  return Object.freeze({
    exposure,
    sourcePath,
    sourceNeedle,
    ...(operationId === undefined ? {} : { operationId })
  });
}
