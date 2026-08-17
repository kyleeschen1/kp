import {
  createKpEquationLlmAuthoringCatalogue,
  validateKpEquationLlmAuthoringRequest,
  type KpEquationLlmAuthoringRequest
} from "./equation-llm-authoring-catalogue.ts";

export type KpEquationGenerationPressureScenario =
  | "function-wrap"
  | "cancellation"
  | "distribution-factoring"
  | "log-product-binary"
  | "log-product-three-factor"
  | "log-quotient";

export type KpEquationGenerationProofId =
  | "catalogue-accepted"
  | "canonical-authority-compiled"
  | "native-endpoints-preserved"
  | "direct-seek-equivalent"
  | "visual-substitution-absent"
  | "presentation-authorship-absent";

export interface KpEquationGenerationPressureFixture {
  readonly schemaVersion: "kp.equation-generation-pressure-fixture.v1";
  readonly id: string;
  readonly scenario: KpEquationGenerationPressureScenario;
  readonly request: KpEquationLlmAuthoringRequest;
  readonly allowedVocabulary: {
    readonly animationId: string;
    readonly operationId: string;
    readonly roleIds: readonly string[];
    readonly explanationDepths: readonly ["compact", "standard", "expanded"];
  };
  readonly successCriteria: {
    readonly firstPassStatus: "accepted";
    readonly maximumRepairCount: 0;
    readonly requiredProofIds: readonly KpEquationGenerationProofId[];
  };
  readonly repairAccounting: {
    readonly unit: "validator-round";
    readonly countFrom: "initial-request";
    readonly recordDiagnosticCodes: true;
    readonly recordChangedSemanticFields: true;
  };
}

export interface KpEquationGenerationPressureCorpus {
  readonly id: string;
  readonly fixtureIds: readonly string[];
}

export type KpEquationGenerationPressureIssueCode =
  | "pressure.fixture.shape"
  | "pressure.fixture.identity"
  | "pressure.fixture.vocabulary"
  | "pressure.fixture.request"
  | "pressure.fixture.criteria";

export interface KpEquationGenerationPressureIssue {
  readonly code: KpEquationGenerationPressureIssueCode;
  readonly path: string;
  readonly message: string;
}

const logProductRoleIds = Object.freeze([
  "source-application",
  "target-applications",
  "source-operator",
  "target-operators",
  "source-arguments",
  "target-arguments",
  "source-shells",
  "target-shells",
  "source-product",
  "target-sum",
  "connector"
]);

function logProductPressureBindings(
  factorNames: readonly [string, string, ...string[]]
): Readonly<Record<string, readonly string[]>> {
  return Object.freeze({
    "source-application": Object.freeze(["source.application"]),
    "target-applications": Object.freeze(factorNames.map((name) =>
      `target.application.${name}`
    )),
    "source-operator": Object.freeze(["source.operator"]),
    "target-operators": Object.freeze(factorNames.map((name) =>
      `target.operator.${name}`
    )),
    "source-arguments": Object.freeze(factorNames.map((name) =>
      `source.argument.${name}`
    )),
    "target-arguments": Object.freeze(factorNames.map((name) =>
      `target.argument.${name}`
    )),
    "source-shells": Object.freeze(["source.open", "source.close"]),
    "target-shells": Object.freeze(factorNames.flatMap((name) => [
      `target.open.${name}`,
      `target.close.${name}`
    ])),
    "source-product": Object.freeze(["source.product"]),
    "target-sum": Object.freeze(["target.sum"]),
    connector: Object.freeze(factorNames.slice(1).map((_, index) =>
      `target.connector.${index}`
    ))
  });
}

export const kpEquationGenerationPressureFixtures = Object.freeze([
  pressureFixture({
    id: "pressure.equation.function-wrap",
    scenario: "function-wrap",
    animationId: "animation.generated.function-wrap.apply-f",
    operationId: "kp.algebra.wrap-function",
    roleIds: ["content-before", "content-after", "wrapper"],
    roleBindings: {
      "content-before": ["source.argument.x"],
      "content-after": ["target.argument.x"],
      wrapper: [
        "target.function.f",
        "target.enclosure.open",
        "target.enclosure.close"
      ]
    },
    teachingIntent: "Show one persistent argument being received by a function."
  }),
  pressureFixture({
    id: "pressure.equation.cancellation",
    scenario: "cancellation",
    animationId: "animation.generated.cancellation.additive-inverses",
    operationId: "kp.algebra.cancel-additive-inverses",
    roleIds: ["context-before", "inverse-terms", "context-after"],
    roleBindings: {
      "context-before": ["source.context.equation"],
      "inverse-terms": ["source.term.positive-three", "source.term.negative-three"],
      "context-after": ["target.context.equation"]
    },
    teachingIntent: "Show opposite-side inverse terms meeting and annihilating."
  }),
  pressureFixture({
    id: "pressure.equation.distribution-factoring",
    scenario: "distribution-factoring",
    animationId: "animation.generated.distribution.expand-a-sum",
    operationId: "kp.algebra.distribute-multiplication",
    roleIds: [
      "factor-before",
      "addends-before",
      "factor-copies",
      "products-after"
    ],
    roleBindings: {
      "factor-before": ["source.factor.a"],
      "addends-before": ["source.addend.x", "source.addend.y"],
      "factor-copies": ["target.factor.a.0", "target.factor.a.1"],
      "products-after": ["target.product.ax", "target.product.ay"]
    },
    teachingIntent: "Show one factor becoming the common cause of two products."
  }),
  pressureFixture({
    id: "pressure.equation.log-product.binary",
    scenario: "log-product-binary",
    animationId: "animation.algebra.log-product.product-to-sum",
    operationId: "kp.semantic-motion.log-product",
    roleIds: logProductRoleIds,
    roleBindings: logProductPressureBindings(["x", "y"]),
    teachingIntent:
      "Show one logarithm application deriving two ordered applications while both factors persist."
  }),
  pressureFixture({
    id: "pressure.equation.log-product.three-factor",
    scenario: "log-product-three-factor",
    animationId: "animation.algebra.log-product.three-factors-to-sum",
    operationId: "kp.semantic-motion.log-product",
    roleIds: logProductRoleIds,
    roleBindings: logProductPressureBindings(["x", "y", "z"]),
    teachingIntent:
      "Pressure the same logarithm-product operation with three ordered factors."
  }),
  pressureFixture({
    id: "pressure.equation.log-quotient",
    scenario: "log-quotient",
    animationId: "animation.algebra.log-quotient.difference-to-quotient",
    operationId: "kp.semantic-motion.quotient",
    roleIds: [
      "source-operators",
      "source-arguments",
      "target-operator",
      "target-arguments"
    ],
    roleBindings: {
      "source-operators": ["source.operator.left", "source.operator.right"],
      "source-arguments": ["source.argument.x", "source.argument.y"],
      "target-operator": ["target.operator"],
      "target-arguments": ["target.argument.x", "target.argument.y"]
    },
    teachingIntent:
      "Show two logarithm applications fusing around a quotient of persistent arguments."
  })
] as const satisfies readonly KpEquationGenerationPressureFixture[]);

export const kpEquationGenerationPressureCorpora = Object.freeze([
  Object.freeze({
    id: "corpus.equation.log-homomorphism.v1",
    fixtureIds: Object.freeze([
      "pressure.equation.log-product.binary",
      "pressure.equation.log-product.three-factor",
      "pressure.equation.log-quotient"
    ])
  })
] as const satisfies readonly KpEquationGenerationPressureCorpus[]);

export function validateKpEquationGenerationPressureFixture(
  value: unknown
): readonly KpEquationGenerationPressureIssue[] {
  const issues: KpEquationGenerationPressureIssue[] = [];
  if (!isRecord(value)) {
    return Object.freeze([issue(
      "pressure.fixture.shape",
      "$",
      "A generation-pressure fixture must be an object."
    )]);
  }
  requireExactKeys(value, [
    "schemaVersion",
    "id",
    "scenario",
    "request",
    "allowedVocabulary",
    "successCriteria",
    "repairAccounting"
  ], "$", issues);
  if (
    value["schemaVersion"] !==
      "kp.equation-generation-pressure-fixture.v1" ||
    typeof value["id"] !== "string" ||
    !isScenario(value["scenario"])
  ) {
    issues.push(issue(
      "pressure.fixture.identity",
      "$",
      "Fixture schema, id, and scenario must use the pressure-contract vocabulary."
    ));
  }

  const request = value["request"];
  if (isRecord(request)) {
    requireExactKeys(request, [
      "animationId",
      "operation",
      "explanationDepth",
      "teachingIntent"
    ], "$.request", issues);
    if (isRecord(request["operation"])) {
      requireExactKeys(
        request["operation"],
        ["operationId", "roleBindings"],
        "$.request.operation",
        issues
      );
    }
  }

  const catalogue = createKpEquationLlmAuthoringCatalogue();
  const requestResult = validateKpEquationLlmAuthoringRequest(request, catalogue);
  if (requestResult.status !== "accepted") {
    requestResult.diagnostics.forEach((diagnostic) => {
      issues.push(issue(
        "pressure.fixture.request",
        `$.request${diagnostic.path.slice(1)}`,
        `${diagnostic.code}: ${diagnostic.message}`
      ));
    });
  }

  const vocabulary = value["allowedVocabulary"];
  if (!isRecord(vocabulary)) {
    issues.push(issue(
      "pressure.fixture.vocabulary",
      "$.allowedVocabulary",
      "Allowed vocabulary must name one surface, operation, role set, and depth set."
    ));
  } else {
    requireExactKeys(vocabulary, [
      "animationId",
      "operationId",
      "roleIds",
      "explanationDepths"
    ], "$.allowedVocabulary", issues);
    const operationId = vocabulary["operationId"];
    const operation = catalogue.operations.find((candidate) =>
      candidate.operationId === operationId
    );
    const expectedRoleIds = operation?.roles.map(({ id }) => id) ?? [];
    const roleIds = stringArray(vocabulary["roleIds"]);
    if (
      vocabulary["animationId"] !==
        (isRecord(request) ? request["animationId"] : undefined) ||
      operationId !==
        (isRecord(request) && isRecord(request["operation"])
          ? request["operation"]["operationId"]
          : undefined) ||
      !sameArray(roleIds, expectedRoleIds) ||
      !sameArray(stringArray(vocabulary["explanationDepths"]), [
        "compact",
        "standard",
        "expanded"
      ])
    ) {
      issues.push(issue(
        "pressure.fixture.vocabulary",
        "$.allowedVocabulary",
        "Allowed vocabulary must exactly match the request and governed operation roles."
      ));
    }
  }

  if (!hasCanonicalCriteria(value["successCriteria"])) {
    issues.push(issue(
      "pressure.fixture.criteria",
      "$.successCriteria",
      "Pressure trials require zero-repair first-pass acceptance and the full deterministic proof set."
    ));
  }
  if (!hasCanonicalRepairAccounting(value["repairAccounting"])) {
    issues.push(issue(
      "pressure.fixture.criteria",
      "$.repairAccounting",
      "Repair accounting must count validator rounds from the initial request."
    ));
  }
  return Object.freeze(issues);
}

function pressureFixture(input: {
  readonly id: string;
  readonly scenario: KpEquationGenerationPressureScenario;
  readonly animationId: string;
  readonly operationId: string;
  readonly roleIds: readonly string[];
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly teachingIntent: string;
}): KpEquationGenerationPressureFixture {
  return deepFreeze({
    schemaVersion: "kp.equation-generation-pressure-fixture.v1" as const,
    id: input.id,
    scenario: input.scenario,
    request: {
      animationId: input.animationId,
      operation: {
        operationId: input.operationId,
        roleBindings: input.roleBindings
      },
      explanationDepth: "standard" as const,
      teachingIntent: input.teachingIntent
    },
    allowedVocabulary: {
      animationId: input.animationId,
      operationId: input.operationId,
      roleIds: input.roleIds,
      explanationDepths: ["compact", "standard", "expanded"] as const
    },
    successCriteria: {
      firstPassStatus: "accepted" as const,
      maximumRepairCount: 0 as const,
      requiredProofIds: [
        "catalogue-accepted",
        "canonical-authority-compiled",
        "native-endpoints-preserved",
        "direct-seek-equivalent",
        "visual-substitution-absent",
        "presentation-authorship-absent"
      ] as const
    },
    repairAccounting: {
      unit: "validator-round" as const,
      countFrom: "initial-request" as const,
      recordDiagnosticCodes: true as const,
      recordChangedSemanticFields: true as const
    }
  });
}

function hasCanonicalCriteria(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return value["firstPassStatus"] === "accepted" &&
    value["maximumRepairCount"] === 0 &&
    sameArray(stringArray(value["requiredProofIds"]), [
      "catalogue-accepted",
      "canonical-authority-compiled",
      "native-endpoints-preserved",
      "direct-seek-equivalent",
      "visual-substitution-absent",
      "presentation-authorship-absent"
    ]);
}

function hasCanonicalRepairAccounting(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return value["unit"] === "validator-round" &&
    value["countFrom"] === "initial-request" &&
    value["recordDiagnosticCodes"] === true &&
    value["recordChangedSemanticFields"] === true;
}

function requireExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: KpEquationGenerationPressureIssue[]
): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      issues.push(issue(
        "pressure.fixture.shape",
        `${path}.${key}`,
        `Field ${key} is outside the fixed generation-pressure vocabulary.`
      ));
    }
  }
}

function issue(
  code: KpEquationGenerationPressureIssueCode,
  path: string,
  message: string
): KpEquationGenerationPressureIssue {
  return Object.freeze({ code, path, message });
}

function isScenario(value: unknown): value is KpEquationGenerationPressureScenario {
  return value === "function-wrap" ||
    value === "cancellation" ||
    value === "distribution-factoring" ||
    value === "log-product-binary" ||
    value === "log-product-three-factor" ||
    value === "log-quotient";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : [];
}

function sameArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((entry, index) => entry === right[index]);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach((entry) => deepFreeze(entry));
  return Object.freeze(value);
}
