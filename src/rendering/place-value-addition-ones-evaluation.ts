import type {
  KpPlaceValueAdditionPresentationPlan
} from "../animation/place-value-addition-presentation-plan.ts";
import type {
  KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentation,
  type KpRegisteredSuccessorSynthesisBinding
} from "../animation/successor-synthesis-presentation-plan.ts";
import type {
  KpPlaceValueWrittenColumnProjection,
  KpPlaceValueWrittenColumn
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  type KpExecutableSuccessorMotifProgramAdapterDispatch
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import type {
  KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpPlaceValueNativeSceneDom
} from "./place-value-addition-native-scene-dom.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection,
  type KpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";
import {
  bindKpPlaceValueWrittenMotionProxy,
  compileKpPlaceValueOnesWrittenOwnership,
  isKpPlaceValueOnesWrittenOwnershipPlan,
  type KpPlaceValueOnesWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";

declare const kpPlaceValueOnesEvaluationBrand: unique symbol;
declare const kpPlaceValueTensEvaluationBrand: unique symbol;
declare const kpPlaceValueHundredsEvaluationBrand: unique symbol;

const sealedEvaluations = new WeakSet<object>();

type OperationDispatch = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "operation-evaluation" }
>;

interface KpPlaceValueColumnEvaluationBase {
  readonly binding: KpRegisteredSuccessorSynthesisBinding;
  readonly forward: OperationDispatch;
  readonly rewind: OperationDispatch;
  readonly catalystSelectorId: "operator.add";
  readonly opacityPolicy: "opaque";
}

export interface KpPlaceValueOnesEvaluation extends
KpPlaceValueColumnEvaluationBase {
  readonly schemaVersion: "kp.place-value-addition-ones-evaluation.v1";
  readonly beatId: "beat.place-value.evaluate-ones";
  readonly place: "ones";
  readonly expression: "8 + 6 = 14";
  readonly materialSelectorIds: readonly [
    "digit.first.ones",
    "digit.second.ones"
  ];
  readonly targetSelectorIds: readonly [
    "evaluation.ones.total.tens",
    "evaluation.ones.total.ones"
  ];
  readonly writtenOwnership: KpPlaceValueOnesWrittenOwnershipPlan;
  readonly [kpPlaceValueOnesEvaluationBrand]: true;
}

export interface KpPlaceValueTensEvaluation extends
KpPlaceValueColumnEvaluationBase {
  readonly schemaVersion: "kp.place-value-addition-tens-evaluation.v1";
  readonly beatId: "beat.place-value.evaluate-tens";
  readonly place: "tens";
  readonly expression: "1 + 7 + 5 = 13";
  readonly materialSelectorIds: readonly [
    "carry.tens",
    "digit.first.tens",
    "digit.second.tens"
  ];
  readonly targetSelectorIds: readonly [
    "evaluation.tens.total.hundreds",
    "evaluation.tens.total.tens"
  ];
  readonly [kpPlaceValueTensEvaluationBrand]: true;
}

export interface KpPlaceValueHundredsEvaluation extends
KpPlaceValueColumnEvaluationBase {
  readonly schemaVersion: "kp.place-value-addition-hundreds-evaluation.v1";
  readonly beatId: "beat.place-value.evaluate-hundreds";
  readonly place: "hundreds";
  readonly expression: "1 + 2 + 1 = 4";
  readonly materialSelectorIds: readonly [
    "carry.hundreds",
    "digit.first.hundreds",
    "digit.second.hundreds"
  ];
  readonly targetSelectorIds: readonly ["result.hundreds"];
  readonly [kpPlaceValueHundredsEvaluationBrand]: true;
}

export type KpPlaceValueColumnEvaluation =
  | KpPlaceValueOnesEvaluation
  | KpPlaceValueTensEvaluation
  | KpPlaceValueHundredsEvaluation;

export interface KpPlaceValueColumnEvaluationDom {
  readonly root: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly prepare: () => void;
  readonly apply: (
    progress: number,
    direction: "forward" | "rewind"
  ) => KpNativeKatexSceneOwnershipFrame;
  readonly dispose: () => void;
}

export type KpPlaceValueOnesEvaluationDom =
  KpPlaceValueColumnEvaluationDom;
export type KpPlaceValueTensEvaluationDom =
  KpPlaceValueColumnEvaluationDom;
export type KpPlaceValueHundredsEvaluationDom =
  KpPlaceValueColumnEvaluationDom;

interface EvaluationConfig {
  readonly place: "ones" | "tens" | "hundreds";
  readonly schemaVersion:
    | KpPlaceValueOnesEvaluation["schemaVersion"]
    | KpPlaceValueTensEvaluation["schemaVersion"]
    | KpPlaceValueHundredsEvaluation["schemaVersion"];
  readonly beatId:
    | KpPlaceValueOnesEvaluation["beatId"]
    | KpPlaceValueTensEvaluation["beatId"]
    | KpPlaceValueHundredsEvaluation["beatId"];
  readonly expression:
    | KpPlaceValueOnesEvaluation["expression"]
    | KpPlaceValueTensEvaluation["expression"]
    | KpPlaceValueHundredsEvaluation["expression"];
  readonly materialSelectorIds: readonly [string, string, ...string[]];
  readonly targetDigits: readonly [{
    readonly id: string;
    readonly column: KpPlaceValueWrittenColumn;
    readonly latex: string;
  }, ...{
    readonly id: string;
    readonly column: KpPlaceValueWrittenColumn;
    readonly latex: string;
  }[]];
  readonly sourceHiddenIds: readonly string[];
  readonly sourceVisibleIds: readonly string[];
  readonly stageDataset:
    | "kpPlaceValueOnesEvaluation"
    | "kpPlaceValueTensEvaluation"
    | "kpPlaceValueHundredsEvaluation";
}

const evaluationConfigs = Object.freeze({
  ones: Object.freeze({
    place: "ones" as const,
    schemaVersion:
      "kp.place-value-addition-ones-evaluation.v1" as const,
    beatId: "beat.place-value.evaluate-ones" as const,
    expression: "8 + 6 = 14" as const,
    materialSelectorIds: Object.freeze([
      "digit.first.ones",
      "digit.second.ones"
    ] as const),
    targetDigits: Object.freeze([
      Object.freeze({
        id: "evaluation.ones.total.tens",
        column: "tens" as const,
        latex: "1"
      }),
      Object.freeze({
        id: "evaluation.ones.total.ones",
        column: "ones" as const,
        latex: "4"
      })
    ] as const),
    sourceHiddenIds: Object.freeze([]),
    sourceVisibleIds: Object.freeze([]),
    stageDataset: "kpPlaceValueOnesEvaluation" as const
  }),
  tens: Object.freeze({
    place: "tens" as const,
    schemaVersion:
      "kp.place-value-addition-tens-evaluation.v1" as const,
    beatId: "beat.place-value.evaluate-tens" as const,
    expression: "1 + 7 + 5 = 13" as const,
    materialSelectorIds: Object.freeze([
      "carry.tens",
      "digit.first.tens",
      "digit.second.tens"
    ] as const),
    targetDigits: Object.freeze([
      Object.freeze({
        id: "evaluation.tens.total.hundreds",
        column: "hundreds" as const,
        latex: "1"
      }),
      Object.freeze({
        id: "evaluation.tens.total.tens",
        column: "tens" as const,
        latex: "3"
      })
    ] as const),
    sourceHiddenIds: Object.freeze([
      "digit.first.ones",
      "digit.second.ones"
    ]),
    sourceVisibleIds: Object.freeze([
      "carry.tens",
      "result.ones"
    ]),
    stageDataset: "kpPlaceValueTensEvaluation" as const
  }),
  hundreds: Object.freeze({
    place: "hundreds" as const,
    schemaVersion:
      "kp.place-value-addition-hundreds-evaluation.v1" as const,
    beatId: "beat.place-value.evaluate-hundreds" as const,
    expression: "1 + 2 + 1 = 4" as const,
    materialSelectorIds: Object.freeze([
      "carry.hundreds",
      "digit.first.hundreds",
      "digit.second.hundreds"
    ] as const),
    targetDigits: Object.freeze([
      Object.freeze({
        id: "result.hundreds",
        column: "hundreds" as const,
        latex: "4"
      })
    ] as const),
    sourceHiddenIds: Object.freeze([
      "digit.first.ones",
      "digit.second.ones",
      "digit.first.tens",
      "digit.second.tens",
      "carry.tens"
    ]),
    sourceVisibleIds: Object.freeze([
      "carry.hundreds",
      "result.tens",
      "result.ones",
      "operator.add"
    ]),
    stageDataset: "kpPlaceValueHundredsEvaluation" as const
  })
}) satisfies Readonly<
  Record<"ones" | "tens" | "hundreds", EvaluationConfig>
>;

export function compileKpPlaceValueOnesEvaluation(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueOnesEvaluation {
  return compileColumnEvaluation(
    presentation,
    evaluationConfigs.ones
  ) as KpPlaceValueOnesEvaluation;
}

export function compileKpPlaceValueTensEvaluation(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueTensEvaluation {
  return compileColumnEvaluation(
    presentation,
    evaluationConfigs.tens
  ) as KpPlaceValueTensEvaluation;
}

export function compileKpPlaceValueHundredsEvaluation(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueHundredsEvaluation {
  return compileColumnEvaluation(
    presentation,
    evaluationConfigs.hundreds
  ) as KpPlaceValueHundredsEvaluation;
}

function compileColumnEvaluation(
  presentation: KpPlaceValueAdditionPresentationPlan,
  config: EvaluationConfig
): KpPlaceValueColumnEvaluation {
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === config.beatId
  );
  const program = beat?.programs[0];
  if (
    beat?.kind !== "evaluate" ||
    program?.kind !== "operation-evaluation" ||
    program.expression !== config.expression ||
    program.catalystId !== "operator.add" ||
    program.executableProgram.kind !== "operation-evaluation" ||
    !sameIds(program.contributorIds, config.materialSelectorIds)
  ) {
    throw new Error(
      `${config.place} evaluation requires its exhaustive presentation.`
    );
  }
  const executableProgram = program.executableProgram;
  const writtenOwnership =
    config.place === "ones"
      ? compileKpPlaceValueOnesWrittenOwnership()
      : undefined;
  const binding = createBinding(config, writtenOwnership);
  const compiled = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: `transformation.place-value.evaluate-${config.place}`,
    transformationKind: "simplifyConstantSum",
    binding
  });
  if (
    compiled.status !== "compiled" ||
    compiled.executableProgram !== executableProgram
  ) {
    throw new Error(
      `${config.place} evaluation did not resolve the canonical program.`
    );
  }
  const registered = Object.freeze({
    ...binding,
    operationPresentationPlan: compiled.operationPresentationPlan,
    paintContinuityPlan: compiled.paintContinuityPlan,
    continuityProgram: compiled.continuityProgram
  }) satisfies KpRegisteredSuccessorSynthesisBinding;
  const dispatch = (direction: "forward" | "rewind"): OperationDispatch => {
    const candidate = compileKpExecutableSuccessorMotifProgramAdapter({
      kind: "operation-evaluation",
      program: executableProgram,
      direction,
      primitive: {
        kind: "native-katex-successor-synthesis",
        intents: [{
          binding: registered,
          direction,
          motion: "full"
        }]
      }
    });
    if (candidate.programKind !== "operation-evaluation") {
      throw new Error(
        `${config.place} evaluation resolved the wrong motif adapter.`
      );
    }
    return candidate;
  };
  const evaluation = Object.freeze({
    schemaVersion: config.schemaVersion,
    beatId: config.beatId,
    place: config.place,
    expression: config.expression,
    materialSelectorIds:
      Object.freeze([...config.materialSelectorIds]),
    catalystSelectorId: "operator.add" as const,
    targetSelectorIds:
      Object.freeze(config.targetDigits.map(({ id }) => id)),
    ...(writtenOwnership === undefined ? {} : { writtenOwnership }),
    binding: registered,
    forward: dispatch("forward"),
    rewind: dispatch("rewind"),
    opacityPolicy: "opaque" as const
  });
  sealedEvaluations.add(evaluation);
  return evaluation as unknown as KpPlaceValueColumnEvaluation;
}

export function isKpPlaceValueOnesEvaluation(
  value: unknown
): value is KpPlaceValueOnesEvaluation {
  return isSealedEvaluation(value) &&
    value.beatId === "beat.place-value.evaluate-ones";
}

export function isKpPlaceValueTensEvaluation(
  value: unknown
): value is KpPlaceValueTensEvaluation {
  return isSealedEvaluation(value) &&
    value.beatId === "beat.place-value.evaluate-tens";
}

export function isKpPlaceValueHundredsEvaluation(
  value: unknown
): value is KpPlaceValueHundredsEvaluation {
  return isSealedEvaluation(value) &&
    value.beatId === "beat.place-value.evaluate-hundreds";
}

export function createKpPlaceValueOnesEvaluationDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly evaluation: KpPlaceValueOnesEvaluation;
}): KpPlaceValueOnesEvaluationDom {
  if (!isKpPlaceValueOnesEvaluation(input.evaluation)) {
    throw new Error("Ones-evaluation DOM requires compiler-owned authority.");
  }
  return createColumnEvaluationDom({
    ...input,
    config: evaluationConfigs.ones,
    writtenOwnership: input.evaluation.writtenOwnership
  });
}

export function createKpPlaceValueTensEvaluationDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly evaluation: KpPlaceValueTensEvaluation;
}): KpPlaceValueTensEvaluationDom {
  if (!isKpPlaceValueTensEvaluation(input.evaluation)) {
    throw new Error("Tens-evaluation DOM requires compiler-owned authority.");
  }
  return createColumnEvaluationDom({
    ...input,
    config: evaluationConfigs.tens
  });
}

export function createKpPlaceValueHundredsEvaluationDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly evaluation: KpPlaceValueHundredsEvaluation;
}): KpPlaceValueHundredsEvaluationDom {
  if (!isKpPlaceValueHundredsEvaluation(input.evaluation)) {
    throw new Error(
      "Hundreds-evaluation DOM requires compiler-owned authority."
    );
  }
  return createColumnEvaluationDom({
    ...input,
    config: evaluationConfigs.hundreds
  });
}

function createColumnEvaluationDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly evaluation: KpPlaceValueColumnEvaluation;
  readonly config: EvaluationConfig;
  readonly writtenOwnership?: KpPlaceValueOnesWrittenOwnershipPlan;
}): KpPlaceValueColumnEvaluationDom {
  const source = createKpPlaceValueWrittenColumnDomProjection({
    document: input.document,
    projection: input.projection,
    endpoint: "initial"
  });
  const target = createKpPlaceValueWrittenColumnDomProjection({
    document: input.document,
    projection: input.projection,
    endpoint: "initial"
  });
  if (input.writtenOwnership === undefined) {
    configureSource(source, input.config);
    configureSource(target, input.config);
    for (const selectorId of [
      ...input.evaluation.materialSelectorIds,
      input.evaluation.catalystSelectorId
    ]) {
      target.cellElements.get(selectorId)!.dataset["kpVisibility"] = "hidden";
    }
  } else {
    configureOnesOverlayEndpoints({
      source,
      target,
      ownership: input.writtenOwnership
    });
  }
  const targetGrid = target.root.querySelector<HTMLElement>(
    "[data-kp-place-value-grid]"
  );
  if (targetGrid === null) {
    throw new Error(
      `${input.config.place} evaluation target lacks its semantic grid.`
    );
  }
  for (const [index, digit] of input.config.targetDigits.entries()) {
    const nativeTarget = target.cellElements.get(digit.id);
    if (nativeTarget !== undefined) {
      // Final-column output already has a canonical native endpoint root.
      // Reusing it prevents an appended transient glyph from changing font or
      // baseline during the final settlement handoff.
      nativeTarget.dataset["kpVisibility"] = "visible";
    } else {
      targetGrid.append(evaluationDigit(
        input.document,
        digit,
        input.writtenOwnership?.evaluationOutputProxies[index]
      ));
    }
  }
  const scene = createKpPlaceValueNativeSceneDom({
    document: input.document,
    sourceRoot: source.root,
    targetRoot: target.root,
    sourceSceneId:
      `scene.place-value.${input.config.place}-evaluation.source`,
    targetSceneId:
      `scene.place-value.${input.config.place}-evaluation.target`,
    successorSyntheses: [{
      binding: input.evaluation.binding,
      direction: "forward",
      motion: "full"
    }]
  });
  scene.root.dataset[input.config.stageDataset] = "";
  scene.root.dataset["kpOperationEvaluationProgramId"] =
    input.evaluation.forward.programId;
  const prepare = (): void => {
    scene.prepare();
    if (input.writtenOwnership !== undefined) {
      suppressPersistentSourceCopies(source, input.writtenOwnership);
    }
  };
  return Object.freeze({
    root: scene.root,
    sourceRoot: scene.sourceRoot,
    targetRoot: scene.targetRoot,
    prepare,
    apply(progress: number, direction: "forward" | "rewind") {
      prepare();
      const execution =
        direction === "forward"
          ? input.evaluation.forward
          : input.evaluation.rewind;
      const telemetry = execution.samplePhaseTelemetry(progress);
      scene.root.dataset["kpOperationEvaluationDirection"] = direction;
      scene.root.dataset["kpOperationEvaluationPhaseId"] =
        telemetry.activePhaseId;
      scene.root.dataset["kpOperationEvaluationProgress"] = String(progress);
      const ownership = scene.apply(progress);
      if (input.writtenOwnership !== undefined) {
        suppressCompilerOnlyCatalyst(scene.root, input.writtenOwnership);
      }
      return ownership;
    },
    dispose: scene.dispose
  });
}

function configureSource(
  dom: KpPlaceValueWrittenColumnDomProjection,
  config: EvaluationConfig
): void {
  for (const id of config.sourceHiddenIds) {
    dom.cellElements.get(id)!.dataset["kpVisibility"] = "hidden";
  }
  for (const id of config.sourceVisibleIds) {
    dom.cellElements.get(id)!.dataset["kpVisibility"] = "visible";
  }
}

function createBinding(
  config: EvaluationConfig,
  ownership?: KpPlaceValueOnesWrittenOwnershipPlan
): KpSuccessorSynthesisBinding {
  const materialSelectorIds = ownership === undefined
    ? config.materialSelectorIds
    : ownership.contributionProxies.map(
        bindKpPlaceValueWrittenMotionProxy
      );
  const catalystSelectorId = ownership === undefined
    ? "operator.add"
    : bindKpPlaceValueWrittenMotionProxy(ownership.catalystProxy);
  const material = materialSelectorIds.map((selectorId, index) =>
    Object.freeze({
      id: `annotation.${config.place}.material.${index}`,
      semanticRole: `${config.place}-column-contributor`,
      selectorIds: Object.freeze([selectorId]),
      contribution: "material-input" as const,
      propagationRank: index,
      pathFamily: index % 2 === 0
        ? "arc-above" as const
        : "arc-below" as const
    })
  );
  const targets = config.targetDigits.map((digit, index) =>
    Object.freeze({
      id: `annotation.${config.place}.total.${index}`,
      semanticRole: `evaluated-${config.place}-total-digit`,
      selectorIds: Object.freeze([
        ownership === undefined
          ? digit.id
          : bindKpPlaceValueWrittenMotionProxy(
              ownership.evaluationOutputProxies[index]!
            )
      ]),
      propagationRank: index,
      pathFamily: index % 2 === 0
        ? "arc-above" as const
        : "arc-below" as const
    })
  );
  return Object.freeze({
    id: `successor.place-value.evaluate-${config.place}`,
    relationRecordId: `relation.place-value.evaluate-${config.place}`,
    authority: Object.freeze({
      operationId: "kp.arithmetic.add",
      bindingId: `binding.place-value.evaluate-${config.place}`
    }),
    // The semantic grid—not browser-dependent KaTeX wrapper overlap—owns the
    // fact that operands and result occupy distinct bands around the rule.
    layoutTopology: "separate-source-result-bands" as const,
    ...(ownership?.contributionDestinationPolicy ===
      "measured-evaluated-total-native-paint"
      ? { convergenceAnchor: "target-destination" as const }
      : {}),
    sourceAnnotations: Object.freeze([
      ...material,
      Object.freeze({
        id: `annotation.${config.place}.plus`,
        semanticRole: "addition-catalyst",
        selectorIds: Object.freeze([catalystSelectorId]),
        contribution: "catalyst" as const,
        propagationRank: 0,
        pathFamily: "arc-below" as const
      })
    ]),
    targetAnnotations: Object.freeze(targets),
    lineages: Object.freeze([
      Object.freeze({
        id: `lineage.place-value.evaluate-${config.place}`,
        sourceAnnotationIds:
          Object.freeze(material.map(({ id }) => id)),
        targetAnnotationIds:
          Object.freeze(targets.map(({ id }) => id))
      })
    ])
  });
}

function configureOnesOverlayEndpoints(input: {
  readonly source: KpPlaceValueWrittenColumnDomProjection;
  readonly target: KpPlaceValueWrittenColumnDomProjection;
  readonly ownership: KpPlaceValueOnesWrittenOwnershipPlan;
}): void {
  if (!isKpPlaceValueOnesWrittenOwnershipPlan(input.ownership)) {
    throw new Error(
      "Ones overlay endpoints require compiler-owned written authority."
    );
  }
  hideProjectionPaint(input.source);
  hideProjectionPaint(input.target);
  for (const proxy of input.ownership.contributionProxies) {
    configureMotionProxy(input.source, proxy);
  }
  configureMotionProxy(input.source, input.ownership.catalystProxy);
}

function hideProjectionPaint(
  dom: KpPlaceValueWrittenColumnDomProjection
): void {
  for (const element of dom.cellElements.values()) {
    element.dataset["kpVisibility"] = "hidden";
  }
  const underline = dom.root.querySelector<HTMLElement>(
    "[data-kp-place-value-underline]"
  );
  if (underline !== null) underline.style.visibility = "hidden";
}

function configureMotionProxy(
  dom: KpPlaceValueWrittenColumnDomProjection,
  proxy: KpPlaceValueOnesWrittenOwnershipPlan[
    "contributionProxies"
  ][number] | KpPlaceValueOnesWrittenOwnershipPlan["catalystProxy"]
): void {
  const element = dom.cellElements.get(proxy.sourceCellId);
  if (element === undefined) {
    throw new Error(
      `Ones overlay lacks persistent source ${proxy.sourceCellId}.`
    );
  }
  element.dataset["kpVisibility"] = "visible";
  element.dataset["kpSemanticEntityId"] =
    bindKpPlaceValueWrittenMotionProxy(proxy);
  element.dataset["kpPresentationGroupId"] =
    bindKpPlaceValueWrittenMotionProxy(proxy);
  element.dataset["kpPlaceValueMotionRole"] = proxy.role;
  element.dataset["kpPlaceValueMotionSourceId"] = proxy.sourceCellId;
}

function suppressPersistentSourceCopies(
  source: KpPlaceValueWrittenColumnDomProjection,
  ownership: KpPlaceValueOnesWrittenOwnershipPlan
): void {
  for (const proxy of [
    ...ownership.contributionProxies,
    ownership.catalystProxy
  ]) {
    // Measurement mints the proxy from this native paint; afterwards the
    // persistent written node remains the only documentary endpoint owner.
    source.cellElements.get(proxy.sourceCellId)!.style.opacity = "0";
  }
}

function suppressCompilerOnlyCatalyst(
  root: HTMLElement,
  ownership: KpPlaceValueOnesWrittenOwnershipPlan
): void {
  const selectorId =
    bindKpPlaceValueWrittenMotionProxy(ownership.catalystProxy);
  for (const owner of root.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )) {
    if (
      owner.dataset["kpEquationMaterialSemanticEntityId"] ===
        "annotation.ones.plus"
    ) {
      // The operation program still receives its causal catalyst, while the
      // column-wide plus stays visibly owned by the persistent scaffold.
      owner.style.opacity = "0";
      owner.dataset["kpPlaceValueMotionRole"] =
        "compiler-only-stationary-paint";
      owner.dataset["kpPlaceValueMotionSelectorId"] = selectorId;
    }
  }
}

function evaluationDigit(
  document: Document,
  digit: EvaluationConfig["targetDigits"][number],
  proxy?: KpPlaceValueOnesWrittenOwnershipPlan[
    "evaluationOutputProxies"
  ][number]
): HTMLElement {
  const root = document.createElement("span");
  root.dataset["kpPlaceValueEvaluationDigit"] = "";
  root.dataset["kpPlaceValueNativeRoot"] = "";
  const selectorId =
    proxy === undefined
      ? digit.id
      : bindKpPlaceValueWrittenMotionProxy(proxy);
  root.dataset["kpSemanticEntityId"] = selectorId;
  root.dataset["kpPresentationGroupId"] = selectorId;
  if (proxy !== undefined) {
    root.dataset["kpPlaceValueMotionRole"] = proxy.role;
    root.dataset["kpPlaceValueMotionTargetId"] = proxy.semanticEntityId;
  }
  root.dataset["kpPlaceValueRow"] = "result";
  root.dataset["kpPlaceValueColumn"] = digit.column;
  root.dataset["kpVisibility"] = "visible";
  root.innerHTML = renderLatexToHtml(digit.latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return root;
}

function isSealedEvaluation(
  value: unknown
): value is KpPlaceValueColumnEvaluation {
  return typeof value === "object" &&
    value !== null &&
    sealedEvaluations.has(value);
}

function sameIds(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}
