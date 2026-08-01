export const kpExplanationSectionKinds = [
  "orientation",
  "subtract",
  "divide",
  "solution"
] as const;

export const kpExplanationTemplateIds = [
  "solve.goal.variable-alone",
  "solve.invariant.same-change",
  "solve.action.subtract-both-sides",
  "solve.mechanism.additive-cancellation",
  "solve.checkpoint.subtraction",
  "solve.action.divide-both-sides",
  "solve.mechanism.multiplicative-cancellation",
  "solve.payoff.verified-solution"
] as const;

export const kpExplanationVocabularyIds = [
  "both-sides",
  "divide",
  "equal",
  "equals-sign",
  "minus",
  "number",
  "plus",
  "same-change",
  "subtract",
  "undo",
  "unknown",
  "variable-alone"
] as const;

export const kpExplanationBlockedVocabularyIds = [
  "additive-term",
  "inverse-operation",
  "isolate-variable",
  "preserve-equality",
  "verify-by-substitution"
] as const;

export const kpExplanationNotationReadingIds = [
  "equals.as-equal-to",
  "fraction.as-divided-by",
  "variable.as-unknown"
] as const;

export const kpExplanationAssumedConceptIds = [
  "whole-number-arithmetic",
  "operation-symbols",
  "equals-means-equal",
  "letter-as-unknown"
] as const;

export const kpExplanationTargetConceptIds = [
  "undo-in-useful-order",
  "same-change-keeps-equality"
] as const;

export type KpExplanationSectionKind =
  typeof kpExplanationSectionKinds[number];
export type KpExplanationTemplateId =
  typeof kpExplanationTemplateIds[number];
export type KpExplanationVocabularyId =
  typeof kpExplanationVocabularyIds[number];
export type KpExplanationBlockedVocabularyId =
  typeof kpExplanationBlockedVocabularyIds[number];
export type KpExplanationNotationReadingId =
  typeof kpExplanationNotationReadingIds[number];
export type KpExplanationAssumedConceptId =
  typeof kpExplanationAssumedConceptIds[number];
export type KpExplanationTargetConceptId =
  typeof kpExplanationTargetConceptIds[number];

export interface KpExplanationVerifiedClaimV1 {
  readonly id: string;
  readonly instanceId: string;
  readonly kind: "equation-frame" | "equivalence-operation" | "solution";
  readonly sourceRefId: string;
  readonly verification: "provider-verified";
}

export interface KpExplanationVerifiedClaimAuthorityV1 {
  readonly schemaVersion: "kp.explanation-verified-claim-authority.v1";
  readonly instanceId: string;
  readonly claims: readonly KpExplanationVerifiedClaimV1[];
}

export interface KpExplanationLearnerStateV1 {
  readonly schemaVersion: "kp.explanation-learner-state.v1";
  readonly id: string;
  readonly level: "early-algebra-foundation";
  readonly detail: "standard";
  readonly assumedConceptIds:
    readonly KpExplanationAssumedConceptId[];
  readonly targetConceptIds:
    readonly KpExplanationTargetConceptId[];
}

export interface KpExplanationVocabularyContractV1 {
  readonly schemaVersion: "kp.explanation-vocabulary.v1";
  readonly id: string;
  readonly familiar: readonly KpExplanationVocabularyId[];
  readonly introduced: readonly KpExplanationVocabularyId[];
  readonly blocked: readonly KpExplanationBlockedVocabularyId[];
  readonly notationReadings:
    readonly KpExplanationNotationReadingId[];
  readonly cueWordLimit: 12;
  readonly sentenceShape: "one-clause";
}

export interface KpExplanationSpineSectionV1 {
  readonly id: string;
  readonly kind: KpExplanationSectionKind;
  readonly beatIds: readonly string[];
}

export interface KpExplanationSpineBeatV1 {
  readonly id: string;
  readonly kind:
    | "goal"
    | "invariant"
    | "action"
    | "mechanism"
    | "checkpoint"
    | "payoff";
  readonly templateId: KpExplanationTemplateId;
  readonly claimRefs: readonly string[];
  readonly vocabularyRefs: readonly KpExplanationVocabularyId[];
  readonly sourceOperationRef?: string | undefined;
  readonly sourceFrameRef?: string | undefined;
}

export interface KpExplanationSpineV1 {
  readonly schemaVersion: "kp.explanation-spine.v1";
  readonly id: string;
  readonly instanceId: string;
  readonly sourceTraceId: string;
  readonly learnerState: KpExplanationLearnerStateV1;
  readonly vocabulary: KpExplanationVocabularyContractV1;
  readonly sections: readonly KpExplanationSpineSectionV1[];
  readonly beats: readonly KpExplanationSpineBeatV1[];
}

export interface KpExplanationSpineDiagnostic {
  readonly severity: "error";
  readonly code:
    | "unknown-field"
    | "schema-version"
    | "identity"
    | "learner-state"
    | "vocabulary"
    | "section-order"
    | "beat-order"
    | "duplicate-id"
    | "template-contract"
    | "claim-authority"
    | "source-authority";
  readonly path: string;
  readonly message: string;
}

interface TemplateContract {
  readonly kind: KpExplanationSpineBeatV1["kind"];
  readonly section: KpExplanationSectionKind;
  readonly claimKind: KpExplanationVerifiedClaimV1["kind"];
  readonly requiredVocabulary: readonly KpExplanationVocabularyId[];
  readonly source: "frame" | "none" | "operation";
}

const templateContracts: Readonly<
  Record<KpExplanationTemplateId, TemplateContract>
> = Object.freeze({
  "solve.goal.variable-alone": {
    kind: "goal",
    section: "orientation",
    claimKind: "equation-frame",
    requiredVocabulary: ["unknown", "variable-alone"],
    source: "frame"
  },
  "solve.invariant.same-change": {
    kind: "invariant",
    section: "orientation",
    claimKind: "equivalence-operation",
    requiredVocabulary: ["both-sides", "same-change", "equal"],
    source: "operation"
  },
  "solve.action.subtract-both-sides": {
    kind: "action",
    section: "subtract",
    claimKind: "equivalence-operation",
    requiredVocabulary: ["subtract", "both-sides"],
    source: "operation"
  },
  "solve.mechanism.additive-cancellation": {
    kind: "mechanism",
    section: "subtract",
    claimKind: "equivalence-operation",
    requiredVocabulary: ["plus", "minus", "undo"],
    source: "operation"
  },
  "solve.checkpoint.subtraction": {
    kind: "checkpoint",
    section: "subtract",
    claimKind: "equation-frame",
    requiredVocabulary: ["equal"],
    source: "frame"
  },
  "solve.action.divide-both-sides": {
    kind: "action",
    section: "divide",
    claimKind: "equivalence-operation",
    requiredVocabulary: ["divide", "both-sides"],
    source: "operation"
  },
  "solve.mechanism.multiplicative-cancellation": {
    kind: "mechanism",
    section: "divide",
    claimKind: "equivalence-operation",
    requiredVocabulary: ["divide", "undo"],
    source: "operation"
  },
  "solve.payoff.verified-solution": {
    kind: "payoff",
    section: "solution",
    claimKind: "solution",
    requiredVocabulary: ["unknown", "equal"],
    source: "frame"
  }
});

export function createKpExplanationSpineV1(input: {
  readonly spine: KpExplanationSpineV1;
  readonly claimAuthority: KpExplanationVerifiedClaimAuthorityV1;
}): KpExplanationSpineV1 {
  const diagnostics = validateKpExplanationSpineV1(input);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map(({ message }) => message).join(" "));
  }
  return deepFreeze(cloneSpine(input.spine));
}

export function validateKpExplanationSpineV1(input: {
  readonly spine: KpExplanationSpineV1;
  readonly claimAuthority: KpExplanationVerifiedClaimAuthorityV1;
}): readonly KpExplanationSpineDiagnostic[] {
  const diagnostics: KpExplanationSpineDiagnostic[] = [];
  rejectUnknownKeys(input.spine, [
    "schemaVersion",
    "id",
    "instanceId",
    "sourceTraceId",
    "learnerState",
    "vocabulary",
    "sections",
    "beats"
  ], "$", diagnostics);
  if (input.spine.schemaVersion !== "kp.explanation-spine.v1") {
    diagnostic(
      "schema-version",
      "$.schemaVersion",
      "Explanation Spine requires schema version kp.explanation-spine.v1.",
      diagnostics
    );
  }
  if (
    !isText(input.spine.id) ||
    !isText(input.spine.instanceId) ||
    !isText(input.spine.sourceTraceId) ||
    input.spine.instanceId !== input.claimAuthority.instanceId
  ) {
    diagnostic(
      "identity",
      "$",
      "Spine, trace, and verified claim authority require one non-empty instance identity.",
      diagnostics
    );
  }
  validateLearnerState(input.spine.learnerState, diagnostics);
  const vocabulary = validateVocabulary(input.spine.vocabulary, diagnostics);
  const claimById = validateClaimAuthority(
    input.claimAuthority,
    diagnostics
  );
  validateSectionsAndBeats(
    input.spine,
    claimById,
    vocabulary,
    diagnostics
  );
  return Object.freeze(diagnostics);
}

function validateLearnerState(
  state: KpExplanationLearnerStateV1,
  diagnostics: KpExplanationSpineDiagnostic[]
): void {
  rejectUnknownKeys(state, [
    "schemaVersion",
    "id",
    "level",
    "detail",
    "assumedConceptIds",
    "targetConceptIds"
  ], "$.learnerState", diagnostics);
  if (
    state.schemaVersion !== "kp.explanation-learner-state.v1" ||
    !isText(state.id) ||
    state.level !== "early-algebra-foundation" ||
    state.detail !== "standard"
  ) {
    diagnostic(
      "learner-state",
      "$.learnerState",
      "The first spine supports one explicit early-algebra standard learner state.",
      diagnostics
    );
  }
  validateClosedIds(
    state.assumedConceptIds,
    kpExplanationAssumedConceptIds,
    "$.learnerState.assumedConceptIds",
    "learner-state",
    diagnostics
  );
  validateClosedIds(
    state.targetConceptIds,
    kpExplanationTargetConceptIds,
    "$.learnerState.targetConceptIds",
    "learner-state",
    diagnostics
  );
  if (
    state.assumedConceptIds.length === 0 ||
    state.targetConceptIds.length === 0
  ) {
    diagnostic(
      "learner-state",
      "$.learnerState",
      "Learner state requires explicit assumed and target knowledge.",
      diagnostics
    );
  }
}

function validateVocabulary(
  vocabulary: KpExplanationVocabularyContractV1,
  diagnostics: KpExplanationSpineDiagnostic[]
): ReadonlySet<KpExplanationVocabularyId> {
  rejectUnknownKeys(vocabulary, [
    "schemaVersion",
    "id",
    "familiar",
    "introduced",
    "blocked",
    "notationReadings",
    "cueWordLimit",
    "sentenceShape"
  ], "$.vocabulary", diagnostics);
  if (
    vocabulary.schemaVersion !== "kp.explanation-vocabulary.v1" ||
    !isText(vocabulary.id) ||
    vocabulary.cueWordLimit !== 12 ||
    vocabulary.sentenceShape !== "one-clause"
  ) {
    diagnostic(
      "vocabulary",
      "$.vocabulary",
      "The first spine requires the bounded V1 vocabulary and cue contract.",
      diagnostics
    );
  }
  validateClosedIds(
    vocabulary.familiar,
    kpExplanationVocabularyIds,
    "$.vocabulary.familiar",
    "vocabulary",
    diagnostics
  );
  validateClosedIds(
    vocabulary.introduced,
    kpExplanationVocabularyIds,
    "$.vocabulary.introduced",
    "vocabulary",
    diagnostics
  );
  validateClosedIds(
    vocabulary.blocked,
    kpExplanationBlockedVocabularyIds,
    "$.vocabulary.blocked",
    "vocabulary",
    diagnostics
  );
  validateClosedIds(
    vocabulary.notationReadings,
    kpExplanationNotationReadingIds,
    "$.vocabulary.notationReadings",
    "vocabulary",
    diagnostics
  );
  const available = new Set<KpExplanationVocabularyId>([
    ...vocabulary.familiar,
    ...vocabulary.introduced
  ]);
  if (
    available.size !==
      vocabulary.familiar.length + vocabulary.introduced.length
  ) {
    diagnostic(
      "vocabulary",
      "$.vocabulary",
      "A vocabulary item cannot be both familiar and newly introduced.",
      diagnostics
    );
  }
  return available;
}

function validateClaimAuthority(
  authority: KpExplanationVerifiedClaimAuthorityV1,
  diagnostics: KpExplanationSpineDiagnostic[]
): ReadonlyMap<string, KpExplanationVerifiedClaimV1> {
  rejectUnknownKeys(authority, [
    "schemaVersion",
    "instanceId",
    "claims"
  ], "$.claimAuthority", diagnostics);
  if (
    authority.schemaVersion !==
      "kp.explanation-verified-claim-authority.v1" ||
    !isText(authority.instanceId)
  ) {
    diagnostic(
      "claim-authority",
      "$.claimAuthority",
      "Explanation claims require one versioned verified authority.",
      diagnostics
    );
  }
  const byId = new Map<string, KpExplanationVerifiedClaimV1>();
  authority.claims.forEach((claim, index) => {
    const path = `$.claimAuthority.claims[${index}]`;
    rejectUnknownKeys(claim, [
      "id",
      "instanceId",
      "kind",
      "sourceRefId",
      "verification"
    ], path, diagnostics);
    if (
      !isText(claim.id) ||
      !isText(claim.sourceRefId) ||
      claim.instanceId !== authority.instanceId ||
      claim.verification !== "provider-verified"
    ) {
      diagnostic(
        "claim-authority",
        path,
        "Every explanation claim must be provider-verified for this instance.",
        diagnostics
      );
    }
    if (byId.has(claim.id)) {
      diagnostic(
        "duplicate-id",
        `${path}.id`,
        `Duplicate verified claim ${claim.id}.`,
        diagnostics
      );
    }
    byId.set(claim.id, claim);
  });
  return byId;
}

function validateSectionsAndBeats(
  spine: KpExplanationSpineV1,
  claimById: ReadonlyMap<string, KpExplanationVerifiedClaimV1>,
  vocabulary: ReadonlySet<KpExplanationVocabularyId>,
  diagnostics: KpExplanationSpineDiagnostic[]
): void {
  if (
    spine.sections.length !== kpExplanationSectionKinds.length ||
    spine.sections.some(
      (section, index) => section.kind !== kpExplanationSectionKinds[index]
    )
  ) {
    diagnostic(
      "section-order",
      "$.sections",
      "V1 sections must be orientation, subtract, divide, then solution.",
      diagnostics
    );
  }
  const sectionIds = new Set<string>();
  const declaredBeatOrder: string[] = [];
  const sectionKindByBeatId = new Map<string, KpExplanationSectionKind>();
  spine.sections.forEach((section, index) => {
    const path = `$.sections[${index}]`;
    rejectUnknownKeys(section, ["id", "kind", "beatIds"], path, diagnostics);
    if (!isText(section.id) || sectionIds.has(section.id)) {
      diagnostic(
        "duplicate-id",
        `${path}.id`,
        `Section identity ${section.id} must be non-empty and unique.`,
        diagnostics
      );
    }
    sectionIds.add(section.id);
    if (section.beatIds.length === 0) {
      diagnostic(
        "beat-order",
        `${path}.beatIds`,
        "Every explanation section requires at least one beat.",
        diagnostics
      );
    }
    section.beatIds.forEach((beatId) => {
      declaredBeatOrder.push(beatId);
      if (sectionKindByBeatId.has(beatId)) {
        diagnostic(
          "duplicate-id",
          `${path}.beatIds`,
          `Beat ${beatId} belongs to more than one section.`,
          diagnostics
        );
      }
      sectionKindByBeatId.set(beatId, section.kind);
    });
  });

  const beatIds = spine.beats.map(({ id }) => id);
  if (canonicalJson(declaredBeatOrder) !== canonicalJson(beatIds)) {
    diagnostic(
      "beat-order",
      "$.beats",
      "Beat array order must exactly match the ordered section beat references.",
      diagnostics
    );
  }
  const seenBeatIds = new Set<string>();
  spine.beats.forEach((beat, index) => {
    const path = `$.beats[${index}]`;
    rejectUnknownKeys(beat, [
      "id",
      "kind",
      "templateId",
      "claimRefs",
      "vocabularyRefs",
      "sourceOperationRef",
      "sourceFrameRef"
    ], path, diagnostics);
    if (!isText(beat.id) || seenBeatIds.has(beat.id)) {
      diagnostic(
        "duplicate-id",
        `${path}.id`,
        `Beat identity ${beat.id} must be non-empty and unique.`,
        diagnostics
      );
    }
    seenBeatIds.add(beat.id);
    const template = templateContracts[beat.templateId];
    const sectionKind = sectionKindByBeatId.get(beat.id);
    if (
      template === undefined ||
      template.kind !== beat.kind ||
      template.section !== sectionKind
    ) {
      diagnostic(
        "template-contract",
        `${path}.templateId`,
        `Template ${beat.templateId} does not match beat and section intent.`,
        diagnostics
      );
      return;
    }
    if (
      beat.vocabularyRefs.some((id) => !vocabulary.has(id)) ||
      template.requiredVocabulary.some(
        (id) => !beat.vocabularyRefs.includes(id)
      )
    ) {
      diagnostic(
        "vocabulary",
        `${path}.vocabularyRefs`,
        `Beat ${beat.id} must use only available vocabulary and include its template requirements.`,
        diagnostics
      );
    }
    if (beat.claimRefs.length === 0) {
      diagnostic(
        "claim-authority",
        `${path}.claimRefs`,
        "Every explanation beat requires a verified claim reference.",
        diagnostics
      );
    }
    const claims = beat.claimRefs.flatMap((id) => {
      const claim = claimById.get(id);
      if (claim === undefined) {
        diagnostic(
          "claim-authority",
          `${path}.claimRefs`,
          `Unknown verified claim ${id}.`,
          diagnostics
        );
        return [];
      }
      return [claim];
    });
    if (!claims.some(({ kind }) => kind === template.claimKind)) {
      diagnostic(
        "claim-authority",
        `${path}.claimRefs`,
        `Template ${beat.templateId} requires a verified ${template.claimKind} claim.`,
        diagnostics
      );
    }
    validateBeatSource(beat, template, claims, path, diagnostics);
  });
}

function validateBeatSource(
  beat: KpExplanationSpineBeatV1,
  template: TemplateContract,
  claims: readonly KpExplanationVerifiedClaimV1[],
  path: string,
  diagnostics: KpExplanationSpineDiagnostic[]
): void {
  const sourceRef = template.source === "operation"
    ? beat.sourceOperationRef
    : template.source === "frame"
      ? beat.sourceFrameRef
      : undefined;
  const forbiddenRef = template.source === "operation"
    ? beat.sourceFrameRef
    : beat.sourceOperationRef;
  if (
    template.source !== "none" &&
    (
      !isText(sourceRef) ||
      !claims.some(({ sourceRefId }) => sourceRefId === sourceRef)
    )
  ) {
    diagnostic(
      "source-authority",
      path,
      `Beat ${beat.id} must bind its ${template.source} source to a referenced verified claim.`,
      diagnostics
    );
  }
  if (forbiddenRef !== undefined) {
    diagnostic(
      "source-authority",
      path,
      `Beat ${beat.id} carries a source reference outside its template contract.`,
      diagnostics
    );
  }
}

function validateClosedIds<Value extends string>(
  values: readonly string[],
  allowed: readonly Value[],
  path: string,
  code: "learner-state" | "vocabulary",
  diagnostics: KpExplanationSpineDiagnostic[]
): void {
  const allowedIds = new Set<string>(allowed);
  if (
    values.some((value) => !allowedIds.has(value)) ||
    new Set(values).size !== values.length
  ) {
    diagnostic(
      code,
      path,
      "Values must be unique members of the approved closed vocabulary.",
      diagnostics
    );
  }
}

function rejectUnknownKeys(
  value: object,
  allowed: readonly string[],
  path: string,
  diagnostics: KpExplanationSpineDiagnostic[]
): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      diagnostic(
        "unknown-field",
        `${path}.${key}`,
        `Explanation Spine does not accept field ${key}.`,
        diagnostics
      );
    }
  }
}

function diagnostic(
  code: KpExplanationSpineDiagnostic["code"],
  path: string,
  message: string,
  diagnostics: KpExplanationSpineDiagnostic[]
): void {
  diagnostics.push(Object.freeze({ severity: "error", code, path, message }));
}

function cloneSpine(spine: KpExplanationSpineV1): KpExplanationSpineV1 {
  return {
    ...spine,
    learnerState: {
      ...spine.learnerState,
      assumedConceptIds: [...spine.learnerState.assumedConceptIds],
      targetConceptIds: [...spine.learnerState.targetConceptIds]
    },
    vocabulary: {
      ...spine.vocabulary,
      familiar: [...spine.vocabulary.familiar],
      introduced: [...spine.vocabulary.introduced],
      blocked: [...spine.vocabulary.blocked],
      notationReadings: [...spine.vocabulary.notationReadings]
    },
    sections: spine.sections.map((section) => ({
      ...section,
      beatIds: [...section.beatIds]
    })),
    beats: spine.beats.map((beat) => ({
      ...beat,
      claimRefs: [...beat.claimRefs],
      vocabularyRefs: [...beat.vocabularyRefs]
    }))
  };
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}
