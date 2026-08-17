import {
  createKpLlmSemanticMotionOperationCatalog,
  type KpLlmPromotedOperationAuthoringDefinition
} from "../animation/llm-semantic-motion-operation-authoring.ts";
import { kpHomomorphicCrossoverCallerDeclarations } from
  "../animation/homomorphic-crossover-caller-declarations.ts";
import { createKpHomomorphicCrossoverAuthoringOperations } from
  "./homomorphic-crossover-authoring.ts";
import {
  kpWaveAEquationOperationPlanDeclarations,
  kpWaveBEquationStructuralDeclarations,
  kpWaveCEquationDispositionDeclarations,
  projectKpEquationSurfaceFamily,
  type KpDeclaredEquationMigrationWave,
  type KpDeclaredEquationSurfaceDisposition,
  type KpEquationOperationPlanRecipeId,
  type KpEquationPresentationRoute,
  type KpEquationStructuralRecipeId
} from "../domain-ir/equation-surface-family-declarations.ts";

export type KpEquationLlmRecipeId =
  | KpEquationOperationPlanRecipeId
  | KpEquationStructuralRecipeId
  | "recipe.equation.homomorphic-decomposition.v1";

export type KpEquationLlmSurfaceAuthoringStatus =
  | "promoted"
  | "visual-checkpoint-pending"
  | "diagnostic-only"
  | "static-only"
  | "retirement-only";

export type KpEquationLlmSurfaceTrait =
  | "operation-plan"
  | "structural-recipe"
  | "native-adapter"
  | "semantic-transition"
  | "static-transition"
  | "diagnostic-transition"
  | "negative-fixture"
  | "runtime-bound"
  | "material-continuity"
  | "explanation-projection"
  | "structural-augmentation";

export interface KpEquationLlmSurfaceDefinition {
  readonly animationId: string;
  readonly migrationWave: KpDeclaredEquationMigrationWave;
  readonly disposition: KpDeclaredEquationSurfaceDisposition;
  readonly presentationRoute: KpEquationPresentationRoute;
  readonly authoringStatus: KpEquationLlmSurfaceAuthoringStatus;
  readonly traits: readonly KpEquationLlmSurfaceTrait[];
  readonly recipeIds: readonly KpEquationLlmRecipeId[];
  readonly exampleSourcePaths: readonly string[];
  readonly selectionAuthority: {
    readonly recipe: "kp-compiler";
    readonly presentation: "kp-renderer";
  };
}

export interface KpEquationLlmRecipeDefinition {
  readonly recipeId: KpEquationLlmRecipeId;
  readonly kind: "operation-plan" | "structural-recipe";
  readonly callerAnimationIds: readonly string[];
  readonly ownerSourcePaths: readonly string[];
  readonly selectionAuthority: "kp-compiler";
}

export type KpEquationLlmRepairCode =
  | "equation-llm.request.type"
  | "equation-llm.surface.unknown"
  | "equation-llm.surface.not-promoted"
  | "equation-llm.surface-operation.mismatch"
  | "equation-llm.operation.unknown"
  | "equation-llm.role.missing"
  | "equation-llm.role.unknown"
  | "equation-llm.role.cardinality"
  | "equation-llm.entity.unresolved"
  | "equation-llm.explanation-depth.invalid"
  | "equation-llm.field.forbidden";

export interface KpEquationLlmRepairDiagnostic {
  readonly code: KpEquationLlmRepairCode;
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export interface KpEquationLlmEntityClosureDiagnostic
  extends KpEquationLlmRepairDiagnostic {
  readonly code: "equation-llm.entity.unresolved";
  readonly entityId: string;
  readonly roleId: string;
  readonly bindingIndex: number;
}

export interface KpEquationLlmAuthoringRequest {
  readonly animationId: string;
  readonly operation: {
    readonly operationId: string;
    readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  };
  readonly explanationDepth: "compact" | "standard" | "expanded";
  readonly teachingIntent?: string | undefined;
}

export interface KpEquationLlmAuthoringCatalogue {
  readonly kind: "kp-equation-llm-authoring-catalogue";
  readonly schemaVersion: "kp.equation-llm-authoring-catalogue.v1";
  readonly authoringRule:
    "models-author-semantics-kp-selects-recipes-presentation-and-motion";
  readonly allowedAuthoringConcepts: readonly [
    "semantic-operation",
    "semantic-role-bindings",
    "semantic-lineage",
    "teaching-intent",
    "explanation-depth"
  ];
  readonly surfaces: readonly KpEquationLlmSurfaceDefinition[];
  readonly recipes: readonly KpEquationLlmRecipeDefinition[];
  readonly operations: readonly KpLlmPromotedOperationAuthoringDefinition[];
  readonly examples: readonly {
    readonly id: string;
    readonly summary: string;
    readonly request: KpEquationLlmAuthoringRequest;
  }[];
  readonly prohibitedAuthoringFields: readonly string[];
  readonly repairCodes: readonly KpEquationLlmRepairCode[];
}

export type KpEquationLlmAuthoringRequestResult =
  | {
      readonly status: "accepted";
      readonly request: KpEquationLlmAuthoringRequest;
      readonly surface: KpEquationLlmSurfaceDefinition;
      readonly operation: KpLlmPromotedOperationAuthoringDefinition;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationLlmRepairDiagnostic[];
    };

const repairCodes: readonly KpEquationLlmRepairCode[] = Object.freeze([
  "equation-llm.request.type",
  "equation-llm.surface.unknown",
  "equation-llm.surface.not-promoted",
  "equation-llm.surface-operation.mismatch",
  "equation-llm.operation.unknown",
  "equation-llm.role.missing",
  "equation-llm.role.unknown",
  "equation-llm.role.cardinality",
  "equation-llm.entity.unresolved",
  "equation-llm.explanation-depth.invalid",
  "equation-llm.field.forbidden"
]);

const authoringExamples = Object.freeze([
  Object.freeze({
    id: "example.equation.wrap-function",
    summary:
      "Name semantic wrapper roles; the compiler selects the shared function-wrap recipe and motion.",
    request: Object.freeze({
      animationId: "animation.generated.function-wrap.apply-f",
      operation: Object.freeze({
        operationId: "kp.algebra.wrap-function",
        roleBindings: Object.freeze({
          "content-before": Object.freeze(["source.x"]),
          "content-after": Object.freeze(["target.x"]),
          wrapper: Object.freeze([
            "target.function",
            "target.open-parenthesis",
            "target.close-parenthesis"
          ])
        })
      }),
      explanationDepth: "standard" as const,
      teachingIntent: "Show the function receiving and enclosing its argument."
    })
  }),
  Object.freeze({
    id: "example.equation.matrix-vector",
    summary:
      "Name rows, components, products, and results; KP owns traversal and accumulation.",
    request: Object.freeze({
      animationId: "animation.generated.linear-algebra.matrix-vector.two-by-two",
      operation: Object.freeze({
        operationId: "kp.semantic-motion.matrix-vector",
        roleBindings: Object.freeze({
          "matrix-rows": Object.freeze(["source.row.0", "source.row.1"]),
          "vector-components": Object.freeze([
            "source.vector.0",
            "source.vector.1"
          ]),
          "row-products": Object.freeze([
            "target.row-product.0",
            "target.row-product.1"
          ]),
          "result-entries": Object.freeze([
            "target.result.0",
            "target.result.1"
          ])
        })
      }),
      explanationDepth: "expanded" as const,
      teachingIntent: "Expose how each matrix row produces one result entry."
    })
  })
]);

const forbiddenAuthoringKey =
  /^(?:bounds|className|computedStyle|css|dataset|dom|fragments?|geometry|html|paint|pixels?|coordinates?|rect|svg|x|y|z|path|motionPath|keyframes?|trajectory|timing|timingTable|durationMs|delayMs|staggerMs|primitiveId|motionPrimitive|easing|bezier|spring|styles?|font|typography|transform|translate|scale|rotate|opacity|shadow|zIndex|renderer|renderTarget|selectorId|recipeId|presentationRoute)$/i;

export function createKpEquationLlmAuthoringCatalogue():
KpEquationLlmAuthoringCatalogue {
  const operationCatalogue = createKpLlmSemanticMotionOperationCatalog();
  const surfaces = createSurfaceDefinitions();
  const operations = Object.freeze([
    ...operationCatalogue.operations,
    ...createKpHomomorphicCrossoverAuthoringOperations()
  ]);
  assertUniqueIds(operations.map(({ operationId }) => operationId), "operation");
  return Object.freeze({
    kind: "kp-equation-llm-authoring-catalogue" as const,
    schemaVersion: "kp.equation-llm-authoring-catalogue.v1" as const,
    authoringRule:
      "models-author-semantics-kp-selects-recipes-presentation-and-motion" as const,
    allowedAuthoringConcepts: Object.freeze([
      "semantic-operation",
      "semantic-role-bindings",
      "semantic-lineage",
      "teaching-intent",
      "explanation-depth"
    ] as const),
    surfaces,
    recipes: createRecipeDefinitions(surfaces),
    operations,
    examples: authoringExamples,
    prohibitedAuthoringFields: operationCatalogue.prohibitedAuthoringFields,
    repairCodes
  });
}

export function validateKpEquationLlmAuthoringRequest(
  value: unknown,
  catalogue = createKpEquationLlmAuthoringCatalogue()
): KpEquationLlmAuthoringRequestResult {
  const diagnostics: KpEquationLlmRepairDiagnostic[] = [];
  if (!isRecord(value)) {
    return repairRequired([diagnostic(
      "equation-llm.request.type",
      "$",
      "Equation authoring input must be an object.",
      "Provide an animationId, semantic operation, role bindings, and explanation depth."
    )]);
  }
  rejectForbiddenFields(value, diagnostics);
  const animationId = typeof value["animationId"] === "string"
    ? value["animationId"]
    : "";
  const surface = catalogue.surfaces.find((entry) =>
    entry.animationId === animationId
  );
  if (surface === undefined) {
    diagnostics.push(diagnostic(
      "equation-llm.surface.unknown",
      "$.animationId",
      `Unknown equation surface ${animationId || "<missing>"}.`,
      "Choose an animationId from catalogue.surfaces."
    ));
  } else if (surface.authoringStatus !== "promoted") {
    diagnostics.push(diagnostic(
      "equation-llm.surface.not-promoted",
      "$.animationId",
      `${surface.animationId} is ${surface.authoringStatus}, not model-authorable.`,
      "Choose a promoted surface or request human promotion of this surface first."
    ));
  }
  const operationInput = isRecord(value["operation"])
    ? value["operation"]
    : undefined;
  const operationId = typeof operationInput?.["operationId"] === "string"
    ? operationInput["operationId"] as string
    : "";
  const operation = catalogue.operations.find((entry) =>
    entry.operationId === operationId
  );
  if (operation === undefined) {
    diagnostics.push(diagnostic(
      "equation-llm.operation.unknown",
      "$.operation.operationId",
      `Unknown promoted operation ${operationId || "<missing>"}.`,
      "Choose an operationId from catalogue.operations."
    ));
  } else {
    validateRoleBindings(operationInput?.["roleBindings"], operation, diagnostics);
    const governedOperations = surface === undefined
      ? []
      : catalogue.operations.filter(({ extensionAuthority }) =>
          extensionAuthority?.callerIds.includes(surface.animationId) === true
        );
    if (
      governedOperations.length > 0 &&
      !governedOperations.some(({ operationId: allowed }) => allowed === operationId)
    ) {
      diagnostics.push(diagnostic(
        "equation-llm.surface-operation.mismatch",
        "$.operation.operationId",
        `${animationId} does not declare ${operationId}.`,
        `Use ${governedOperations.map(({ operationId: allowed }) => allowed).join(" or ")}.`
      ));
    }
  }
  if (!["compact", "standard", "expanded"].includes(
    String(value["explanationDepth"])
  )) {
    diagnostics.push(diagnostic(
      "equation-llm.explanation-depth.invalid",
      "$.explanationDepth",
      "Explanation depth must be compact, standard, or expanded.",
      "Choose the smallest explanation depth that serves the teaching intent."
    ));
  }
  if (diagnostics.length > 0 || surface === undefined || operation === undefined) {
    return repairRequired(diagnostics);
  }
  return {
    status: "accepted",
    request: value as unknown as KpEquationLlmAuthoringRequest,
    surface,
    operation,
    diagnostics: []
  };
}

/**
 * Role shape and entity closure are separate because the lightweight catalogue
 * does not load every animation asset. A compiler facade must run this check
 * after resolving the selected surface's canonical semantic vocabulary.
 */
export function validateKpEquationLlmEntityClosure(input: {
  readonly request: KpEquationLlmAuthoringRequest;
  readonly availableEntityIds: readonly string[];
}): readonly KpEquationLlmEntityClosureDiagnostic[] {
  const available = new Set(input.availableEntityIds);
  const diagnostics: KpEquationLlmEntityClosureDiagnostic[] = [];
  for (const [roleId, entityIds] of Object.entries(
    input.request.operation.roleBindings
  )) {
    entityIds.forEach((entityId, bindingIndex) => {
      if (available.has(entityId)) return;
      diagnostics.push(Object.freeze({
        code: "equation-llm.entity.unresolved" as const,
        path: `$.operation.roleBindings.${roleId}[${bindingIndex}]`,
        message:
          `Semantic entity ${entityId} is unavailable on ` +
          `${input.request.animationId}.`,
        repair:
          "Choose an entity id from the selected surface's canonical semantic vocabulary.",
        entityId,
        roleId,
        bindingIndex
      }));
    });
  }
  return Object.freeze(diagnostics);
}

function createSurfaceDefinitions(): readonly KpEquationLlmSurfaceDefinition[] {
  return Object.freeze([
    ...kpWaveAEquationOperationPlanDeclarations.map((entry) => {
      const projection = projectKpEquationSurfaceFamily(entry.animationId);
      return surface({
        animationId: entry.animationId,
        migrationWave: projection.migrationWave,
        disposition: projection.disposition,
        presentationRoute: projection.presentationRoute,
        authoringStatus: "promoted",
        traits: [
          "operation-plan",
          ...(entry.runtimeBindingIds.length > 0 ? ["runtime-bound" as const] : []),
          ...(entry.materialContinuityId === undefined
            ? []
            : ["material-continuity" as const])
        ],
        recipeIds: entry.recipeIds,
        exampleSourcePaths: entry.recipeOwnerPaths
      });
    }),
    ...kpWaveBEquationStructuralDeclarations.map((entry) => {
      const projection = projectKpEquationSurfaceFamily(entry.animationId);
      return surface({
        animationId: entry.animationId,
        migrationWave: projection.migrationWave,
        disposition: projection.disposition,
        presentationRoute: projection.presentationRoute,
        authoringStatus: "promoted",
        traits: [
          "structural-recipe",
          ...(entry.materialContinuityId === undefined
            ? []
            : ["material-continuity" as const]),
          ...(entry.explanationProjectionId === undefined
            ? []
            : ["explanation-projection" as const]),
          ...(entry.structuralAugmentationId === undefined
            ? []
            : ["structural-augmentation" as const])
        ],
        recipeIds: entry.recipeIds,
        exampleSourcePaths: entry.recipeOwnerPaths
      });
    }),
    ...kpWaveCEquationDispositionDeclarations.map((entry) => {
      const projection = projectKpEquationSurfaceFamily(entry.animationId);
      return surface({
        animationId: entry.animationId,
        migrationWave: projection.migrationWave,
        disposition: projection.disposition,
        presentationRoute: projection.presentationRoute,
        authoringStatus: waveCAuthoringStatus(entry.classification),
        traits: [presentationTrait(entry.presentationRoute)],
        recipeIds: [],
        exampleSourcePaths: [entry.authoritySourcePath]
      });
    })
  ].map(promoteRegisteredHomomorphicCaller));
}

function promoteRegisteredHomomorphicCaller(
  candidate: KpEquationLlmSurfaceDefinition
): KpEquationLlmSurfaceDefinition {
  const declaration = kpHomomorphicCrossoverCallerDeclarations.find(
    ({ callerId }) => callerId === candidate.animationId
  );
  if (declaration === undefined) return candidate;
  return surface({
    animationId: candidate.animationId,
    migrationWave: candidate.migrationWave,
    disposition: candidate.disposition,
    presentationRoute: candidate.presentationRoute,
    authoringStatus: "promoted",
    traits: [...candidate.traits, "semantic-transition"],
    recipeIds: [
      ...candidate.recipeIds,
      declaration.recipeId
    ],
    exampleSourcePaths: candidate.exampleSourcePaths
  });
}

function createRecipeDefinitions(
  surfaces: readonly KpEquationLlmSurfaceDefinition[]
): readonly KpEquationLlmRecipeDefinition[] {
  const recipeIds = [...new Set(surfaces.flatMap((entry) => entry.recipeIds))];
  return Object.freeze(recipeIds.map((recipeId) => {
    const callers = surfaces.filter((entry) => entry.recipeIds.includes(recipeId));
    return Object.freeze({
      recipeId,
      kind: recipeId.startsWith("recipe.operation-plan.")
        ? "operation-plan" as const
        : "structural-recipe" as const,
      callerAnimationIds: Object.freeze(callers.map((entry) => entry.animationId)),
      ownerSourcePaths: Object.freeze(recipeId ===
        "recipe.equation.homomorphic-decomposition.v1"
        ? ["src/authoring/homomorphic-crossover-authoring.ts"]
        : [...new Set(callers.flatMap((entry) => entry.exampleSourcePaths))]),
      selectionAuthority: "kp-compiler" as const
    });
  }));
}

function surface(
  input: Omit<KpEquationLlmSurfaceDefinition, "selectionAuthority">
): KpEquationLlmSurfaceDefinition {
  return Object.freeze({
    ...input,
    traits: Object.freeze([...input.traits]),
    recipeIds: Object.freeze([...input.recipeIds]),
    exampleSourcePaths: Object.freeze([...input.exampleSourcePaths]),
    selectionAuthority: Object.freeze({
      recipe: "kp-compiler" as const,
      presentation: "kp-renderer" as const
    })
  });
}

function waveCAuthoringStatus(
  classification: "generated-bespoke" | "diagnostic" | "static-only" |
    "unsupported" | "retirement-candidate"
): KpEquationLlmSurfaceAuthoringStatus {
  const statuses = {
    "generated-bespoke": "visual-checkpoint-pending",
    diagnostic: "diagnostic-only",
    "static-only": "static-only",
    unsupported: "static-only",
    "retirement-candidate": "retirement-only"
  } as const;
  return statuses[classification];
}

function presentationTrait(
  route: KpEquationPresentationRoute
): KpEquationLlmSurfaceTrait {
  const traits: Readonly<Record<KpEquationPresentationRoute,
  KpEquationLlmSurfaceTrait>> = {
    "declared-operation-plan": "operation-plan",
    "declared-structural-recipe": "structural-recipe",
    "specialized-native-adapter": "native-adapter",
    "declared-semantic-transition": "semantic-transition",
    "declared-static-layer-transition": "static-transition",
    "declared-diagnostic-transition": "diagnostic-transition",
    "retirement-negative-fixture": "negative-fixture",
    "unsupported-static-hold": "static-transition"
  };
  return traits[route];
}

function validateRoleBindings(
  value: unknown,
  operation: KpLlmPromotedOperationAuthoringDefinition,
  diagnostics: KpEquationLlmRepairDiagnostic[]
): void {
  const bindings = isRecord(value) ? value : {};
  operation.roles.forEach((role) => {
    const bound = Array.isArray(bindings[role.id])
      ? bindings[role.id] as readonly unknown[]
      : [];
    const count = bound.length;
    const valid = role.cardinality === "exactly-one"
      ? count === 1
      : role.cardinality === "zero-or-one"
        ? count <= 1
        : count >= 1;
    if (!valid) {
      diagnostics.push(diagnostic(
        count === 0 ? "equation-llm.role.missing" :
          "equation-llm.role.cardinality",
        `$.operation.roleBindings.${role.id}`,
        `${operation.operationId} role ${role.id} requires ${role.cardinality}; received ${count}.`,
        `Bind ${role.id} to ${role.cardinality} semantic entity references.`
      ));
    }
  });
  Object.keys(bindings)
    .filter((roleId) => !operation.roles.some((role) => role.id === roleId))
    .forEach((roleId) => diagnostics.push(diagnostic(
      "equation-llm.role.unknown",
      `$.operation.roleBindings.${roleId}`,
      `${operation.operationId} does not declare role ${roleId}.`,
      "Remove the role or choose one of the operation's declared roles."
    )));
}

function rejectForbiddenFields(
  value: unknown,
  diagnostics: KpEquationLlmRepairDiagnostic[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectForbiddenFields(item, diagnostics, `${path}[${index}]`)
    );
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    if (forbiddenAuthoringKey.test(key)) {
      diagnostics.push(diagnostic(
        "equation-llm.field.forbidden",
        `${path}.${key}`,
        `${key} is owned by the KP compiler or renderer.`,
        "Remove the presentation instruction and express only semantic intent."
      ));
    }
    rejectForbiddenFields(child, diagnostics, `${path}.${key}`);
  });
}

function diagnostic(
  code: KpEquationLlmRepairCode,
  path: string,
  message: string,
  repair: string
): KpEquationLlmRepairDiagnostic {
  return { code, path, message, repair };
}

function repairRequired(
  diagnostics: readonly KpEquationLlmRepairDiagnostic[]
): KpEquationLlmAuthoringRequestResult {
  return { status: "repair-required", diagnostics };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertUniqueIds(ids: readonly string[], label: string): void {
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) {
    throw new Error(`Duplicate equation authoring ${label} id ${duplicate}.`);
  }
}
