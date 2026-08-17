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
  compileKpPlaceValueWrittenOwnership,
  isKpPlaceValueWrittenOwnershipPlan,
  type KpPlaceValueWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";

declare const kpPlaceValueColumnExchangeBrand: unique symbol;

const sealedExchanges = new WeakSet<object>();

type FissionDispatch = Extract<
  KpExecutableSuccessorMotifProgramAdapterDispatch,
  { readonly programKind: "identity-fission" }
>;

export interface KpPlaceValueColumnExchange {
  readonly schemaVersion: string;
  readonly program: KpPlaceValuePositionProgram & {
    readonly exchange: NonNullable<KpPlaceValuePositionProgram["exchange"]>;
  };
  readonly beatId: string;
  readonly positionId: string;
  readonly sourceEntityId: string;
  readonly targetEntityIds: readonly [string, string];
  readonly baseTenExchangeId: string;
  readonly transferProgress:
    typeof kpOpaqueIdentityTransferOwnershipProgress;
  readonly fissionPlan: KpFissionFusionPlan & { readonly mode: "fission" };
  readonly intent: KpNativeKatexIdentityTransferIntent & {
    readonly executableProgram: { readonly kind: "identity-fission" };
  };
  readonly forward: FissionDispatch;
  readonly rewind: FissionDispatch;
  readonly writtenOwnership: KpPlaceValueWrittenOwnershipPlan;
  readonly opacityPolicy: "opaque";
  readonly nativeHandoffPolicy: "only-at-route-completion";
  readonly [kpPlaceValueColumnExchangeBrand]: true;
}

export interface KpPlaceValueColumnExchangeFrame {
  readonly ownership: KpNativeKatexSceneOwnershipFrame;
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

export function compileKpPlaceValueColumnExchanges(
  presentation: KpPlaceValueAdditionPresentationPlan
): readonly KpPlaceValueColumnExchange[] {
  const exchanges = compileKpPlaceValueAdditionPositionPrograms()
    .filter((program): program is KpPlaceValuePositionProgram & {
      readonly exchange: NonNullable<
        KpPlaceValuePositionProgram["exchange"]
      >;
    } => program.exchange !== undefined)
    .map((program) => compileKpPlaceValueColumnExchange(
      presentation,
      program
    ));
  return Object.freeze(exchanges);
}

export function compileKpPlaceValueColumnExchange(
  presentation: KpPlaceValueAdditionPresentationPlan,
  program: KpPlaceValuePositionProgram
): KpPlaceValueColumnExchange {
  if (!isKpPlaceValuePositionProgram(program) || program.exchange === undefined) {
    throw new Error(
      "Column exchange requires compiler-owned nonterminal authority."
    );
  }
  const exchangeProgram = program as KpPlaceValuePositionProgram & {
    readonly exchange: NonNullable<KpPlaceValuePositionProgram["exchange"]>;
  };
  const spec = exchangeProgram.exchange;
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === spec.beatId
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
    carrySplit.sourceEvaluationId !==
      exchangeProgram.evaluation.evaluatedTotalEntityId ||
    carrySplit.remainderId !== spec.outputCellIds[0] ||
    carrySplit.carryId !== spec.outputCellIds[1] ||
    carrySplit.executableProgram.kind !== "identity-fission" ||
    exchangeProof?.kind !== "adjacent-place-exchange" ||
    exchangeProof.proof !== carrySplit.lineage.exchange
  ) {
    throw new Error(
      `Position ${program.position.sequenceIndex} requires exact exchange lineage and proof.`
    );
  }
  const namespace = program.position.id;
  const fissionPlan = compileKpFissionFusionPlan({
    id: `motion.place-value.exchange-${namespace}`,
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: `lineage.place-value.exchange-${namespace}`,
      sourceEntityIds: [exchangeProgram.evaluation.evaluatedTotalEntityId],
      targetEntityIds: spec.outputCellIds,
      edges: [{
        id: `edge.place-value.exchange-${namespace}`,
        relation: "split",
        sourceEntityIds: [exchangeProgram.evaluation.evaluatedTotalEntityId],
        targetEntityIds: spec.outputCellIds,
        summary:
          "The evaluated position total establishes its exact remainder and carry."
      }]
    }),
    semanticOrder: spec.outputCellIds,
    microStaggerSpan: 0,
    junctionScale: 1
  }) as KpFissionFusionPlan & { readonly mode: "fission" };
  const writtenOwnership = compileKpPlaceValueWrittenOwnership(program);
  const intent = createKpNativeKatexIdentityTransferIntent({
    binding: createBinding(exchangeProgram, writtenOwnership),
    executableProgram: carrySplit.executableProgram,
    direction: "forward",
    motion: "full"
  });
  if (
    !isKpNativeKatexIdentityTransferIntent(intent) ||
    intent.executableProgram.kind !== "identity-fission"
  ) {
    throw new Error(
      `Position ${program.position.sequenceIndex} lacks exchange fission authority.`
    );
  }
  const dispatch = (direction: "forward" | "rewind"): FissionDispatch => {
    const candidate = compileKpExecutableSuccessorMotifProgramAdapter({
      kind: "identity-fission",
      program: carrySplit.executableProgram,
      direction,
      primitive: { kind: "fission-fusion", plan: fissionPlan }
    });
    if (candidate.programKind !== "identity-fission") {
      throw new Error(
        `Position ${program.position.sequenceIndex} resolved the wrong exchange motif.`
      );
    }
    return candidate;
  };
  const exchange = Object.freeze({
    schemaVersion: spec.schemaVersion,
    program: exchangeProgram,
    beatId: spec.beatId,
    positionId: program.position.id,
    sourceEntityId: exchangeProgram.evaluation.evaluatedTotalEntityId,
    targetEntityIds: spec.outputCellIds,
    baseTenExchangeId: spec.baseTenExchangeId,
    transferProgress: kpOpaqueIdentityTransferOwnershipProgress,
    fissionPlan,
    intent,
    forward: dispatch("forward"),
    rewind: dispatch("rewind"),
    writtenOwnership,
    opacityPolicy: "opaque" as const,
    nativeHandoffPolicy: "only-at-route-completion" as const
  });
  sealedExchanges.add(exchange);
  return exchange as unknown as KpPlaceValueColumnExchange;
}

export function isKpPlaceValueColumnExchange(
  value: unknown
): value is KpPlaceValueColumnExchange {
  return typeof value === "object" &&
    value !== null &&
    sealedExchanges.has(value);
}

export function createKpPlaceValueColumnExchangeDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly exchange: KpPlaceValueColumnExchange;
}): KpPlaceValueColumnExchangeDom {
  if (!isKpPlaceValueColumnExchange(input.exchange)) {
    throw new Error(
      "Column-exchange DOM requires compiler authority."
    );
  }
  const { program, writtenOwnership: ownership } = input.exchange;
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
  configureExchangeOverlay({ source, target, ownership });
  const sourceGrid = source.root.querySelector<HTMLElement>(
    "[data-kp-place-value-grid]"
  );
  if (sourceGrid === null) {
    throw new Error(
      `Position ${program.position.sequenceIndex} source lacks its semantic grid.`
    );
  }
  const total = input.document.createElement("span");
  total.dataset["kpPlaceValueEvaluationTotal"] = "";
  const totalSelectorId = bindKpPlaceValueWrittenMotionProxy(
    ownership.evaluatedTotalProxy
  );
  total.dataset["kpSemanticEntityId"] = totalSelectorId;
  total.dataset["kpPresentationGroupId"] = totalSelectorId;
  total.dataset["kpPlaceValueMotionRole"] =
    ownership.evaluatedTotalProxy.role;
  total.dataset["kpPlaceValueMotionSourceId"] =
    ownership.evaluatedTotalProxy.semanticEntityId;
  total.style.display = "contents";
  total.append(...program.exchange.outputDigits.map((digit) =>
    totalDigit(input.document, input.projection, digit)
  ));
  sourceGrid.append(total);

  const scene = createKpPlaceValueNativeSceneDom({
    document: input.document,
    sourceRoot: source.root,
    targetRoot: target.root,
    sourceSceneId:
      `scene.place-value.${program.position.id}-exchange.source`,
    targetSceneId:
      `scene.place-value.${program.position.id}-exchange.target`,
    successorSyntheses: [input.exchange.intent]
  });
  scene.root.dataset[program.exchange.stageDataset] = "";
  scene.root.dataset["kpPlaceValuePositionId"] = program.position.id;
  scene.root.dataset["kpIdentityFissionProgramId"] =
    input.exchange.forward.programId;
  const prepare = (): void => {
    scene.prepare();
    suppressDerivedNativeCopies(target, ownership);
  };
  return Object.freeze({
    root: scene.root,
    sourceRoot: scene.sourceRoot,
    targetRoot: scene.targetRoot,
    prepare,
    apply(progress: number, direction: "forward" | "rewind") {
      const execution = direction === "forward"
        ? input.exchange.forward
        : input.exchange.rewind;
      const telemetry = execution.samplePhaseTelemetry(progress);
      const ownershipFrame = scene.apply(progress);
      const semanticTransferOccurred =
        progress >= input.exchange.transferProgress;
      const nativeEndpointOwnership =
        progress >= 1 ? "native-endpoint" as const : "transit" as const;
      scene.root.dataset["kpIdentityFissionDirection"] = direction;
      scene.root.dataset["kpIdentityFissionPhaseId"] = telemetry.activePhaseId;
      scene.root.dataset["kpIdentityFissionProgress"] = String(progress);
      scene.root.dataset["kpIdentityTransferOccurred"] =
        String(semanticTransferOccurred);
      scene.root.dataset["kpNativeEndpointOwnership"] =
        nativeEndpointOwnership;
      if (nativeEndpointOwnership === "native-endpoint") {
        suppressDerivedMaterialCopies(scene.root, ownership);
      }
      return Object.freeze({
        ownership: ownershipFrame,
        semanticTransferOccurred,
        nativeEndpointOwnership
      });
    },
    dispose: scene.dispose
  });
}

function createBinding(
  program: KpPlaceValuePositionProgram & {
    readonly exchange: NonNullable<KpPlaceValuePositionProgram["exchange"]>;
  },
  ownership: KpPlaceValueWrittenOwnershipPlan
): KpSuccessorSynthesisBinding {
  const namespace = program.position.id;
  const sourceAnnotationId = `annotation.${namespace}.evaluated-total`;
  const targetAnnotationIds = [
    `annotation.${namespace}.remainder`,
    `annotation.${namespace}.carry`
  ] as const;
  return Object.freeze({
    id: `successor.place-value.exchange-${namespace}`,
    relationRecordId: `relation.place-value.exchange-${namespace}`,
    authority: Object.freeze({
      operationId: "kp.core.fan-out",
      bindingId: `binding.place-value.exchange-${namespace}`
    }),
    layoutTopology: "separate-source-result-bands" as const,
    sourceAnnotations: Object.freeze([Object.freeze({
      id: sourceAnnotationId,
      semanticRole: "evaluated-column-total",
      selectorIds: Object.freeze([
        bindKpPlaceValueWrittenMotionProxy(ownership.evaluatedTotalProxy)
      ]),
      contribution: "material-input" as const,
      propagationRank: 0,
      pathFamily: "arc-above" as const
    })]),
    targetAnnotations: Object.freeze(
      ownership.derivedOutputProxies.map((proxy, index) => Object.freeze({
        id: targetAnnotationIds[index]!,
        semanticRole:
          index === 0 ? "settled-remainder" : "carried-next-position",
        selectorIds: Object.freeze([
          bindKpPlaceValueWrittenMotionProxy(proxy)
        ]),
        propagationRank: index,
        pathFamily:
          index === 0 ? "arc-below" as const : "arc-above" as const
      }))
    ),
    lineages: Object.freeze([Object.freeze({
      id: `lineage.place-value.exchange-${namespace}.paint`,
      sourceAnnotationIds: Object.freeze([sourceAnnotationId]),
      targetAnnotationIds: Object.freeze([...targetAnnotationIds])
    })])
  });
}

function configureExchangeOverlay(input: {
  readonly source: KpPlaceValueWrittenColumnDomProjection;
  readonly target: KpPlaceValueWrittenColumnDomProjection;
  readonly ownership: KpPlaceValueWrittenOwnershipPlan;
}): void {
  if (!isKpPlaceValueWrittenOwnershipPlan(input.ownership)) {
    throw new Error(
      "Exchange overlay requires compiler-owned written authority."
    );
  }
  hideProjectionPaint(input.source);
  hideProjectionPaint(input.target);
  for (const proxy of input.ownership.derivedOutputProxies) {
    const element = input.target.cellElements.get(proxy.targetCellId);
    if (element === undefined) {
      throw new Error(
        `Exchange lacks persistent target ${proxy.targetCellId}.`
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
  ownership: KpPlaceValueWrittenOwnershipPlan
): void {
  for (const proxy of ownership.derivedOutputProxies) {
    target.cellElements.get(proxy.targetCellId)!.style.opacity = "0";
  }
}

function suppressDerivedMaterialCopies(
  root: HTMLElement,
  ownership: KpPlaceValueWrittenOwnershipPlan
): void {
  const targetByAnnotation = new Map(
    ownership.derivedOutputProxies.map((proxy, index) => [
      index === 0
        ? `annotation.${ownership.position.id}.remainder`
        : `annotation.${ownership.position.id}.carry`,
      proxy
    ] as const)
  );
  for (const owner of root.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id]"
  )) {
    const proxy = targetByAnnotation.get(
      owner.dataset["kpEquationMaterialSemanticEntityId"] ?? ""
    );
    if (proxy !== undefined) {
      owner.style.opacity = "0";
      owner.dataset["kpPlaceValueMotionSelectorId"] =
        bindKpPlaceValueWrittenMotionProxy(proxy);
    }
  }
}

function totalDigit(
  document: Document,
  projection: KpPlaceValueWrittenColumnProjection,
  digit: KpPlaceValueEvaluationDigitSpec
): HTMLElement {
  const root = document.createElement("span");
  root.dataset["kpPlaceValueEvaluationDigit"] = "";
  root.dataset["kpPlaceValueNativeRoot"] = "";
  root.dataset["kpVisibility"] = "visible";
  const resultRow = projection.cells.find(
    ({ role }) => role === "result-digit"
  )?.row;
  if (resultRow === undefined) {
    throw new Error("Exchange total requires a result row.");
  }
  root.dataset["kpPlaceValueRow"] = resultRow;
  root.dataset["kpPlaceValueColumn"] = digit.columnId;
  root.innerHTML = renderLatexToHtml(digit.latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  return root;
}
