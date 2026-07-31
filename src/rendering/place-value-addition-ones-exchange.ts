import {
  compileKpFissionFusionPlan,
  type KpFissionFusionPlan
} from "../animation/fission-fusion.ts";
import type {
  KpPlaceValueAdditionPresentationPlan
} from "../animation/place-value-addition-presentation-plan.ts";
import {
  kpOpaqueIdentityTransferOwnershipProgress,
  type KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import type {
  KpPlaceValueWrittenColumn,
  KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import {
  compileKpExecutableSuccessorMotifProgramAdapter,
  type KpExecutableSuccessorMotifProgramAdapterDispatch
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import {
  createKpSemanticLineageGraph
} from "../semantic/semantic-lineage-graph.ts";
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
  createKpPlaceValueWrittenColumnDomProjection,
  type KpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";
import {
  bindKpPlaceValueWrittenMotionProxy,
  compileKpPlaceValueOnesWrittenOwnership,
  isKpPlaceValueOnesWrittenOwnershipPlan,
  type KpPlaceValueOnesWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";

declare const kpPlaceValueOnesExchangeBrand: unique symbol;
declare const kpPlaceValueTensExchangeBrand: unique symbol;

const sealedExchanges = new WeakSet<object>();

type FissionDispatch = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "identity-fission" }
>;

interface KpPlaceValueColumnExchangeBase {
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
  readonly nativeHandoffPolicy: "only-at-route-completion";
}

export interface KpPlaceValueOnesExchange extends
KpPlaceValueColumnExchangeBase {
  readonly schemaVersion: "kp.place-value-addition-ones-exchange.v1";
  readonly beatId: "beat.place-value.exchange-ones";
  readonly place: "ones";
  readonly sourceEntityId: "evaluation.ones.total";
  readonly targetEntityIds: readonly ["result.ones", "carry.tens"];
  readonly baseTenExchangeId: "exchange.ones-to-tens";
  readonly writtenOwnership: KpPlaceValueOnesWrittenOwnershipPlan;
  readonly [kpPlaceValueOnesExchangeBrand]: true;
}

export interface KpPlaceValueTensExchange extends
KpPlaceValueColumnExchangeBase {
  readonly schemaVersion: "kp.place-value-addition-tens-exchange.v1";
  readonly beatId: "beat.place-value.exchange-tens";
  readonly place: "tens";
  readonly sourceEntityId: "evaluation.tens.total";
  readonly targetEntityIds: readonly ["result.tens", "carry.hundreds"];
  readonly baseTenExchangeId: "exchange.tens-to-hundreds";
  readonly [kpPlaceValueTensExchangeBrand]: true;
}

export type KpPlaceValueColumnExchange =
  | KpPlaceValueOnesExchange
  | KpPlaceValueTensExchange;

export interface KpPlaceValueColumnExchangeFrame {
  readonly ownership: KpNativeKatexSceneOwnershipFrame;
  // Semantic fission and endpoint arrival are different events. Keeping the
  // endpoint owner as a discriminant prevents the old transfer boolean from
  // being reused to reveal native paint while the carry is still in flight.
  readonly semanticTransferOccurred: boolean;
  readonly nativeEndpointOwnership: "transit" | "native-endpoint";
}

export interface KpPlaceValueColumnExchangeDom {
  readonly root: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly prepare: () => void;
  readonly apply: (
    progress: number,
    direction: "forward" | "rewind"
  ) => KpPlaceValueColumnExchangeFrame;
  readonly dispose: () => void;
}

export type KpPlaceValueOnesExchangeFrame =
  KpPlaceValueColumnExchangeFrame;
export type KpPlaceValueOnesExchangeDom =
  KpPlaceValueColumnExchangeDom;
export type KpPlaceValueTensExchangeDom =
  KpPlaceValueColumnExchangeDom;

interface ExchangeConfig {
  readonly place: "ones" | "tens";
  readonly schemaVersion:
    | KpPlaceValueOnesExchange["schemaVersion"]
    | KpPlaceValueTensExchange["schemaVersion"];
  readonly beatId:
    | KpPlaceValueOnesExchange["beatId"]
    | KpPlaceValueTensExchange["beatId"];
  readonly sourceEntityId:
    | KpPlaceValueOnesExchange["sourceEntityId"]
    | KpPlaceValueTensExchange["sourceEntityId"];
  readonly targetEntityIds: readonly [string, string];
  readonly baseTenExchangeId:
    | KpPlaceValueOnesExchange["baseTenExchangeId"]
    | KpPlaceValueTensExchange["baseTenExchangeId"];
  readonly sourceHiddenIds: readonly string[];
  readonly sourceVisibleIds: readonly string[];
  readonly targetDigits: readonly [
    {
      readonly id: string;
      readonly column: KpPlaceValueWrittenColumn;
      readonly latex: string;
    },
    {
      readonly id: string;
      readonly column: KpPlaceValueWrittenColumn;
      readonly latex: string;
    }
  ];
  readonly targetVisibleIds: readonly [string, string];
  readonly stageDataset:
    | "kpPlaceValueOnesExchange"
    | "kpPlaceValueTensExchange";
}

const exchangeConfigs = Object.freeze({
  ones: Object.freeze({
    place: "ones" as const,
    schemaVersion: "kp.place-value-addition-ones-exchange.v1" as const,
    beatId: "beat.place-value.exchange-ones" as const,
    sourceEntityId: "evaluation.ones.total" as const,
    targetEntityIds:
      Object.freeze(["result.ones", "carry.tens"] as const),
    baseTenExchangeId: "exchange.ones-to-tens" as const,
    sourceHiddenIds: Object.freeze([
      "digit.first.ones",
      "digit.second.ones",
      "operator.add"
    ]),
    sourceVisibleIds: Object.freeze([]),
    targetDigits: Object.freeze([
      Object.freeze({
        id: "evaluation.ones.total.part.tens",
        column: "tens" as const,
        latex: "1"
      }),
      Object.freeze({
        id: "evaluation.ones.total.part.ones",
        column: "ones" as const,
        latex: "4"
      })
    ] as const),
    targetVisibleIds:
      Object.freeze(["result.ones", "carry.tens"] as const),
    stageDataset: "kpPlaceValueOnesExchange" as const
  }),
  tens: Object.freeze({
    place: "tens" as const,
    schemaVersion: "kp.place-value-addition-tens-exchange.v1" as const,
    beatId: "beat.place-value.exchange-tens" as const,
    sourceEntityId: "evaluation.tens.total" as const,
    targetEntityIds:
      Object.freeze(["result.tens", "carry.hundreds"] as const),
    baseTenExchangeId: "exchange.tens-to-hundreds" as const,
    sourceHiddenIds: Object.freeze([
      "digit.first.ones",
      "digit.second.ones",
      "digit.first.tens",
      "digit.second.tens",
      "carry.tens",
      "operator.add"
    ]),
    sourceVisibleIds: Object.freeze(["result.ones"]),
    targetDigits: Object.freeze([
      Object.freeze({
        id: "evaluation.tens.total.part.hundreds",
        column: "hundreds" as const,
        latex: "1"
      }),
      Object.freeze({
        id: "evaluation.tens.total.part.tens",
        column: "tens" as const,
        latex: "3"
      })
    ] as const),
    targetVisibleIds:
      Object.freeze(["result.tens", "carry.hundreds"] as const),
    stageDataset: "kpPlaceValueTensExchange" as const
  })
}) satisfies Readonly<Record<"ones" | "tens", ExchangeConfig>>;

export function compileKpPlaceValueOnesExchange(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueOnesExchange {
  return compileColumnExchange(
    presentation,
    exchangeConfigs.ones
  ) as KpPlaceValueOnesExchange;
}

export function compileKpPlaceValueTensExchange(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueTensExchange {
  return compileColumnExchange(
    presentation,
    exchangeConfigs.tens
  ) as KpPlaceValueTensExchange;
}

function compileColumnExchange(
  presentation: KpPlaceValueAdditionPresentationPlan,
  config: ExchangeConfig
): KpPlaceValueColumnExchange {
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === config.beatId
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
    carrySplit.sourceEvaluationId !== config.sourceEntityId ||
    carrySplit.remainderId !== config.targetEntityIds[0] ||
    carrySplit.carryId !== config.targetEntityIds[1] ||
    carrySplit.executableProgram.kind !== "identity-fission" ||
    exchangeProof?.kind !== "adjacent-place-exchange" ||
    exchangeProof.proof !== carrySplit.lineage.exchange
  ) {
    throw new Error(
      `${config.place} exchange requires its exact lineage and proof.`
    );
  }
  const fissionPlan = compileKpFissionFusionPlan({
    id: `motion.place-value.exchange-${config.place}`,
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: `lineage.place-value.exchange-${config.place}`,
      sourceEntityIds: [config.sourceEntityId],
      targetEntityIds: config.targetEntityIds,
      edges: [{
        id: `edge.place-value.exchange-${config.place}`,
        relation: "split",
        sourceEntityIds: [config.sourceEntityId],
        targetEntityIds: config.targetEntityIds,
        summary:
          `The evaluated ${config.place} total establishes its exact remainder and carry.`
      }]
    }),
    semanticOrder: config.targetEntityIds,
    microStaggerSpan: 0,
    junctionScale: 1
  }) as KpFissionFusionPlan & { readonly mode: "fission" };
  const writtenOwnership =
    config.place === "ones"
      ? compileKpPlaceValueOnesWrittenOwnership()
      : undefined;
  const intent = createKpNativeKatexIdentityTransferIntent({
    binding: createBinding(config, writtenOwnership),
    executableProgram: carrySplit.executableProgram,
    direction: "forward",
    motion: "full"
  });
  if (
    !isKpNativeKatexIdentityTransferIntent(intent) ||
    intent.executableProgram.kind !== "identity-fission"
  ) {
    throw new Error(
      `${config.place} exchange lacks canonical fission authority.`
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
      throw new Error(
        `${config.place} exchange resolved the wrong motif adapter.`
      );
    }
    return candidate;
  };
  const exchange = Object.freeze({
    schemaVersion: config.schemaVersion,
    beatId: config.beatId,
    place: config.place,
    sourceEntityId: config.sourceEntityId,
    targetEntityIds: Object.freeze([...config.targetEntityIds]),
    baseTenExchangeId: config.baseTenExchangeId,
    transferProgress: kpOpaqueIdentityTransferOwnershipProgress,
    fissionPlan,
    intent,
    forward: dispatch("forward"),
    rewind: dispatch("rewind"),
    ...(writtenOwnership === undefined ? {} : { writtenOwnership }),
    opacityPolicy: "opaque" as const,
    nativeHandoffPolicy: "only-at-route-completion" as const
  });
  sealedExchanges.add(exchange);
  return exchange as unknown as KpPlaceValueColumnExchange;
}

export function isKpPlaceValueOnesExchange(
  value: unknown
): value is KpPlaceValueOnesExchange {
  return isSealedExchange(value) &&
    value.beatId === "beat.place-value.exchange-ones";
}

export function isKpPlaceValueTensExchange(
  value: unknown
): value is KpPlaceValueTensExchange {
  return isSealedExchange(value) &&
    value.beatId === "beat.place-value.exchange-tens";
}

export function createKpPlaceValueOnesExchangeDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly exchange: KpPlaceValueOnesExchange;
}): KpPlaceValueOnesExchangeDom {
  if (!isKpPlaceValueOnesExchange(input.exchange)) {
    throw new Error("Ones-exchange DOM requires compiler-owned authority.");
  }
  return createColumnExchangeDom({
    ...input,
    config: exchangeConfigs.ones,
    writtenOwnership: input.exchange.writtenOwnership
  });
}

export function createKpPlaceValueTensExchangeDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly exchange: KpPlaceValueTensExchange;
}): KpPlaceValueTensExchangeDom {
  if (!isKpPlaceValueTensExchange(input.exchange)) {
    throw new Error("Tens-exchange DOM requires compiler-owned authority.");
  }
  return createColumnExchangeDom({
    ...input,
    config: exchangeConfigs.tens
  });
}

function createColumnExchangeDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly exchange: KpPlaceValueColumnExchange;
  readonly config: ExchangeConfig;
  readonly writtenOwnership?: KpPlaceValueOnesWrittenOwnershipPlan;
}): KpPlaceValueColumnExchangeDom {
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
    target.cellElements.get("operator.add")!
      .dataset["kpVisibility"] = "visible";
    for (const id of input.config.targetVisibleIds) {
      target.cellElements.get(id)!.dataset["kpVisibility"] = "visible";
    }
  } else {
    configureOnesExchangeOverlay({
      source,
      target,
      ownership: input.writtenOwnership
    });
  }
  const sourceGrid = source.root.querySelector<HTMLElement>(
    "[data-kp-place-value-grid]"
  );
  if (sourceGrid === null) {
    throw new Error(
      `${input.config.place} exchange source lacks its semantic grid.`
    );
  }
  const total = input.document.createElement("span");
  total.dataset["kpPlaceValueEvaluationTotal"] = "";
  const totalSelectorId =
    input.writtenOwnership === undefined
      ? input.exchange.sourceEntityId
      : bindKpPlaceValueWrittenMotionProxy(
          input.writtenOwnership.evaluatedTotalProxy
        );
  total.dataset["kpSemanticEntityId"] = totalSelectorId;
  total.dataset["kpPresentationGroupId"] = totalSelectorId;
  if (input.writtenOwnership !== undefined) {
    total.dataset["kpPlaceValueMotionRole"] =
      input.writtenOwnership.evaluatedTotalProxy.role;
    total.dataset["kpPlaceValueMotionSourceId"] =
      input.writtenOwnership.evaluatedTotalProxy.semanticEntityId;
  }
  total.style.display = "contents";
  total.append(...input.config.targetDigits.map((digit) =>
    totalDigit(input.document, digit)
  ));
  sourceGrid.append(total);

  const scene = createKpPlaceValueNativeSceneDom({
    document: input.document,
    sourceRoot: source.root,
    targetRoot: target.root,
    sourceSceneId:
      `scene.place-value.${input.config.place}-exchange.source`,
    targetSceneId:
      `scene.place-value.${input.config.place}-exchange.target`,
    successorSyntheses: [input.exchange.intent]
  });
  scene.root.dataset[input.config.stageDataset] = "";
  scene.root.dataset["kpIdentityFissionProgramId"] =
    input.exchange.forward.programId;
  const prepare = (): void => {
    scene.prepare();
    if (input.writtenOwnership !== undefined) {
      suppressDerivedNativeCopies(target, input.writtenOwnership);
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
          ? input.exchange.forward
          : input.exchange.rewind;
      const telemetry = execution.samplePhaseTelemetry(progress);
      const ownership = scene.apply(progress);
      const semanticTransferOccurred =
        progress >= input.exchange.transferProgress;
      const nativeEndpointOwnership =
        progress >= 1 ? "native-endpoint" as const : "transit" as const;
      scene.root.dataset["kpIdentityFissionDirection"] = direction;
      scene.root.dataset["kpIdentityFissionPhaseId"] =
        telemetry.activePhaseId;
      scene.root.dataset["kpIdentityFissionProgress"] = String(progress);
      scene.root.dataset["kpIdentityTransferOccurred"] =
        String(semanticTransferOccurred);
      scene.root.dataset["kpNativeEndpointOwnership"] =
        nativeEndpointOwnership;
      // Semantic fission happens at the shared junction; native ownership
      // cannot begin until the moving paint has completed its measured route.
      if (
        input.writtenOwnership !== undefined &&
        nativeEndpointOwnership === "native-endpoint"
      ) {
        suppressDerivedMaterialCopies(
          scene.root,
          input.writtenOwnership
        );
      }
      return Object.freeze({
        ownership,
        semanticTransferOccurred,
        nativeEndpointOwnership
      });
    },
    dispose: scene.dispose
  });
}

function configureSource(
  dom: KpPlaceValueWrittenColumnDomProjection,
  config: ExchangeConfig
): void {
  for (const id of config.sourceHiddenIds) {
    dom.cellElements.get(id)!.dataset["kpVisibility"] = "hidden";
  }
  for (const id of config.sourceVisibleIds) {
    dom.cellElements.get(id)!.dataset["kpVisibility"] = "visible";
  }
}

function createBinding(
  config: ExchangeConfig,
  ownership?: KpPlaceValueOnesWrittenOwnershipPlan
): KpSuccessorSynthesisBinding {
  const sourceAnnotationId =
    `annotation.${config.place}.evaluated-total`;
  const targetAnnotationIds = [
    `annotation.${config.place}.remainder`,
    `annotation.${config.place}.carry`
  ] as const;
  return Object.freeze({
    id: `successor.place-value.exchange-${config.place}`,
    relationRecordId: `relation.place-value.exchange-${config.place}`,
    authority: Object.freeze({
      operationId: "kp.core.fan-out",
      bindingId: `binding.place-value.exchange-${config.place}`
    }),
    // Carry targets traverse distinct result, addend, and carry bands. The
    // typed topology selects the shared obstacle-clearing fission route
    // without exposing coordinates or per-column motion to this caller.
    layoutTopology: "separate-source-result-bands" as const,
    sourceAnnotations: Object.freeze([
      Object.freeze({
        id: sourceAnnotationId,
        semanticRole: "evaluated-column-total",
        selectorIds: Object.freeze([
          ownership === undefined
            ? config.sourceEntityId
            : bindKpPlaceValueWrittenMotionProxy(
                ownership.evaluatedTotalProxy
              )
        ]),
        contribution: "material-input" as const,
        propagationRank: 0,
        pathFamily: "arc-above" as const
      })
    ]),
    targetAnnotations: Object.freeze(config.targetEntityIds.map(
      (semanticTargetId, index) => Object.freeze({
        id: targetAnnotationIds[index]!,
        semanticRole:
          index === 0 ? "settled-remainder" : "carried-next-place",
        selectorIds: Object.freeze([
          ownership === undefined
            ? semanticTargetId
            : bindKpPlaceValueWrittenMotionProxy(
                ownership.derivedOutputProxies[index]!
              )
        ]),
        propagationRank: index,
        pathFamily:
          index === 0 ? "arc-below" as const : "arc-above" as const
      })
    )),
    lineages: Object.freeze([
      Object.freeze({
        id: `lineage.place-value.exchange-${config.place}.paint`,
        sourceAnnotationIds: Object.freeze([sourceAnnotationId]),
        targetAnnotationIds: Object.freeze([...targetAnnotationIds])
      })
    ])
  });
}

function configureOnesExchangeOverlay(input: {
  readonly source: KpPlaceValueWrittenColumnDomProjection;
  readonly target: KpPlaceValueWrittenColumnDomProjection;
  readonly ownership: KpPlaceValueOnesWrittenOwnershipPlan;
}): void {
  if (!isKpPlaceValueOnesWrittenOwnershipPlan(input.ownership)) {
    throw new Error(
      "Ones exchange overlay requires compiler-owned written authority."
    );
  }
  hideProjectionPaint(input.source);
  hideProjectionPaint(input.target);
  for (const proxy of input.ownership.derivedOutputProxies) {
    const element = input.target.cellElements.get(proxy.targetCellId);
    if (element === undefined) {
      throw new Error(
        `Ones exchange lacks persistent target ${proxy.targetCellId}.`
      );
    }
    element.dataset["kpVisibility"] = "visible";
    element.dataset["kpSemanticEntityId"] =
      bindKpPlaceValueWrittenMotionProxy(proxy);
    element.dataset["kpPresentationGroupId"] =
      bindKpPlaceValueWrittenMotionProxy(proxy);
    element.dataset["kpPlaceValueMotionRole"] = proxy.role;
    element.dataset["kpPlaceValueMotionTargetId"] = proxy.targetCellId;
  }
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

function suppressDerivedNativeCopies(
  target: KpPlaceValueWrittenColumnDomProjection,
  ownership: KpPlaceValueOnesWrittenOwnershipPlan
): void {
  for (const proxy of ownership.derivedOutputProxies) {
    // The material proxy may move to this measured slot, but native settlement
    // belongs to the already-connected cell in the documentary scaffold.
    target.cellElements.get(proxy.targetCellId)!.style.opacity = "0";
  }
}

function suppressDerivedMaterialCopies(
  root: HTMLElement,
  ownership: KpPlaceValueOnesWrittenOwnershipPlan
): void {
  const annotationIds = new Set([
    "annotation.ones.remainder",
    "annotation.ones.carry"
  ]);
  for (const owner of root.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )) {
    const semanticEntityId =
      owner.dataset["kpEquationMaterialSemanticEntityId"];
    if (
      semanticEntityId !== undefined &&
      annotationIds.has(semanticEntityId)
    ) {
      owner.style.opacity = "0";
      const index =
        semanticEntityId === "annotation.ones.remainder" ? 0 : 1;
      owner.dataset["kpPlaceValueMotionSelectorId"] =
        bindKpPlaceValueWrittenMotionProxy(
          ownership.derivedOutputProxies[index]!
        );
    }
  }
}

function totalDigit(
  document: Document,
  digit: ExchangeConfig["targetDigits"][number]
): HTMLElement {
  const root = document.createElement("span");
  root.dataset["kpPlaceValueEvaluationDigit"] = "";
  root.dataset["kpPlaceValueNativeRoot"] = "";
  root.dataset["kpPlaceValueRow"] = "result";
  root.dataset["kpPlaceValueColumn"] = digit.column;
  root.dataset["kpVisibility"] = "visible";
  root.innerHTML = renderLatexToHtml(digit.latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return root;
}

function isSealedExchange(
  value: unknown
): value is KpPlaceValueColumnExchange {
  return typeof value === "object" &&
    value !== null &&
    sealedExchanges.has(value);
}
