import type {
  KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentation,
  type KpRegisteredSuccessorSynthesisBinding
} from "../animation/successor-synthesis-presentation-plan.ts";
import type {
  KpPlaceValueAdditionPresentationPlan
} from "../animation/place-value-addition-presentation-plan.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  type KpExecutableSuccessorMotifProgramAdapterDispatch
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import type {
  KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";
import {
  createKpPlaceValueNativeSceneDom
} from "./place-value-addition-native-scene-dom.ts";

declare const kpPlaceValueOnesEvaluationBrand: unique symbol;

const sealedEvaluations = new WeakSet<object>();

type OperationDispatch = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "operation-evaluation" }
>;

export interface KpPlaceValueOnesEvaluation {
  readonly schemaVersion: "kp.place-value-addition-ones-evaluation.v1";
  readonly beatId: "beat.place-value.evaluate-ones";
  readonly expression: "8 + 6 = 14";
  readonly materialSelectorIds: readonly [
    "digit.first.ones",
    "digit.second.ones"
  ];
  readonly catalystSelectorId: "operator.add";
  readonly targetSelectorIds: readonly [
    "evaluation.ones.total.tens",
    "evaluation.ones.total.ones"
  ];
  readonly binding: KpRegisteredSuccessorSynthesisBinding;
  readonly forward: OperationDispatch;
  readonly rewind: OperationDispatch;
  readonly opacityPolicy: "opaque";
  readonly [kpPlaceValueOnesEvaluationBrand]: true;
}

export interface KpPlaceValueOnesEvaluationDom {
  readonly root: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly apply: (
    progress: number,
    direction: "forward" | "rewind"
  ) => KpNativeKatexSceneOwnershipFrame;
  readonly dispose: () => void;
}

export function compileKpPlaceValueOnesEvaluation(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueOnesEvaluation {
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === "beat.place-value.evaluate-ones"
  );
  const program = beat?.programs[0];
  if (
    beat?.kind !== "evaluate" ||
    program?.kind !== "operation-evaluation" ||
    program.expression !== "8 + 6 = 14" ||
    program.catalystId !== "operator.add" ||
    program.executableProgram.kind !== "operation-evaluation"
  ) {
    throw new Error(
      "Ones evaluation requires its exhaustive place-value presentation."
    );
  }
  const executableProgram = program.executableProgram;
  const binding = createBinding();
  const compiled = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: "transformation.place-value.evaluate-ones",
    transformationKind: "simplifyConstantSum",
    binding
  });
  if (
    compiled.status !== "compiled" ||
    compiled.executableProgram !== executableProgram
  ) {
    throw new Error(
      "Ones evaluation did not resolve the canonical executable program."
    );
  }
  const registered = Object.freeze({
    ...binding,
    operationPresentationPlan: compiled.operationPresentationPlan,
    paintContinuityPlan: compiled.paintContinuityPlan,
    continuityProgram: compiled.continuityProgram
  }) satisfies KpRegisteredSuccessorSynthesisBinding;
  const dispatch = (direction: "forward" | "rewind") => {
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
      throw new Error("Ones evaluation resolved the wrong motif adapter.");
    }
    return candidate;
  };
  const evaluation = Object.freeze({
    schemaVersion: "kp.place-value-addition-ones-evaluation.v1" as const,
    beatId: "beat.place-value.evaluate-ones" as const,
    expression: "8 + 6 = 14" as const,
    materialSelectorIds: Object.freeze([
      "digit.first.ones",
      "digit.second.ones"
    ] as const),
    catalystSelectorId: "operator.add" as const,
    targetSelectorIds: Object.freeze([
      "evaluation.ones.total.tens",
      "evaluation.ones.total.ones"
    ] as const),
    binding: registered,
    forward: dispatch("forward"),
    rewind: dispatch("rewind"),
    opacityPolicy: "opaque" as const
  });
  sealedEvaluations.add(evaluation);
  return evaluation as unknown as KpPlaceValueOnesEvaluation;
}

export function isKpPlaceValueOnesEvaluation(
  value: unknown
): value is KpPlaceValueOnesEvaluation {
  return typeof value === "object" &&
    value !== null &&
    sealedEvaluations.has(value);
}

export function createKpPlaceValueOnesEvaluationDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly evaluation: KpPlaceValueOnesEvaluation;
}): KpPlaceValueOnesEvaluationDom {
  if (!isKpPlaceValueOnesEvaluation(input.evaluation)) {
    throw new Error("Ones-evaluation DOM requires compiler-owned authority.");
  }
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
  for (const selectorId of [
    ...input.evaluation.materialSelectorIds,
    input.evaluation.catalystSelectorId
  ]) {
    target.cellElements.get(selectorId)!.dataset["kpVisibility"] = "hidden";
  }
  const targetGrid = target.root.querySelector<HTMLElement>(
    "[data-kp-place-value-grid]"
  );
  if (targetGrid === null) {
    throw new Error("Ones-evaluation target lacks its semantic grid.");
  }
  targetGrid.append(
    evaluationDigit(
      input.document,
      "evaluation.ones.total.tens",
      "tens",
      "1"
    ),
    evaluationDigit(
      input.document,
      "evaluation.ones.total.ones",
      "ones",
      "4"
    )
  );
  const scene = createKpPlaceValueNativeSceneDom({
    document: input.document,
    sourceRoot: source.root,
    targetRoot: target.root,
    sourceSceneId: "scene.place-value.ones-evaluation.source",
    targetSceneId: "scene.place-value.ones-evaluation.target",
    successorSyntheses: [{
      binding: input.evaluation.binding,
      direction: "forward",
      motion: "full"
    }]
  });
  scene.root.dataset["kpPlaceValueOnesEvaluation"] = "";
  scene.root.dataset["kpOperationEvaluationProgramId"] =
    input.evaluation.forward.programId;
  return Object.freeze({
    root: scene.root,
    sourceRoot: scene.sourceRoot,
    targetRoot: scene.targetRoot,
    apply(
      progress: number,
      direction: "forward" | "rewind"
    ) {
      const execution =
        direction === "forward"
          ? input.evaluation.forward
          : input.evaluation.rewind;
      const telemetry = execution.samplePhaseTelemetry(progress);
      scene.root.dataset["kpOperationEvaluationDirection"] = direction;
      scene.root.dataset["kpOperationEvaluationPhaseId"] =
        telemetry.activePhaseId;
      scene.root.dataset["kpOperationEvaluationProgress"] = String(progress);
      return scene.apply(progress);
    },
    dispose: scene.dispose
  });
}

function createBinding(): KpSuccessorSynthesisBinding {
  return Object.freeze({
    id: "successor.place-value.evaluate-ones",
    relationRecordId: "relation.place-value.evaluate-ones",
    authority: Object.freeze({
      operationId: "kp.arithmetic.add",
      bindingId: "binding.place-value.evaluate-ones"
    }),
    sourceAnnotations: Object.freeze([
      Object.freeze({
        id: "annotation.ones.first",
        semanticRole: "first-addend-ones",
        selectorIds: Object.freeze(["digit.first.ones"]),
        contribution: "material-input" as const,
        propagationRank: 0,
        pathFamily: "arc-above" as const
      }),
      Object.freeze({
        id: "annotation.ones.second",
        semanticRole: "second-addend-ones",
        selectorIds: Object.freeze(["digit.second.ones"]),
        contribution: "material-input" as const,
        propagationRank: 1,
        pathFamily: "arc-below" as const
      }),
      Object.freeze({
        id: "annotation.ones.plus",
        semanticRole: "addition-catalyst",
        selectorIds: Object.freeze(["operator.add"]),
        contribution: "catalyst" as const,
        propagationRank: 0,
        pathFamily: "arc-below" as const
      })
    ]),
    targetAnnotations: Object.freeze([
      Object.freeze({
        id: "annotation.ones.total.tens",
        semanticRole: "evaluated-tens-digit",
        selectorIds: Object.freeze(["evaluation.ones.total.tens"]),
        propagationRank: 0,
        pathFamily: "arc-above" as const
      }),
      Object.freeze({
        id: "annotation.ones.total.ones",
        semanticRole: "evaluated-ones-digit",
        selectorIds: Object.freeze(["evaluation.ones.total.ones"]),
        propagationRank: 1,
        pathFamily: "arc-below" as const
      })
    ]),
    lineages: Object.freeze([
      Object.freeze({
        id: "lineage.place-value.evaluate-ones",
        sourceAnnotationIds: Object.freeze([
          "annotation.ones.first",
          "annotation.ones.second"
        ]),
        targetAnnotationIds: Object.freeze([
          "annotation.ones.total.tens",
          "annotation.ones.total.ones"
        ])
      })
    ])
  });
}

function evaluationDigit(
  document: Document,
  semanticEntityId: string,
  column: "tens" | "ones",
  latex: "1" | "4"
): HTMLElement {
  const root = document.createElement("span");
  root.dataset["kpPlaceValueEvaluationDigit"] = "";
  root.dataset["kpPlaceValueNativeRoot"] = "";
  root.dataset["kpSemanticEntityId"] = semanticEntityId;
  root.dataset["kpPresentationGroupId"] = semanticEntityId;
  root.dataset["kpPlaceValueRow"] = "result";
  root.dataset["kpPlaceValueColumn"] = column;
  root.dataset["kpVisibility"] = "visible";
  root.innerHTML = renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return root;
}
