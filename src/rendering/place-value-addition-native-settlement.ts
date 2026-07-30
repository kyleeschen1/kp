import type {
  KpPlaceValueAdditionPresentationPlan
} from "../animation/place-value-addition-presentation-plan.ts";
import type {
  KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import type {
  KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection,
  type KpPlaceValueWrittenColumnDomProjection
} from "./place-value-addition-written-column-dom.ts";

declare const kpPlaceValueNativeSettlementBrand: unique symbol;

const sealedSettlements = new WeakSet<object>();

export interface KpPlaceValueNativeSettlement {
  readonly schemaVersion: "kp.place-value-addition-native-settlement.v1";
  readonly beatId: "beat.place-value.settle";
  readonly sourceEntityIds: readonly [
    "result.hundreds",
    "result.tens",
    "result.ones"
  ];
  readonly targetEntityId: "result";
  readonly endpointOwner: "native-katex";
  readonly handoffPolicy: "same-paint-root-no-first-frame";
  readonly opacityPolicy: "opaque";
  readonly [kpPlaceValueNativeSettlementBrand]: true;
}

export interface KpPlaceValueNativeSettlementDom {
  readonly root: HTMLElement;
  readonly nativeRoot: HTMLElement;
  readonly apply: (
    progress: number,
    direction: "forward" | "rewind"
  ) => KpNativeKatexSceneOwnershipFrame;
  readonly dispose: () => void;
}

export function compileKpPlaceValueNativeSettlement(
  presentation: KpPlaceValueAdditionPresentationPlan
): KpPlaceValueNativeSettlement {
  const beat = presentation.beats.find(
    ({ beatId }) => beatId === "beat.place-value.settle"
  );
  const program = beat?.programs[0];
  if (
    beat?.kind !== "settle" ||
    program?.kind !== "native-settlement" ||
    !sameIds(program.sourceEntityIds, [
      "result.hundreds",
      "result.tens",
      "result.ones"
    ]) ||
    program.targetEntityId !== "result" ||
    program.endpointOwner !== "native-katex" ||
    program.handoffPolicy !== "same-paint-root-no-first-frame" ||
    program.opacityPolicy !== "opaque"
  ) {
    throw new Error(
      "Place-value settlement requires its exhaustive native endpoint program."
    );
  }
  const settlement = Object.freeze({
    schemaVersion: "kp.place-value-addition-native-settlement.v1" as const,
    beatId: "beat.place-value.settle" as const,
    sourceEntityIds: Object.freeze([
      "result.hundreds",
      "result.tens",
      "result.ones"
    ] as const),
    targetEntityId: "result" as const,
    endpointOwner: "native-katex" as const,
    handoffPolicy: "same-paint-root-no-first-frame" as const,
    opacityPolicy: "opaque" as const
  });
  sealedSettlements.add(settlement);
  return settlement as unknown as KpPlaceValueNativeSettlement;
}

export function isKpPlaceValueNativeSettlement(
  value: unknown
): value is KpPlaceValueNativeSettlement {
  return typeof value === "object" &&
    value !== null &&
    sealedSettlements.has(value);
}

export function createKpPlaceValueNativeSettlementDom(input: {
  readonly document: Document;
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly settlement: KpPlaceValueNativeSettlement;
}): KpPlaceValueNativeSettlementDom {
  if (!isKpPlaceValueNativeSettlement(input.settlement)) {
    throw new Error(
      "Native settlement DOM requires compiler-owned settlement authority."
    );
  }
  const source = createKpPlaceValueWrittenColumnDomProjection({
    document: input.document,
    projection: input.projection,
    endpoint: "settled"
  });
  configureResultOnly(source, input.settlement.sourceEntityIds);
  // Settlement is already the native checkpoint. A clone transit between
  // identical paint roots would invent an extra owner and recreate the stale
  // first-frame risk this contract exists to exclude.
  source.root.dataset["kpPlaceValueNativeSettlement"] = "";
  source.root.dataset["kpPlaceValueOperationEndpoint"] = "target";
  source.root.dataset["kpNativeSettlementTargetEntityId"] =
    input.settlement.targetEntityId;
  return Object.freeze({
    root: source.root,
    nativeRoot: source.root,
    apply(progress: number, direction: "forward" | "rewind") {
      if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
        throw new Error(
          "Native settlement progress must be finite and normalized."
        );
      }
      source.root.dataset["kpNativeSettlementDirection"] = direction;
      source.root.dataset["kpNativeSettlementProgress"] = String(progress);
      return Object.freeze({
        visualOwner: "target-native" as const,
        sourceNativeOpacity: 0 as const,
        materialSceneOpacity: 0 as const,
        targetNativeOpacity: 1 as const,
        frames: Object.freeze([])
      });
    },
    dispose() {}
  });
}

function configureResultOnly(
  dom: KpPlaceValueWrittenColumnDomProjection,
  resultIds: readonly string[]
): void {
  const visible = new Set(resultIds);
  for (const [id, element] of dom.cellElements) {
    element.dataset["kpVisibility"] =
      visible.has(id) ? "visible" : "hidden";
  }
}

function sameIds(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}
