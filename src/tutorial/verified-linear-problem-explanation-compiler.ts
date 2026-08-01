import type {
  KpVerifiedLinearProblemAnimationBridgeContract
} from "../integrations/public-api.ts";
import type {
  KpVerifiedLinearProblemAnimationCompilation
} from "../animation/verified-linear-problem-animation-compiler.ts";
import type {
  KpAnimationAsset
} from "../animation/asset.ts";
import type {
  KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpExplanationSpineV1,
  validateKpExplanationSpineV1,
  type KpExplanationSpineBeatV1,
  type KpExplanationSpineV1,
  type KpExplanationVerifiedClaimAuthorityV1,
  type KpExplanationVerifiedClaimV1,
  type KpExplanationVocabularyId
} from "./explanation-spine-v1.ts";

export interface KpExplanationTextSegmentV1 {
  readonly kind: "text";
  readonly text: string;
}

export interface KpExplanationMathSegmentV1 {
  readonly kind: "math";
  readonly latex: string;
  readonly claimRef: string;
  readonly sourceObjectId: string;
  readonly sourceSelectorIds: readonly string[];
}

export type KpExplanationSegmentV1 =
  | KpExplanationTextSegmentV1
  | KpExplanationMathSegmentV1;

export interface KpExplanationLearnerCueV1 {
  readonly id: string;
  readonly beatId: string;
  readonly kind: KpExplanationSpineBeatV1["kind"];
  readonly templateId: KpExplanationSpineBeatV1["templateId"];
  readonly claimRefs: readonly string[];
  readonly vocabularyRefs: readonly KpExplanationVocabularyId[];
  readonly segments: readonly KpExplanationSegmentV1[];
  readonly wordCount: number;
}

export interface KpExplanationLearnerSectionV1 {
  readonly id: string;
  readonly spineSectionId: string;
  readonly kind: KpExplanationSpineV1["sections"][number]["kind"];
  readonly cues: readonly KpExplanationLearnerCueV1[];
}

export interface KpExplanationLearnerProjectionV1 {
  readonly schemaVersion: "kp.explanation-learner-projection.v1";
  readonly id: string;
  readonly instanceId: string;
  readonly spineId: string;
  readonly learnerStateId: string;
  readonly sections: readonly KpExplanationLearnerSectionV1[];
}

export interface KpVerifiedLinearProblemExplanationCompilation {
  readonly claimAuthority: KpExplanationVerifiedClaimAuthorityV1;
  readonly spine: KpExplanationSpineV1;
  readonly projection: KpExplanationLearnerProjectionV1;
}

export interface KpVerifiedLinearProblemExplanationDiagnostic {
  readonly severity: "error";
  readonly code:
    | "bridge-contract-invalid"
    | "unsupported-operation-sequence"
    | "animation-lineage-mismatch"
    | "missing-claim-source"
    | "spine-invalid"
    | "projection-invalid";
  readonly path: string;
  readonly message: string;
}

export type KpVerifiedLinearProblemExplanationCompileResult =
  | {
      readonly status: "compiled";
      readonly compilation: KpVerifiedLinearProblemExplanationCompilation;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "rejected";
      readonly diagnostics:
        readonly KpVerifiedLinearProblemExplanationDiagnostic[];
    };

interface ClaimIds {
  readonly initial: string;
  readonly subtractOperation: string;
  readonly afterSubtract: string;
  readonly divideOperation: string;
  readonly solution: string;
}

/**
 * The hand-authored spine selects only trusted templates and verified claims.
 * This compiler performs all wording and math interpolation locally, so
 * playback and editing never depend on a network or model call.
 */
export function compileVerifiedLinearProblemExplanation(input: {
  readonly bridge: KpVerifiedLinearProblemAnimationBridgeContract;
  readonly animationCompilation:
    KpVerifiedLinearProblemAnimationCompilation;
  readonly spine?: KpExplanationSpineV1 | undefined;
}): KpVerifiedLinearProblemExplanationCompileResult {
  const authorityIssue = validateBridgeAndAnimation(input);
  if (authorityIssue !== undefined) return authorityIssue;
  const claims = claimIds(input.bridge.identity.semanticNamespace);
  const claimAuthority = createClaimAuthority(input.bridge, claims);
  const spineCandidate = input.spine ?? createHandAuthoredSpine(
    input.bridge,
    claims
  );
  const spineDiagnostics = validateKpExplanationSpineV1({
    spine: spineCandidate,
    claimAuthority
  });
  if (spineDiagnostics.length > 0) {
    return {
      status: "rejected",
      diagnostics: Object.freeze(spineDiagnostics.map(({ path, message }) =>
        diagnostic("spine-invalid", path, message)
      ))
    };
  }
  const spine = createKpExplanationSpineV1({
    spine: spineCandidate,
    claimAuthority
  });
  const projection = createLearnerProjection({
    bridge: input.bridge,
    animation: input.animationCompilation.animation,
    spine,
    claims
  });
  if ("diagnostics" in projection) {
    return { status: "rejected", diagnostics: projection.diagnostics };
  }
  const compilation = Object.freeze({
    claimAuthority: deepFreeze(claimAuthority),
    spine,
    projection: deepFreeze(projection)
  });
  return Object.freeze({
    status: "compiled" as const,
    compilation,
    diagnostics: [] as const
  });
}

function validateBridgeAndAnimation(input: {
  readonly bridge: KpVerifiedLinearProblemAnimationBridgeContract;
  readonly animationCompilation:
    KpVerifiedLinearProblemAnimationCompilation;
}): KpVerifiedLinearProblemExplanationCompileResult | undefined {
  const { bridge, animationCompilation } = input;
  if (
    bridge.schemaVersion !==
      "kp.verified-linear-problem-animation-bridge.v1" ||
    bridge.trace.id !== bridge.identity.sourceTraceId ||
    bridge.trace.provenance.problemId !== bridge.identity.sourceProblemId
  ) {
    return rejected(
      "bridge-contract-invalid",
      "$.bridge",
      "Explanation compilation requires one self-consistent verified bridge contract."
    );
  }
  if (
    bridge.operationBindings.length !== 2 ||
    bridge.operationBindings[0]?.kind !== "subtract-both-sides" ||
    bridge.operationBindings[1]?.kind !== "divide-both-sides"
  ) {
    return rejected(
      "unsupported-operation-sequence",
      "$.bridge.operationBindings",
      "ExplanationSpineV1 supports the first subtract-then-divide generated solve only."
    );
  }
  const animation = animationCompilation.animation;
  if (
    animation.id !== bridge.identity.animationId ||
    animation.metadata?.["generatedProblemInstanceId"] !==
      bridge.identity.instanceId ||
    animation.metadata?.["sourceTraceId"] !== bridge.trace.id
  ) {
    return rejected(
      "animation-lineage-mismatch",
      "$.animationCompilation.animation",
      "Explanation compilation requires the canonical animation for this exact generated instance."
    );
  }
  const frameLineage = new Map(
    animationCompilation.frameLineage.map((item) => [
      item.sourceFrameId,
      item
    ])
  );
  const operationLineage = new Map(
    animationCompilation.operationLineage.map((item) => [
      item.sourceOperationId,
      item
    ])
  );
  const objectIds = new Set(animation.bundle.objects.map(({ id }) => id));
  const transformationIds = new Set(
    animation.transformations.map(({ id }) => id)
  );
  for (const frame of bridge.trace.frames) {
    const lineage = frameLineage.get(frame.id);
    if (
      lineage === undefined ||
      lineage.sourceEquationSemanticId !== frame.semanticIds.equation ||
      !objectIds.has(lineage.objectId)
    ) {
      return rejected(
        "missing-claim-source",
        "$.animationCompilation.frameLineage",
        `Verified frame ${frame.id} lacks exact animation object lineage.`
      );
    }
  }
  for (const operation of bridge.trace.operations) {
    const lineage = operationLineage.get(operation.id);
    if (
      lineage === undefined ||
      lineage.sourceOperationSemanticId !== operation.semanticId ||
      lineage.transformationIds.length === 0 ||
      lineage.transformationIds.some((id) => !transformationIds.has(id))
    ) {
      return rejected(
        "missing-claim-source",
        "$.animationCompilation.operationLineage",
        `Verified operation ${operation.id} lacks exact animation transformation lineage.`
      );
    }
  }
  return undefined;
}

function claimIds(namespace: string): ClaimIds {
  return {
    initial: `claim.${namespace}.initial-equation`,
    subtractOperation: `claim.${namespace}.subtract-preserves-equality`,
    afterSubtract: `claim.${namespace}.after-subtract`,
    divideOperation: `claim.${namespace}.divide-preserves-equality`,
    solution: `claim.${namespace}.verified-solution`
  };
}

function createClaimAuthority(
  bridge: KpVerifiedLinearProblemAnimationBridgeContract,
  ids: ClaimIds
): KpExplanationVerifiedClaimAuthorityV1 {
  const frame = bridge.trace.frames;
  const operation = bridge.trace.operations;
  const claim = (
    id: string,
    kind: KpExplanationVerifiedClaimV1["kind"],
    sourceRefId: string
  ): KpExplanationVerifiedClaimV1 => Object.freeze({
    id,
    instanceId: bridge.identity.instanceId,
    kind,
    sourceRefId,
    verification: "provider-verified"
  });
  return Object.freeze({
    schemaVersion: "kp.explanation-verified-claim-authority.v1" as const,
    instanceId: bridge.identity.instanceId,
    claims: Object.freeze([
      claim(ids.initial, "equation-frame", frame[0]!.id),
      claim(
        ids.subtractOperation,
        "equivalence-operation",
        operation[0]!.id
      ),
      claim(ids.afterSubtract, "equation-frame", frame[1]!.id),
      claim(
        ids.divideOperation,
        "equivalence-operation",
        operation[1]!.id
      ),
      claim(ids.solution, "solution", frame[2]!.id)
    ])
  });
}

function createHandAuthoredSpine(
  bridge: KpVerifiedLinearProblemAnimationBridgeContract,
  claims: ClaimIds
): KpExplanationSpineV1 {
  const namespace = bridge.identity.semanticNamespace;
  const frames = bridge.trace.frames;
  const operations = bridge.trace.operations;
  const beatId = (suffix: string) => `beat.${namespace}.${suffix}`;
  const beat = (
    suffix: string,
    kind: KpExplanationSpineBeatV1["kind"],
    templateId: KpExplanationSpineBeatV1["templateId"],
    claimRefs: readonly string[],
    vocabularyRefs: readonly KpExplanationVocabularyId[],
    source:
      | { readonly sourceFrameRef: string }
      | { readonly sourceOperationRef: string }
  ): KpExplanationSpineBeatV1 => ({
    id: beatId(suffix),
    kind,
    templateId,
    claimRefs,
    vocabularyRefs,
    ...source
  });
  const beats = [
    beat(
      "goal",
      "goal",
      "solve.goal.variable-alone",
      [claims.initial],
      ["unknown", "variable-alone"],
      { sourceFrameRef: frames[0]!.id }
    ),
    beat(
      "invariant",
      "invariant",
      "solve.invariant.same-change",
      [claims.subtractOperation],
      ["both-sides", "same-change", "equal"],
      { sourceOperationRef: operations[0]!.id }
    ),
    beat(
      "subtract-action",
      "action",
      "solve.action.subtract-both-sides",
      [claims.subtractOperation],
      ["subtract", "both-sides"],
      { sourceOperationRef: operations[0]!.id }
    ),
    beat(
      "additive-cancellation",
      "mechanism",
      "solve.mechanism.additive-cancellation",
      [claims.subtractOperation],
      ["plus", "minus", "undo"],
      { sourceOperationRef: operations[0]!.id }
    ),
    beat(
      "subtraction-checkpoint",
      "checkpoint",
      "solve.checkpoint.subtraction",
      [claims.afterSubtract],
      ["equal"],
      { sourceFrameRef: frames[1]!.id }
    ),
    beat(
      "divide-action",
      "action",
      "solve.action.divide-both-sides",
      [claims.divideOperation],
      ["divide", "both-sides"],
      { sourceOperationRef: operations[1]!.id }
    ),
    beat(
      "multiplicative-cancellation",
      "mechanism",
      "solve.mechanism.multiplicative-cancellation",
      [claims.divideOperation],
      ["divide", "undo"],
      { sourceOperationRef: operations[1]!.id }
    ),
    beat(
      "solution",
      "payoff",
      "solve.payoff.verified-solution",
      [claims.solution],
      ["unknown", "equal"],
      { sourceFrameRef: frames[2]!.id }
    )
  ] as const;
  const section = (
    kind: KpExplanationSpineV1["sections"][number]["kind"],
    suffixes: readonly string[]
  ) => ({
    id: `section.${namespace}.${kind}`,
    kind,
    beatIds: suffixes.map(beatId)
  });
  return {
    schemaVersion: "kp.explanation-spine.v1",
    id: `spine.${namespace}`,
    instanceId: bridge.identity.instanceId,
    sourceTraceId: bridge.trace.id,
    learnerState: {
      schemaVersion: "kp.explanation-learner-state.v1",
      id: "learner-state.early-algebra.standard",
      level: "early-algebra-foundation",
      detail: "standard",
      assumedConceptIds: [
        "whole-number-arithmetic",
        "operation-symbols",
        "equals-means-equal",
        "letter-as-unknown"
      ],
      targetConceptIds: [
        "undo-in-useful-order",
        "same-change-keeps-equality"
      ]
    },
    vocabulary: {
      schemaVersion: "kp.explanation-vocabulary.v1",
      id: "vocabulary.early-algebra.solve.standard",
      familiar: [
        "both-sides",
        "divide",
        "equal",
        "equals-sign",
        "minus",
        "number",
        "plus",
        "subtract",
        "unknown"
      ],
      introduced: ["same-change", "undo", "variable-alone"],
      blocked: [
        "additive-term",
        "inverse-operation",
        "isolate-variable",
        "preserve-equality",
        "verify-by-substitution"
      ],
      notationReadings: [
        "equals.as-equal-to",
        "fraction.as-divided-by",
        "variable.as-unknown"
      ],
      cueWordLimit: 12,
      sentenceShape: "one-clause"
    },
    sections: [
      section("orientation", ["goal", "invariant"]),
      section("subtract", [
        "subtract-action",
        "additive-cancellation",
        "subtraction-checkpoint"
      ]),
      section("divide", ["divide-action", "multiplicative-cancellation"]),
      section("solution", ["solution"])
    ],
    beats
  };
}

function createLearnerProjection(input: {
  readonly bridge: KpVerifiedLinearProblemAnimationBridgeContract;
  readonly animation: KpAnimationAsset;
  readonly spine: KpExplanationSpineV1;
  readonly claims: ClaimIds;
}): KpExplanationLearnerProjectionV1 | {
  readonly diagnostics:
    readonly KpVerifiedLinearProblemExplanationDiagnostic[];
} {
  const objects = new Map(
    input.animation.bundle.objects.map((object) => [object.id, object])
  );
  const namespace = input.bridge.identity.semanticNamespace;
  const objectIds = {
    initial: `equation.${namespace}.initial`,
    subtractIntroduced: `equation.${namespace}.subtract-introduced`,
    afterSubtract: `equation.${namespace}.after-subtract`,
    divideIntroduced: `equation.${namespace}.divide-introduced`,
    solved: `equation.${namespace}.solved`
  };
  const requiredObjects = Object.values(objectIds).map((id) => objects.get(id));
  if (requiredObjects.some((object) => object === undefined)) {
    return {
      diagnostics: Object.freeze([
        diagnostic(
          "missing-claim-source",
          "$.animation.bundle.objects",
          "Learner projection requires every trusted generated equation state."
        )
      ])
    };
  }
  const initial = objects.get(objectIds.initial)!;
  const subtractIntroduced = objects.get(objectIds.subtractIntroduced)!;
  const afterSubtract = objects.get(objectIds.afterSubtract)!;
  const divideIntroduced = objects.get(objectIds.divideIntroduced)!;
  const solved = objects.get(objectIds.solved)!;
  const beatById = new Map(input.spine.beats.map((beat) => [beat.id, beat]));
  const cueByBeatId = new Map(input.spine.beats.map((beat) => [
    beat.id,
    projectBeat({
      beat,
      bridge: input.bridge,
      claims: input.claims,
      objects: {
        initial,
        subtractIntroduced,
        afterSubtract,
        divideIntroduced,
        solved
      }
    })
  ]));
  const sections = input.spine.sections.map((section) => Object.freeze({
    id: `projection.${section.id}`,
    spineSectionId: section.id,
    kind: section.kind,
    cues: Object.freeze(section.beatIds.map((beatId) => {
      if (!beatById.has(beatId) || !cueByBeatId.has(beatId)) {
        throw new Error(`Validated spine lost beat ${beatId}.`);
      }
      return cueByBeatId.get(beatId)!;
    }))
  }));
  const projection: KpExplanationLearnerProjectionV1 = {
    schemaVersion: "kp.explanation-learner-projection.v1",
    id: `projection.${input.spine.id}.learner`,
    instanceId: input.spine.instanceId,
    spineId: input.spine.id,
    learnerStateId: input.spine.learnerState.id,
    sections: Object.freeze(sections)
  };
  const issues = validateProjection(projection, input.animation, input.spine);
  return issues.length === 0
    ? projection
    : { diagnostics: Object.freeze(issues) };
}

function projectBeat(input: {
  readonly beat: KpExplanationSpineBeatV1;
  readonly bridge: KpVerifiedLinearProblemAnimationBridgeContract;
  readonly claims: ClaimIds;
  readonly objects: Readonly<{
    initial: KpSemanticAssetObject;
    subtractIntroduced: KpSemanticAssetObject;
    afterSubtract: KpSemanticAssetObject;
    divideIntroduced: KpSemanticAssetObject;
    solved: KpSemanticAssetObject;
  }>;
}): KpExplanationLearnerCueV1 {
  const { beat, bridge, claims, objects } = input;
  const initialEquation = bridge.trace.frames[0]!.equation;
  const variable = initialEquation.left.variable;
  const addend = initialEquation.left.constant.numerator;
  const coefficient = initialEquation.left.coefficient.numerator;
  const text = (value: string): KpExplanationTextSegmentV1 => ({
    kind: "text",
    text: value
  });
  const math = (
    latex: string,
    claimRef: string,
    object: KpSemanticAssetObject,
    selectorPaths: readonly string[]
  ): KpExplanationMathSegmentV1 => ({
    kind: "math",
    latex,
    claimRef,
    sourceObjectId: object.id,
    sourceSelectorIds: selectorPaths.map((path) => `${object.id}.${path}`)
  });
  let segments: readonly KpExplanationSegmentV1[];
  switch (beat.templateId) {
    case "solve.goal.variable-alone":
      segments = [
        text("Get "),
        math(variable, claims.initial, objects.initial, ["lhs.variable"]),
        text(" by itself.")
      ];
      break;
    case "solve.invariant.same-change":
      segments = [
        text("Make the same change on both sides to keep them equal.")
      ];
      break;
    case "solve.action.subtract-both-sides":
      segments = [
        text("Subtract "),
        math(addend, claims.subtractOperation, objects.initial, ["lhs.addend"]),
        text(" from both sides.")
      ];
      break;
    case "solve.mechanism.additive-cancellation":
      segments = [
        math(`+${addend}`, claims.subtractOperation, objects.subtractIntroduced, ["lhs.addend"]),
        text(" and "),
        math(`-${addend}`, claims.subtractOperation, objects.subtractIntroduced, ["lhs.subtract"]),
        text(" undo each other.")
      ];
      break;
    case "solve.checkpoint.subtraction":
      segments = [
        text("The equation is now "),
        math(
          objectLatex(objects.afterSubtract),
          claims.afterSubtract,
          objects.afterSubtract,
          objects.afterSubtract.selectors.map(({ id }) =>
            selectorPath(objects.afterSubtract, id)
          )
        ),
        text(".")
      ];
      break;
    case "solve.action.divide-both-sides":
      segments = [
        text("Divide both sides by "),
        math(coefficient, claims.divideOperation, objects.afterSubtract, ["lhs.coefficient"]),
        text(".")
      ];
      break;
    case "solve.mechanism.multiplicative-cancellation":
      segments = [
        math(
          `\\frac{${coefficient}${variable}}{${coefficient}}`,
          claims.divideOperation,
          objects.divideIntroduced,
          ["lhs.coefficient", "lhs.variable", "lhs.rule", "lhs.divide"]
        ),
        text(" leaves "),
        math(variable, claims.divideOperation, objects.solved, ["lhs.variable"]),
        text(" on the left.")
      ];
      break;
    case "solve.payoff.verified-solution":
      segments = [
        math(
          objectLatex(objects.solved),
          claims.solution,
          objects.solved,
          objects.solved.selectors.map(({ id }) =>
            selectorPath(objects.solved, id)
          )
        ),
        text(" is the verified solution.")
      ];
      break;
  }
  return Object.freeze({
    id: `cue.${beat.id}`,
    beatId: beat.id,
    kind: beat.kind,
    templateId: beat.templateId,
    claimRefs: Object.freeze([...beat.claimRefs]),
    vocabularyRefs: Object.freeze([...beat.vocabularyRefs]),
    segments: Object.freeze(segments.map((segment) =>
      segment.kind === "math"
        ? Object.freeze({
            ...segment,
            sourceSelectorIds: Object.freeze([...segment.sourceSelectorIds])
          })
        : Object.freeze({ ...segment })
    )),
    wordCount: cueWordCount(segments)
  });
}

function validateProjection(
  projection: KpExplanationLearnerProjectionV1,
  animation: KpAnimationAsset,
  spine: KpExplanationSpineV1
): readonly KpVerifiedLinearProblemExplanationDiagnostic[] {
  const diagnostics: KpVerifiedLinearProblemExplanationDiagnostic[] = [];
  const objectIds = new Set(animation.bundle.objects.map(({ id }) => id));
  const selectorIds = new Set(animation.bundle.objects.flatMap((object) =>
    object.selectors.map(({ id }) => id)
  ));
  const claimRefs = new Set(spine.beats.flatMap((beat) => beat.claimRefs));
  for (const [sectionIndex, section] of projection.sections.entries()) {
    for (const [cueIndex, cue] of section.cues.entries()) {
      const path = `$.projection.sections[${sectionIndex}].cues[${cueIndex}]`;
      if (cue.wordCount > spine.vocabulary.cueWordLimit) {
        diagnostics.push(diagnostic(
          "projection-invalid",
          `${path}.wordCount`,
          `Cue ${cue.id} exceeds the ${spine.vocabulary.cueWordLimit}-word limit.`
        ));
      }
      for (const segment of cue.segments) {
        if (segment.kind !== "math") continue;
        if (
          !claimRefs.has(segment.claimRef) ||
          !cue.claimRefs.includes(segment.claimRef) ||
          !objectIds.has(segment.sourceObjectId) ||
          segment.sourceSelectorIds.length === 0 ||
          segment.sourceSelectorIds.some((id) => !selectorIds.has(id))
        ) {
          diagnostics.push(diagnostic(
            "projection-invalid",
            `${path}.segments`,
            `Math segment in ${cue.id} lacks exact claim, object, or selector authority.`
          ));
        }
      }
    }
  }
  return diagnostics;
}

function objectLatex(object: KpSemanticAssetObject): string {
  const value = object.value;
  if (
    typeof value !== "object" ||
    value === null ||
    !("latex" in value) ||
    typeof value.latex !== "string"
  ) {
    throw new Error(`Equation object ${object.id} requires trusted LaTeX.`);
  }
  return value.latex;
}

function selectorPath(object: KpSemanticAssetObject, selectorId: string): string {
  return selectorId.slice(object.id.length + 1);
}

function cueWordCount(segments: readonly KpExplanationSegmentV1[]): number {
  return segments.reduce((count, segment) => {
    if (segment.kind === "math") return count + 1;
    return count + segment.text
      .trim()
      .split(/\s+/u)
      .filter(Boolean)
      .length;
  }, 0);
}

function rejected(
  code: KpVerifiedLinearProblemExplanationDiagnostic["code"],
  path: string,
  message: string
): KpVerifiedLinearProblemExplanationCompileResult {
  return Object.freeze({
    status: "rejected" as const,
    diagnostics: Object.freeze([diagnostic(code, path, message)])
  });
}

function diagnostic(
  code: KpVerifiedLinearProblemExplanationDiagnostic["code"],
  path: string,
  message: string
): KpVerifiedLinearProblemExplanationDiagnostic {
  return Object.freeze({ severity: "error", code, path, message });
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
