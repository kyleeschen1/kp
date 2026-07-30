import {
  compileKpFissionFusionPlan,
  type KpFissionFusionPlan
} from "../animation/fission-fusion.ts";
import type {
  KpPlaceValueAdditionPresentationPlan
} from "../animation/place-value-addition-presentation-plan.ts";
import type {
  KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import {
  kpOpaqueIdentityTransferOwnershipProgress
} from "../animation/successor-synthesis.ts";
import {
  createKpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  type KpExecutableSuccessorMotifProgramAdapterDispatch
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import type {
  KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import type {
  KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexIdentityTransferIntent,
  isKpNativeKatexIdentityTransferIntent,
  type KpNativeKatexIdentityTransferIntent
} from "./native-katex-successor-synthesis.ts";
import {
  createKpPlaceValueNativeSceneDom
} from "./place-value-addition-native-scene-dom.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";

declare const kpPlaceValueOnesExchangeBrand: unique symbol;

const sealedExchanges = new WeakSet<object>();

type FissionDispatch = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "identity-fission" }
>;

export interface KpPlaceValueOnesExchange {
  readonly schemaVersion: "kp.place-value-addition-ones-exchange.v1";
  readonly beatId: "beat.place-value.exchange-ones";
  readonly sourceEntityId: "evaluation.ones.total";
  readonly targetEntityIds: readonly ["result.ones", "carry.tens"];
  readonly transferProgress:
    typeof kpOpaqueIdentityTransferOwnershipProgress;
  readonly fissionPlan: KpFissionFusionPlan & {
    readonly mode: "fission";
  };
  readonly intent: KpNativeKatexIdentityTransferIntent & {
    readonly executableProgram: {
      readonly kind: "identity-fission";
    };
  };
  readonly forward: FissionDispatch;
  readonly rewind: FissionDispatch;
  readonly opacityPolicy: "opaque";
  readonly [kpPlaceValueOnesExchangeBrand]: true;
}

export interface KpPlaceValueOnesExchangeFrame {
  readonly ownership: KpNativeKatexSceneOwnershipFrame;
  readonly transferOccurred: boolean;
}

export interface KpPlaceValueOnesExchangeDom {
  readonly root: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly apply: (
    progress: number,
    direction: "forward" | "rewind"
  ) => KpPlaceValueOnesExchangeFrame;
  readonly dispose: () => void;
}

export function compileKpPlaceValueOnesExchange(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueOnesExchange {
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === "beat.place-value.exchange-ones"
  );
  const carrySplit = beat?.programs.find(
    ({ kind }) => kind === "carry-split"
  );
  const exchangeProof = beat?.programs.find(
    ({ kind }) => kind === "adjacent-place-exchange"
  );
  if (
    beat?.kind !== "exchange-and-carry" ||
    carrySplit?.kind !== "carry-split" ||
    carrySplit.sourceEvaluationId !== "evaluation.ones.total" ||
    carrySplit.remainderId !== "result.ones" ||
    carrySplit.carryId !== "carry.tens" ||
    carrySplit.executableProgram.kind !== "identity-fission" ||
    exchangeProof?.kind !== "adjacent-place-exchange" ||
    exchangeProof.proof !== carrySplit.lineage.exchange
  ) {
    throw new Error(
      "Ones exchange requires its exact carry lineage and exchange proof."
    );
  }
  const sourceEntityId = "evaluation.ones.total" as const;
  const targetEntityIds =
    Object.freeze(["result.ones", "carry.tens"] as const);
  const fissionPlan = compileKpFissionFusionPlan({
    id: "motion.place-value.exchange-ones",
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.place-value.exchange-ones",
      sourceEntityIds: [sourceEntityId],
      targetEntityIds,
      edges: [{
        id: "edge.place-value.exchange-ones",
        relation: "split",
        sourceEntityIds: [sourceEntityId],
        targetEntityIds,
        summary:
          "The evaluated fourteen establishes a settled four and the same carried ten."
      }]
    }),
    semanticOrder: targetEntityIds,
    microStaggerSpan: 0,
    junctionScale: 1
  }) as KpFissionFusionPlan & { readonly mode: "fission" };
  const intent = createKpNativeKatexIdentityTransferIntent({
    binding: createBinding(),
    executableProgram: carrySplit.executableProgram,
    direction: "forward",
    motion: "full"
  });
  if (
    !isKpNativeKatexIdentityTransferIntent(intent) ||
    intent.executableProgram.kind !== "identity-fission"
  ) {
    throw new Error(
      "Ones exchange did not mint canonical identity-fission authority."
    );
  }
  const dispatch = (direction: "forward" | "rewind"): FissionDispatch => {
    const candidate = compileKpExecutableSuccessorMotifProgramAdapter({
      kind: "identity-fission",
      program: carrySplit.executableProgram,
      direction,
      primitive: {
        kind: "fission-fusion",
        plan: fissionPlan
      }
    });
    if (candidate.programKind !== "identity-fission") {
      throw new Error("Ones exchange resolved the wrong motif adapter.");
    }
    return candidate;
  };
  const exchange = Object.freeze({
    schemaVersion: "kp.place-value-addition-ones-exchange.v1" as const,
    beatId: "beat.place-value.exchange-ones" as const,
    sourceEntityId,
    targetEntityIds,
    transferProgress: kpOpaqueIdentityTransferOwnershipProgress,
    fissionPlan,
    intent,
    forward: dispatch("forward"),
    rewind: dispatch("rewind"),
    opacityPolicy: "opaque" as const
  });
  sealedExchanges.add(exchange);
  return exchange as unknown as KpPlaceValueOnesExchange;
}

export function isKpPlaceValueOnesExchange(
  value: unknown
): value is KpPlaceValueOnesExchange {
  return typeof value === "object" &&
    value !== null &&
    sealedExchanges.has(value);
}

export function createKpPlaceValueOnesExchangeDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly exchange: KpPlaceValueOnesExchange;
}): KpPlaceValueOnesExchangeDom {
  if (!isKpPlaceValueOnesExchange(input.exchange)) {
    throw new Error("Ones-exchange DOM requires compiler-owned authority.");
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
  for (const hiddenId of [
    "digit.first.ones",
    "digit.second.ones",
    "operator.add"
  ]) {
    source.cellElements.get(hiddenId)!.dataset["kpVisibility"] = "hidden";
    target.cellElements.get(hiddenId)!.dataset["kpVisibility"] = "hidden";
  }
  target.cellElements.get("result.ones")!.dataset["kpVisibility"] = "visible";
  target.cellElements.get("carry.tens")!.dataset["kpVisibility"] = "visible";
  const sourceGrid = source.root.querySelector<HTMLElement>(
    "[data-kp-place-value-grid]"
  );
  if (sourceGrid === null) {
    throw new Error("Ones-exchange source lacks its semantic grid.");
  }
  const total = input.document.createElement("span");
  total.dataset["kpPlaceValueEvaluationTotal"] = "";
  total.dataset["kpSemanticEntityId"] = input.exchange.sourceEntityId;
  total.dataset["kpPresentationGroupId"] = input.exchange.sourceEntityId;
  total.style.display = "contents";
  total.append(
    totalDigit(input.document, "tens", "1"),
    totalDigit(input.document, "ones", "4")
  );
  sourceGrid.append(total);

  const scene = createKpPlaceValueNativeSceneDom({
    document: input.document,
    sourceRoot: source.root,
    targetRoot: target.root,
    sourceSceneId: "scene.place-value.ones-exchange.source",
    targetSceneId: "scene.place-value.ones-exchange.target",
    successorSyntheses: [input.exchange.intent]
  });
  scene.root.dataset["kpPlaceValueOnesExchange"] = "";
  scene.root.dataset["kpIdentityFissionProgramId"] =
    input.exchange.forward.programId;

  return Object.freeze({
    root: scene.root,
    sourceRoot: scene.sourceRoot,
    targetRoot: scene.targetRoot,
    apply(progress: number, direction: "forward" | "rewind") {
      const execution =
        direction === "forward"
          ? input.exchange.forward
          : input.exchange.rewind;
      const telemetry = execution.samplePhaseTelemetry(progress);
      const ownership = scene.apply(progress);
      const transferOccurred =
        progress >= input.exchange.transferProgress;
      scene.root.dataset["kpIdentityFissionDirection"] = direction;
      scene.root.dataset["kpIdentityFissionPhaseId"] =
        telemetry.activePhaseId;
      scene.root.dataset["kpIdentityFissionProgress"] = String(progress);
      scene.root.dataset["kpIdentityTransferOccurred"] =
        String(transferOccurred);
      return Object.freeze({
        ownership,
        transferOccurred
      });
    },
    dispose: scene.dispose
  });
}

function createBinding(): KpSuccessorSynthesisBinding {
  return Object.freeze({
    id: "successor.place-value.exchange-ones",
    relationRecordId: "relation.place-value.exchange-ones",
    authority: Object.freeze({
      operationId: "kp.core.fan-out",
      bindingId: "binding.place-value.exchange-ones"
    }),
    sourceAnnotations: Object.freeze([
      Object.freeze({
        id: "annotation.ones.evaluated-total",
        semanticRole: "evaluated-column-total",
        selectorIds: Object.freeze(["evaluation.ones.total"]),
        contribution: "material-input" as const,
        propagationRank: 0,
        pathFamily: "arc-above" as const
      })
    ]),
    targetAnnotations: Object.freeze([
      Object.freeze({
        id: "annotation.ones.remainder",
        semanticRole: "settled-remainder",
        selectorIds: Object.freeze(["result.ones"]),
        propagationRank: 0,
        pathFamily: "arc-below" as const
      }),
      Object.freeze({
        id: "annotation.ones.carry",
        semanticRole: "carried-ten",
        selectorIds: Object.freeze(["carry.tens"]),
        propagationRank: 1,
        pathFamily: "arc-above" as const
      })
    ]),
    lineages: Object.freeze([
      Object.freeze({
        id: "lineage.place-value.exchange-ones.paint",
        sourceAnnotationIds: Object.freeze([
          "annotation.ones.evaluated-total"
        ]),
        targetAnnotationIds: Object.freeze([
          "annotation.ones.remainder",
          "annotation.ones.carry"
        ])
      })
    ])
  });
}

function totalDigit(
  document: Document,
  column: "tens" | "ones",
  latex: "1" | "4"
): HTMLElement {
  const root = document.createElement("span");
  root.dataset["kpPlaceValueEvaluationDigit"] = "";
  root.dataset["kpPlaceValueNativeRoot"] = "";
  root.dataset["kpPlaceValueRow"] = "result";
  root.dataset["kpPlaceValueColumn"] = column;
  root.dataset["kpVisibility"] = "visible";
  root.innerHTML = renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return root;
}
