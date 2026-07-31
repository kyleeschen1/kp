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
import {
  compileKpPlaceValueAdditionPositionPrograms,
  isKpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-program.ts";
import type {
  KpPlaceValueEvaluationDigitSpec,
  KpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-types.ts";
import type {
  KpPlaceValueWrittenColumnProjection
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
  compileKpPlaceValueWrittenOwnership,
  isKpPlaceValueWrittenOwnershipPlan,
  type KpPlaceValueWrittenMotionProxy,
  type KpPlaceValueWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";
import {
  createKpPlaceValueContributorFusionRenderer,
  isKpPlaceValueContributorFusionPlan,
  kpPlaceValueContributorFusionMotifKind,
  type KpPlaceValueEvaluationVisualMotif
} from "./place-value-addition-contributor-fusion-motif.ts";

declare const kpPlaceValueColumnEvaluationBrand: unique symbol;

const sealedEvaluations = new WeakSet<object>();

type OperationDispatch = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "operation-evaluation" }
>;

export interface KpPlaceValueColumnEvaluation {
  readonly schemaVersion: string;
  readonly program: KpPlaceValuePositionProgram;
  readonly beatId: string;
  readonly positionId: string;
  readonly expression: string;
  readonly materialSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly catalystSelectorId: "operator.add";
  readonly writtenOwnership: KpPlaceValueWrittenOwnershipPlan;
  readonly binding: KpRegisteredSuccessorSynthesisBinding;
  readonly forward: OperationDispatch;
  readonly rewind: OperationDispatch;
  readonly opacityPolicy: "opaque";
  readonly [kpPlaceValueColumnEvaluationBrand]: true;
}

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

export function compileKpPlaceValueColumnEvaluations(
  presentation: KpPlaceValueAdditionPresentationPlan
): readonly KpPlaceValueColumnEvaluation[] {
  return Object.freeze(
    compileKpPlaceValueAdditionPositionPrograms().map((program) =>
      compileKpPlaceValueColumnEvaluation(presentation, program)
    )
  );
}

export function compileKpPlaceValueColumnEvaluation(
  presentation: KpPlaceValueAdditionPresentationPlan,
  program: KpPlaceValuePositionProgram
): KpPlaceValueColumnEvaluation {
  if (!isKpPlaceValuePositionProgram(program)) {
    throw new Error(
      "Column evaluation requires a compiler-owned position program."
    );
  }
  const spec = program.evaluation;
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === spec.beatId
  );
  const operation = beat?.programs[0];
  if (
    beat?.kind !== "evaluate" ||
    operation?.kind !== "operation-evaluation" ||
    operation.expression !== spec.expression ||
    operation.catalystId !== "operator.add" ||
    operation.executableProgram.kind !== "operation-evaluation" ||
    !sameIds(operation.contributorIds, spec.contributorCellIds)
  ) {
    throw new Error(
      `Position ${program.position.sequenceIndex} evaluation requires its exhaustive presentation.`
    );
  }
  const executableProgram = operation.executableProgram;
  const writtenOwnership = compileKpPlaceValueWrittenOwnership(program);
  const binding = createBinding(program, writtenOwnership);
  const compiled = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId:
      `transformation.place-value.evaluate-${program.position.id}`,
    transformationKind: "simplifyConstantSum",
    binding
  });
  if (
    compiled.status !== "compiled" ||
    compiled.executableProgram !== executableProgram
  ) {
    throw new Error(
      `Position ${program.position.sequenceIndex} evaluation did not resolve the canonical program.`
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
        `Position ${program.position.sequenceIndex} evaluation resolved the wrong motif adapter.`
      );
    }
    return candidate;
  };
  const evaluation = Object.freeze({
    schemaVersion: spec.schemaVersion,
    program,
    beatId: spec.beatId,
    positionId: program.position.id,
    expression: spec.expression,
    materialSelectorIds: spec.contributorCellIds,
    catalystSelectorId: "operator.add" as const,
    targetSelectorIds: Object.freeze(spec.evaluationDigits.map(
      ({ semanticEntityId }) => semanticEntityId
    )),
    writtenOwnership,
    binding: registered,
    forward: dispatch("forward"),
    rewind: dispatch("rewind"),
    opacityPolicy: "opaque" as const
  });
  sealedEvaluations.add(evaluation);
  return evaluation as unknown as KpPlaceValueColumnEvaluation;
}

export function isKpPlaceValueColumnEvaluation(
  value: unknown
): value is KpPlaceValueColumnEvaluation {
  return typeof value === "object" &&
    value !== null &&
    sealedEvaluations.has(value);
}

export function createKpPlaceValueColumnEvaluationDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly evaluation: KpPlaceValueColumnEvaluation;
  readonly visualMotif: KpPlaceValueEvaluationVisualMotif;
}): KpPlaceValueColumnEvaluationDom {
  if (!isKpPlaceValueColumnEvaluation(input.evaluation)) {
    throw new Error(
      "Column-evaluation DOM requires compiler-owned authority."
    );
  }
  const { program, writtenOwnership: ownership } = input.evaluation;
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
  configureOverlayEndpoints({ source, target, ownership });
  const targetGrid = target.root.querySelector<HTMLElement>(
    "[data-kp-place-value-grid]"
  );
  if (targetGrid === null) {
    throw new Error(
      `Position ${program.position.sequenceIndex} evaluation target lacks its semantic grid.`
    );
  }
  for (const [index, digit] of program.evaluation.evaluationDigits.entries()) {
    const proxy = ownership.evaluationOutputProxies[index];
    if (proxy === undefined) {
      throw new Error("Evaluation output lacks typed motion ownership.");
    }
    const nativeTarget = target.cellElements.get(digit.semanticEntityId);
    if (nativeTarget === undefined) {
      targetGrid.append(evaluationDigit(
        input.document,
        input.projection,
        digit,
        proxy
      ));
    } else {
      configureEvaluationTarget(nativeTarget, proxy);
    }
  }
  const scene = createKpPlaceValueNativeSceneDom({
    document: input.document,
    sourceRoot: source.root,
    targetRoot: target.root,
    sourceSceneId:
      `scene.place-value.${program.position.id}-evaluation.source`,
    targetSceneId:
      `scene.place-value.${program.position.id}-evaluation.target`,
    successorSyntheses: [{
      binding: input.evaluation.binding,
      direction: "forward",
      motion: "full"
    }]
  });
  scene.root.dataset[program.evaluation.stageDataset] = "";
  scene.root.dataset["kpPlaceValuePositionId"] = program.position.id;
  scene.root.dataset["kpOperationEvaluationProgramId"] =
    input.evaluation.forward.programId;
  scene.root.dataset["kpPlaceValueEvaluationVisualMotif"] =
    input.visualMotif.kind;
  if (
    input.visualMotif.kind === kpPlaceValueContributorFusionMotifKind &&
    (
      !isKpPlaceValueContributorFusionPlan(input.visualMotif.plan) ||
      !sameIds(
        input.visualMotif.plan.contributorArcs.map(
          ({ bindingAnnotationId }) => bindingAnnotationId
        ),
        ownership.contributionProxies.map(
          ({ bindingAnnotationId }) => bindingAnnotationId
        )
      )
    )
  ) {
    throw new Error(
      "Contributor-fusion motif must be compiled from this evaluation's ownership."
    );
  }
  const contributorFusion =
    input.visualMotif.kind !== kpPlaceValueContributorFusionMotifKind
    ? undefined
    : createKpPlaceValueContributorFusionRenderer({
        document: input.document,
        sceneRoot: scene.root,
        plan: input.visualMotif.plan
      });
  const prepare = (): void => {
    scene.prepare();
    suppressPersistentSourceCopies(source, ownership);
  };
  return Object.freeze({
    root: scene.root,
    sourceRoot: scene.sourceRoot,
    targetRoot: scene.targetRoot,
    prepare,
    apply(progress: number, direction: "forward" | "rewind") {
      prepare();
      const execution = direction === "forward"
        ? input.evaluation.forward
        : input.evaluation.rewind;
      const telemetry = execution.samplePhaseTelemetry(progress);
      scene.root.dataset["kpOperationEvaluationDirection"] = direction;
      scene.root.dataset["kpOperationEvaluationPhaseId"] =
        telemetry.activePhaseId;
      scene.root.dataset["kpOperationEvaluationProgress"] = String(progress);
      const frame = scene.apply(progress);
      suppressCompilerOnlyCatalyst(scene.root, ownership);
      contributorFusion?.apply(progress);
      return frame;
    },
    dispose() {
      contributorFusion?.dispose();
      scene.dispose();
    }
  });
}

function createBinding(
  program: KpPlaceValuePositionProgram,
  ownership: KpPlaceValueWrittenOwnershipPlan
): KpSuccessorSynthesisBinding {
  const namespace = program.position.id;
  const material = ownership.contributionProxies.map((proxy, index) =>
    Object.freeze({
      id: proxy.bindingAnnotationId,
      semanticRole: "position-contributor",
      selectorIds: Object.freeze([
        bindKpPlaceValueWrittenMotionProxy(proxy)
      ]),
      contribution: "material-input" as const,
      propagationRank: index,
      pathFamily: index % 2 === 0
        ? "arc-above" as const
        : "arc-below" as const
    })
  );
  const targets = ownership.evaluationOutputProxies.map((proxy, index) =>
    Object.freeze({
      id: `annotation.${namespace}.total.${index}`,
      semanticRole: "evaluated-position-total-digit",
      selectorIds: Object.freeze([
        bindKpPlaceValueWrittenMotionProxy(proxy)
      ]),
      propagationRank: index,
      pathFamily: index % 2 === 0
        ? "arc-above" as const
        : "arc-below" as const
    })
  );
  return Object.freeze({
    id: `successor.place-value.evaluate-${namespace}`,
    relationRecordId: `relation.place-value.evaluate-${namespace}`,
    authority: Object.freeze({
      operationId: "kp.arithmetic.add",
      bindingId: `binding.place-value.evaluate-${namespace}`
    }),
    layoutTopology: "separate-source-result-bands" as const,
    convergenceAnchor: "target-destination" as const,
    sourceAnnotations: Object.freeze([
      ...material,
      Object.freeze({
        id: ownership.catalystProxy.bindingAnnotationId,
        semanticRole: "addition-catalyst",
        selectorIds: Object.freeze([
          bindKpPlaceValueWrittenMotionProxy(ownership.catalystProxy)
        ]),
        contribution: "catalyst" as const,
        propagationRank: 0,
        pathFamily: "arc-below" as const
      })
    ]),
    targetAnnotations: Object.freeze(targets),
    lineages: Object.freeze([Object.freeze({
      id: `lineage.place-value.evaluate-${namespace}`,
      sourceAnnotationIds: Object.freeze(material.map(({ id }) => id)),
      targetAnnotationIds: Object.freeze(targets.map(({ id }) => id))
    })])
  });
}

function configureOverlayEndpoints(input: {
  readonly source: KpPlaceValueWrittenColumnDomProjection;
  readonly target: KpPlaceValueWrittenColumnDomProjection;
  readonly ownership: KpPlaceValueWrittenOwnershipPlan;
}): void {
  if (!isKpPlaceValueWrittenOwnershipPlan(input.ownership)) {
    throw new Error(
      "Evaluation overlay endpoints require compiler-owned written authority."
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
  proxy: KpPlaceValueWrittenMotionProxy
): void {
  const element = dom.cellElements.get(proxy.sourceCellId);
  if (element === undefined) {
    throw new Error(
      `Evaluation overlay lacks persistent source ${proxy.sourceCellId}.`
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

function configureEvaluationTarget(
  element: HTMLElement,
  proxy: KpPlaceValueWrittenOwnershipPlan[
    "evaluationOutputProxies"
  ][number]
): void {
  element.dataset["kpVisibility"] = "visible";
  element.dataset["kpSemanticEntityId"] =
    bindKpPlaceValueWrittenMotionProxy(proxy);
  element.dataset["kpPresentationGroupId"] =
    bindKpPlaceValueWrittenMotionProxy(proxy);
  element.dataset["kpPlaceValueMotionRole"] = proxy.role;
  element.dataset["kpPlaceValueMotionTargetId"] = proxy.semanticEntityId;
}

function suppressPersistentSourceCopies(
  source: KpPlaceValueWrittenColumnDomProjection,
  ownership: KpPlaceValueWrittenOwnershipPlan
): void {
  for (const proxy of [
    ...ownership.contributionProxies,
    ownership.catalystProxy
  ]) {
    source.cellElements.get(proxy.sourceCellId)!.style.opacity = "0";
  }
}

function suppressCompilerOnlyCatalyst(
  root: HTMLElement,
  ownership: KpPlaceValueWrittenOwnershipPlan
): void {
  const annotationId = ownership.catalystProxy.bindingAnnotationId;
  const selectorId =
    bindKpPlaceValueWrittenMotionProxy(ownership.catalystProxy);
  for (const owner of root.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )) {
    if (
      owner.dataset["kpEquationMaterialSemanticEntityId"] === annotationId
    ) {
      owner.style.opacity = "0";
      owner.dataset["kpPlaceValueMotionRole"] =
        "compiler-only-stationary-paint";
      owner.dataset["kpPlaceValueMotionSelectorId"] = selectorId;
    }
  }
}

function evaluationDigit(
  document: Document,
  projection: KpPlaceValueWrittenColumnProjection,
  digit: KpPlaceValueEvaluationDigitSpec,
  proxy: KpPlaceValueWrittenOwnershipPlan[
    "evaluationOutputProxies"
  ][number]
): HTMLElement {
  const root = document.createElement("span");
  root.dataset["kpPlaceValueEvaluationDigit"] = "";
  root.dataset["kpPlaceValueNativeRoot"] = "";
  configureEvaluationTarget(root, proxy);
  const resultRow = projection.cells.find(
    ({ role }) => role === "result-digit"
  )?.row;
  if (resultRow === undefined) {
    throw new Error("Evaluation target requires a result row.");
  }
  root.dataset["kpPlaceValueRow"] = resultRow;
  root.dataset["kpPlaceValueColumn"] = digit.columnId;
  root.innerHTML = renderLatexToHtml(digit.latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return root;
}

function sameIds(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}
