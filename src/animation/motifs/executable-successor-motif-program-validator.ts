import {
  kpExecutableSuccessorMotifProgramSchemaVersion,
  kpExecutableSuccessorMotifProgramVersion
} from "./executable-successor-motif-program.ts";
import type {
  KpExecutableSuccessorMotifProgramDraft,
  KpExecutableSuccessorMotifProgramKind,
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";
import {
  registerKpVerifiedExecutableSuccessorMotifProgramAuthority
} from "./executable-successor-motif-program-authority.ts";

export {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program-authority.ts";

const forbiddenPresentationAuthorityKeys = new Set([
  "dom",
  "duration",
  "durationMs",
  "handoff",
  "keyframes",
  "latex",
  "opacity",
  "path",
  "pixels",
  "selector",
  "timing"
]);

const commonProgramShape = {
  context: {
    policy: "preserve-unclaimed-context",
    role: "continuant-context"
  },
  accessibility: {
    narration: "semantic-phase-and-role-summary",
    reducedMotion: "native-checkpoints-with-phase-summary"
  },
  rewind: {
    policy: "exact-phase-reversal",
    restores: "source-roles-lineage-and-context"
  },
  continuity: {
    minimumVisibleInk: "motif-specific",
    intentionalVanish: "forbidden",
    endpointSettlement: "exact-native-source-and-target"
  }
} as const;

const variantContracts = {
  "operation-evaluation": {
    allowedRoles: [
      "material-input",
      "causal-catalyst",
      "result-material",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-contributors",
        effect: "orient",
        requiredRoles: [
          "material-input",
          "causal-catalyst",
          "continuant-context"
        ]
      },
      {
        id: "gather-contributors",
        effect: "converge",
        requiredRoles: ["material-input", "causal-catalyst"]
      },
      {
        id: "recognize-result",
        effect: "recognize-result",
        requiredRoles: [
          "material-input",
          "causal-catalyst",
          "result-material"
        ]
      },
      {
        id: "settle-result",
        effect: "settle",
        requiredRoles: ["result-material", "continuant-context"]
      }
    ],
    lineage: {
      material: "many-inputs-to-one-result",
      catalyst: "participates-without-result-lineage",
      context: "identity-preserving"
    }
  },
  "identity-fission": {
    allowedRoles: [
      "source-identity",
      "descendant-identity",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-source-identity",
        effect: "orient",
        requiredRoles: ["source-identity", "continuant-context"]
      },
      {
        id: "branch-identity",
        effect: "branch-identity",
        requiredRoles: ["source-identity", "descendant-identity"]
      },
      {
        id: "establish-descendants",
        effect: "establish-descendants",
        requiredRoles: ["descendant-identity"]
      },
      {
        id: "settle-descendants",
        effect: "settle",
        requiredRoles: ["descendant-identity", "continuant-context"]
      }
    ],
    lineage: {
      identity: "one-source-to-many-exact-descendants",
      descendantCardinality: "two-or-more",
      context: "identity-preserving"
    }
  },
  "identity-fusion": {
    allowedRoles: [
      "contributor-identity",
      "result-identity",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-contributor-identities",
        effect: "orient",
        requiredRoles: ["contributor-identity", "continuant-context"]
      },
      {
        id: "gather-identities",
        effect: "gather-identities",
        requiredRoles: ["contributor-identity", "result-identity"]
      },
      {
        id: "establish-ancestor",
        effect: "establish-ancestor",
        requiredRoles: ["contributor-identity", "result-identity"]
      },
      {
        id: "settle-ancestor",
        effect: "settle",
        requiredRoles: ["result-identity", "continuant-context"]
      }
    ],
    lineage: {
      identity: "many-contributors-to-one-exact-ancestor",
      contributorCardinality: "two-or-more",
      context: "identity-preserving"
    }
  }
} as const;

export type KpExecutableSuccessorMotifProgramValidationIssueCode =
  | "schema.invalid"
  | "schema.unknown-field"
  | "authority.forbidden"
  | "program.invalid-id"
  | "program.invalid-version"
  | "program.invalid-kind"
  | "phase.missing"
  | "phase.duplicate"
  | "phase.order"
  | "phase.effect"
  | "role.missing"
  | "role.duplicate"
  | "role.foreign"
  | "lineage.invalid"
  | "context.invalid"
  | "accessibility.invalid"
  | "rewind.invalid"
  | "continuity.invalid";

export interface KpExecutableSuccessorMotifProgramValidationIssue {
  readonly code: KpExecutableSuccessorMotifProgramValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

export type KpExecutableSuccessorMotifProgramValidationResult =
  | {
      readonly status: "verified";
      readonly program: KpVerifiedExecutableSuccessorMotifProgram;
    }
  | {
      readonly status: "invalid";
      readonly issues:
        readonly KpExecutableSuccessorMotifProgramValidationIssue[];
    };

/**
 * This is the sole runtime mint for successor motif programs. It validates
 * semantic phase and lineage obligations only; rendered glyph text, DOM,
 * geometry, paths, pixels, timing, and endpoint handoff remain compositor
 * authority and are rejected here when supplied by callers.
 */
export function validateAndMintKpExecutableSuccessorMotifProgram(input: {
  readonly draft: unknown;
}): KpExecutableSuccessorMotifProgramValidationResult {
  const issues: KpExecutableSuccessorMotifProgramValidationIssue[] = [];
  findForbiddenPresentationAuthority(input.draft, "$", issues);
  if (!isRecord(input.draft)) {
    pushIssue(
      issues,
      "schema.invalid",
      "$",
      "Executable motif program must be an object."
    );
    return invalidResult(issues);
  }

  validateExactKeys(input.draft, [
    "schemaVersion",
    "programVersion",
    "id",
    "kind",
    "phases",
    "allowedRoles",
    "lineage",
    "context",
    "accessibility",
    "rewind",
    "continuity"
  ], "$", issues);

  if (
    input.draft["schemaVersion"] !==
      kpExecutableSuccessorMotifProgramSchemaVersion ||
    input.draft["programVersion"] !==
      kpExecutableSuccessorMotifProgramVersion
  ) {
    pushIssue(
      issues,
      "program.invalid-version",
      "schemaVersion",
      "Executable motif schema and program versions must be pinned."
    );
  }
  if (
    typeof input.draft["id"] !== "string" ||
    input.draft["id"].trim().length === 0
  ) {
    pushIssue(
      issues,
      "program.invalid-id",
      "id",
      "Executable motif program id must be non-empty."
    );
  }

  const kind = input.draft["kind"];
  if (!isProgramKind(kind)) {
    pushIssue(
      issues,
      "program.invalid-kind",
      "kind",
      "Executable motif program kind is not supported."
    );
    return invalidResult(issues);
  }

  const contract = variantContracts[kind];
  validateStringTuple(
    input.draft["allowedRoles"],
    contract.allowedRoles,
    "allowedRoles",
    issues
  );
  validatePhases(input.draft["phases"], contract.phases, issues);
  validateLiteralObject(
    input.draft["lineage"],
    contract.lineage,
    "lineage",
    "lineage.invalid",
    issues
  );
  validateLiteralObject(
    input.draft["context"],
    commonProgramShape.context,
    "context",
    "context.invalid",
    issues
  );
  validateLiteralObject(
    input.draft["accessibility"],
    commonProgramShape.accessibility,
    "accessibility",
    "accessibility.invalid",
    issues
  );
  validateLiteralObject(
    input.draft["rewind"],
    commonProgramShape.rewind,
    "rewind",
    "rewind.invalid",
    issues
  );
  validateLiteralObject(
    input.draft["continuity"],
    commonProgramShape.continuity,
    "continuity",
    "continuity.invalid",
    issues
  );

  if (issues.length > 0) return invalidResult(issues);

  // The cast is confined to this exhaustive validator. WeakSet membership is
  // deliberately not serializable, so copied labels cannot retain authority.
  const program = registerKpVerifiedExecutableSuccessorMotifProgramAuthority(
    cloneAndFreezeProgram(
    input.draft as unknown as KpExecutableSuccessorMotifProgramDraft
    )
  );
  return Object.freeze({ status: "verified", program });
}

function validatePhases(
  value: unknown,
  expected: readonly {
    readonly id: string;
    readonly effect: string;
    readonly requiredRoles: readonly string[];
  }[],
  issues: KpExecutableSuccessorMotifProgramValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    expected.forEach((phase, index) => {
      pushIssue(
        issues,
        "phase.missing",
        `phases[${index}]`,
        `Missing required phase ${phase.id}.`
      );
    });
    return;
  }

  const phaseIds = value.map((phase) =>
    isRecord(phase) && typeof phase["id"] === "string"
      ? phase["id"]
      : undefined
  );
  const seen = new Set<string>();
  phaseIds.forEach((id, index) => {
    if (id === undefined) return;
    if (seen.has(id)) {
      pushIssue(
        issues,
        "phase.duplicate",
        `phases[${index}].id`,
        `Phase ${id} is duplicated.`
      );
    }
    seen.add(id);
  });

  expected.forEach((phase, index) => {
    if (!phaseIds.includes(phase.id)) {
      pushIssue(
        issues,
        "phase.missing",
        `phases[${index}]`,
        `Missing required phase ${phase.id}.`
      );
    }
    const candidate = value[index];
    if (!isRecord(candidate)) {
      pushIssue(
        issues,
        "schema.invalid",
        `phases[${index}]`,
        "Each executable motif phase must be an object."
      );
      return;
    }
    validateExactKeys(
      candidate,
      ["id", "effect", "requiredRoles"],
      `phases[${index}]`,
      issues
    );
    if (candidate["id"] !== phase.id) {
      pushIssue(
        issues,
        "phase.order",
        `phases[${index}].id`,
        `Expected phase ${phase.id} at index ${index}.`
      );
    }
    if (candidate["effect"] !== phase.effect) {
      pushIssue(
        issues,
        "phase.effect",
        `phases[${index}].effect`,
        `Phase ${phase.id} requires effect ${phase.effect}.`
      );
    }
    validateStringTuple(
      candidate["requiredRoles"],
      phase.requiredRoles,
      `phases[${index}].requiredRoles`,
      issues
    );
  });
  if (value.length > expected.length) {
    for (let index = expected.length; index < value.length; index += 1) {
      pushIssue(
        issues,
        "phase.order",
        `phases[${index}]`,
        "Executable motif phase graph contains an unexpected phase."
      );
    }
  }
}

function validateStringTuple(
  value: unknown,
  expected: readonly string[],
  path: string,
  issues: KpExecutableSuccessorMotifProgramValidationIssue[]
): void {
  if (!Array.isArray(value) || !value.every(
    (entry): entry is string => typeof entry === "string"
  )) {
    expected.forEach((role) => {
      pushIssue(
        issues,
        "role.missing",
        path,
        `Required semantic role ${role} is missing.`
      );
    });
    return;
  }
  const seen = new Set<string>();
  value.forEach((role, index) => {
    if (seen.has(role)) {
      pushIssue(
        issues,
        "role.duplicate",
        `${path}[${index}]`,
        `Semantic role ${role} is duplicated.`
      );
    }
    seen.add(role);
    if (!expected.includes(role)) {
      pushIssue(
        issues,
        "role.foreign",
        `${path}[${index}]`,
        `Semantic role ${role} is not legal at ${path}.`
      );
    }
  });
  expected.forEach((role) => {
    if (!seen.has(role)) {
      pushIssue(
        issues,
        "role.missing",
        path,
        `Required semantic role ${role} is missing.`
      );
    }
  });
  if (
    value.length === expected.length &&
    value.some((role, index) => role !== expected[index])
  ) {
    pushIssue(
      issues,
      "role.foreign",
      path,
      "Semantic roles must use the canonical program order."
    );
  }
}

function validateLiteralObject(
  value: unknown,
  expected: Readonly<Record<string, string>>,
  path: string,
  issueCode:
    | "lineage.invalid"
    | "context.invalid"
    | "accessibility.invalid"
    | "rewind.invalid"
    | "continuity.invalid",
  issues: KpExecutableSuccessorMotifProgramValidationIssue[]
): void {
  if (!isRecord(value)) {
    pushIssue(
      issues,
      issueCode,
      path,
      `${path} must be a complete semantic policy object.`
    );
    return;
  }
  validateExactKeys(value, Object.keys(expected), path, issues);
  for (const [key, literal] of Object.entries(expected)) {
    if (value[key] !== literal) {
      pushIssue(
        issues,
        issueCode,
        `${path}.${key}`,
        `${path}.${key} must equal ${literal}.`
      );
    }
  }
}

function validateExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  path: string,
  issues: KpExecutableSuccessorMotifProgramValidationIssue[]
): void {
  const expectedKeys = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedKeys.has(key)) {
      pushIssue(
        issues,
        "schema.unknown-field",
        path === "$" ? key : `${path}.${key}`,
        `Unknown executable motif program field ${key}.`
      );
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      pushIssue(
        issues,
        "schema.invalid",
        path === "$" ? key : `${path}.${key}`,
        `Missing executable motif program field ${key}.`
      );
    }
  }
}

function findForbiddenPresentationAuthority(
  value: unknown,
  path: string,
  issues: KpExecutableSuccessorMotifProgramValidationIssue[],
  visited = new Set<object>()
): void {
  if (typeof value !== "object" || value === null || visited.has(value)) return;
  visited.add(value);
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = path === "$" ? key : `${path}.${key}`;
    if (forbiddenPresentationAuthorityKeys.has(key)) {
      pushIssue(
        issues,
        "authority.forbidden",
        nestedPath,
        `Presentation authority ${key} cannot enter a semantic motif program.`
      );
    }
    findForbiddenPresentationAuthority(nested, nestedPath, issues, visited);
  }
}

function cloneAndFreezeProgram<
  Program extends KpExecutableSuccessorMotifProgramDraft
>(draft: Program): Program {
  const clone = {
    ...draft,
    phases: Object.freeze(draft.phases.map((phase) => Object.freeze({
      ...phase,
      requiredRoles: Object.freeze([...phase.requiredRoles])
    }))),
    allowedRoles: Object.freeze(
      [...draft.allowedRoles]
    ),
    lineage: Object.freeze({ ...draft.lineage }),
    context: Object.freeze({ ...draft.context }),
    accessibility: Object.freeze({ ...draft.accessibility }),
    rewind: Object.freeze({ ...draft.rewind }),
    continuity: Object.freeze({ ...draft.continuity })
  };
  return Object.freeze(clone) as unknown as Program;
}

function isProgramKind(
  value: unknown
): value is KpExecutableSuccessorMotifProgramKind {
  return value === "operation-evaluation" ||
    value === "identity-fission" ||
    value === "identity-fusion";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushIssue(
  issues: KpExecutableSuccessorMotifProgramValidationIssue[],
  code: KpExecutableSuccessorMotifProgramValidationIssueCode,
  path: string,
  message: string
): void {
  issues.push({ code, path, message });
}

function invalidResult(
  issues: KpExecutableSuccessorMotifProgramValidationIssue[]
): KpExecutableSuccessorMotifProgramValidationResult {
  return Object.freeze({
    status: "invalid",
    issues: Object.freeze(issues.map((issue) => Object.freeze(issue)))
  });
}
