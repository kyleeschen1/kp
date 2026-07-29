import {
  equalKpRationals
} from "../../domains/math/exact-rational.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame,
  type KpExactFractionQuantityNeutralFrame
} from "../animation/exact-fraction-quantity-neutral-frame.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";
import {
  certifyKpExactFractionQuantityViewBundle,
  createKpExactFractionQuantityViewObligation,
  type KpExactFractionQuantityViewBundle
} from "../semantic/exact-fraction-quantity-view-obligations.ts";
import {
  projectKpExactFractionQuantityBar,
  type KpExactFractionQuantityBarFrame
} from "./exact-fraction-quantity-bar-projection.ts";
import {
  projectKpExactFractionQuantityCircle,
  type KpExactFractionQuantityCircleFrame
} from "./exact-fraction-quantity-circle-projection.ts";
import {
  projectKpExactFractionQuantityNumberLine,
  type KpExactFractionQuantityNumberLineFrame
} from "./exact-fraction-quantity-number-line-projection.ts";
import {
  createKpExactFractionQuantitySymbolicProjection,
  type KpExactFractionQuantitySymbolicProjection,
  type KpExactFractionSymbolicEndpoint
} from "./exact-fraction-quantity-symbolic-projection.ts";

declare const kpSynchronizedExactFractionFrameBrand: unique symbol;

const sealedSynchronizedFrames = new WeakSet<object>();

export interface KpExactFractionAtomicCorrespondence {
  readonly atomicPartId: string;
  readonly semanticSelectionIds: readonly string[];
  readonly symbolicSelectorIds: readonly string[];
  readonly circleSectorId: string;
  readonly barPartId: string;
  readonly numberLineIntervalId: string;
  readonly selected: boolean;
}

export interface KpExactFractionSelectionCorrespondence {
  readonly selectionId: string;
  readonly atomicPartIds: readonly string[];
  readonly symbolicSelectorIds: readonly string[];
  readonly circleSectorIds: readonly string[];
  readonly barPartIds: readonly string[];
  readonly numberLineIntervalIds: readonly string[];
  readonly transcriptRefId: string;
  readonly focused: boolean;
}

export interface KpExactFractionQuantitySynchronizedFrame {
  readonly schemaVersion:
    "kp.exact-fraction-quantity-synchronized-frame.v1";
  readonly traceId: string;
  readonly neutralFrame: KpExactFractionQuantityNeutralFrame;
  readonly symbolicEndpoint: KpExactFractionSymbolicEndpoint;
  readonly circle: KpExactFractionQuantityCircleFrame;
  readonly bar: KpExactFractionQuantityBarFrame;
  readonly numberLine: KpExactFractionQuantityNumberLineFrame;
  readonly atomicCorrespondences:
    readonly KpExactFractionAtomicCorrespondence[];
  readonly selectionCorrespondences:
    readonly KpExactFractionSelectionCorrespondence[];
  readonly viewObligations: KpExactFractionQuantityViewBundle;
  readonly [kpSynchronizedExactFractionFrameBrand]: true;
}

export interface CertifyKpExactFractionQuantitySynchronizedFrameInput {
  readonly trace: KpExactFractionQuantityTrace;
  readonly neutralFrame: KpExactFractionQuantityNeutralFrame;
  readonly symbolic: KpExactFractionQuantitySymbolicProjection;
  readonly circle: KpExactFractionQuantityCircleFrame;
  readonly bar: KpExactFractionQuantityBarFrame;
  readonly numberLine: KpExactFractionQuantityNumberLineFrame;
}

export function sampleKpExactFractionQuantitySynchronizedFrame(input: {
  readonly progress: number;
}): KpExactFractionQuantitySynchronizedFrame {
  const trace = createKpExactFractionQuantityTrace();
  const neutralFrame = sampleKpExactFractionQuantityNeutralFrame({
    progress: input.progress,
    trace
  });
  return certifyKpExactFractionQuantitySynchronizedFrame({
    trace,
    neutralFrame,
    symbolic: createKpExactFractionQuantitySymbolicProjection(trace),
    circle: projectKpExactFractionQuantityCircle(neutralFrame),
    bar: projectKpExactFractionQuantityBar(neutralFrame),
    numberLine: projectKpExactFractionQuantityNumberLine(neutralFrame)
  });
}

export function certifyKpExactFractionQuantitySynchronizedFrame(
  input: CertifyKpExactFractionQuantitySynchronizedFrameInput
): KpExactFractionQuantitySynchronizedFrame {
  assertSharedFrame(input);
  const symbolicEndpoint = input.symbolic.endpoints.find(
    ({ stateId }) => stateId === input.neutralFrame.targetStateId
  );
  if (symbolicEndpoint === undefined) {
    throw new Error(
      "Synchronized exact-fraction frame lacks its symbolic target endpoint."
    );
  }
  const symbolicBySelection = symbolicSelectorsBySelection(
    input.neutralFrame.targetStateId,
    input.neutralFrame.targetSelections.length
  );
  const availableSymbolicIds = new Set(
    symbolicEndpoint.annotated.annotations.map(({ selectorId }) => selectorId)
  );
  for (const selectorIds of symbolicBySelection) {
    if (selectorIds.some((selectorId) => !availableSymbolicIds.has(selectorId))) {
      throw new Error(
        "Synchronized exact-fraction frame references a missing symbolic selector."
      );
    }
  }
  const atomicCorrespondences = Object.freeze(
    input.neutralFrame.atomicPartIds.map((atomicPartId) => {
      const circle = requireAtomic(
        input.circle.sectors,
        atomicPartId,
        "circle sector"
      );
      const bar = requireAtomic(input.bar.parts, atomicPartId, "bar part");
      const numberLine = requireAtomic(
        input.numberLine.intervals,
        atomicPartId,
        "number-line interval"
      );
      assertConcreteAgreement(circle, bar, numberLine, atomicPartId);
      const semanticSelectionIds = input.neutralFrame.targetSelections
        .filter(({ atomicPartIds }) => atomicPartIds.includes(atomicPartId))
        .map(({ selectionId }) => selectionId);
      const symbolicSelectorIds = uniqueStrings(
        input.neutralFrame.targetSelections.flatMap((selection, index) =>
          selection.atomicPartIds.includes(atomicPartId)
            ? symbolicBySelection[index] ?? []
            : []
        )
      );
      if (
        (semanticSelectionIds.length > 0) !== circle.selected ||
        (circle.selected && symbolicSelectorIds.length === 0)
      ) {
        throw new Error(
          `Cross-view selected identity diverges for ${atomicPartId}.`
        );
      }
      return Object.freeze({
        atomicPartId,
        semanticSelectionIds: Object.freeze(semanticSelectionIds),
        symbolicSelectorIds: Object.freeze(symbolicSelectorIds),
        circleSectorId: circle.id,
        barPartId: bar.id,
        numberLineIntervalId: numberLine.id,
        selected: circle.selected
      });
    })
  );
  assertUniqueConcreteRefs(atomicCorrespondences);
  const selectionCorrespondences = Object.freeze(
    input.neutralFrame.targetSelections.map((selection, index) => {
      const atomic = selection.atomicPartIds.map((atomicPartId) => {
        const entry = atomicCorrespondences.find((candidate) =>
          candidate.atomicPartId === atomicPartId
        );
        if (entry === undefined) {
          throw new Error(
            `Selection ${selection.selectionId} lacks ${atomicPartId}.`
          );
        }
        return entry;
      });
      return Object.freeze({
        selectionId: selection.selectionId,
        atomicPartIds: selection.atomicPartIds,
        symbolicSelectorIds: Object.freeze(symbolicBySelection[index] ?? []),
        circleSectorIds: Object.freeze(atomic.map(({ circleSectorId }) =>
          circleSectorId
        )),
        barPartIds: Object.freeze(atomic.map(({ barPartId }) => barPartId)),
        numberLineIntervalIds: Object.freeze(atomic.map(
          ({ numberLineIntervalId }) => numberLineIntervalId
        )),
        transcriptRefId: `transcript.selection.${selection.selectionId}`,
        focused: input.neutralFrame.focusSelectionIds.includes(
          selection.selectionId
        )
      });
    })
  );
  const viewObligations = createViewObligations(input.trace);
  const synchronized = Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-synchronized-frame.v1",
    traceId: input.trace.id,
    neutralFrame: input.neutralFrame,
    symbolicEndpoint,
    circle: input.circle,
    bar: input.bar,
    numberLine: input.numberLine,
    atomicCorrespondences,
    selectionCorrespondences,
    viewObligations
  });
  sealedSynchronizedFrames.add(synchronized);
  return synchronized as KpExactFractionQuantitySynchronizedFrame;
}

export function isKpExactFractionQuantitySynchronizedFrame(
  value: unknown
): value is KpExactFractionQuantitySynchronizedFrame {
  return typeof value === "object" &&
    value !== null &&
    sealedSynchronizedFrames.has(value);
}

function assertSharedFrame(
  input: CertifyKpExactFractionQuantitySynchronizedFrameInput
): void {
  const traceIds = [
    input.neutralFrame.traceId,
    input.symbolic.traceId,
    input.circle.traceId,
    input.bar.traceId,
    input.numberLine.traceId
  ];
  if (traceIds.some((traceId) => traceId !== input.trace.id)) {
    throw new Error("Synchronized views must share one verified trace.");
  }
  const frameIds = [
    input.circle.neutralFrameId,
    input.bar.neutralFrameId,
    input.numberLine.neutralFrameId
  ];
  if (frameIds.some((frameId) => frameId !== input.neutralFrame.id)) {
    throw new Error("Synchronized concrete views must share one neutral frame.");
  }
  if (
    !equalKpRationals(
      input.circle.exactSelectedMeasure,
      input.neutralFrame.exactTotal
    ) ||
    !equalKpRationals(
      input.bar.exactSelectedMeasure,
      input.neutralFrame.exactTotal
    ) ||
    !equalKpRationals(
      input.numberLine.exactEndpoint,
      input.neutralFrame.exactTotal
    )
  ) {
    throw new Error("Synchronized views must preserve one exact total.");
  }
}

function requireAtomic<
  Entry extends {
    readonly id: string;
    readonly atomicPartId: string;
    readonly selected: boolean;
    readonly lifecycle: "persist" | "fission" | "fusion";
    readonly sourceSelectionIds: readonly string[];
    readonly targetSelectionIds: readonly string[];
  }
>(
  entries: readonly Entry[],
  atomicPartId: string,
  label: string
): Entry {
  const matches = entries.filter((entry) =>
    entry.atomicPartId === atomicPartId
  );
  if (matches.length !== 1) {
    throw new Error(
      `Synchronized ${label} must contain ${atomicPartId} exactly once.`
    );
  }
  return matches[0]!;
}

function assertConcreteAgreement(
  circle: {
    readonly selected: boolean;
    readonly lifecycle: string;
    readonly sourceSelectionIds: readonly string[];
    readonly targetSelectionIds: readonly string[];
  },
  bar: typeof circle,
  numberLine: typeof circle,
  atomicPartId: string
): void {
  const signature = (entry: typeof circle) => JSON.stringify({
    selected: entry.selected,
    lifecycle: entry.lifecycle,
    sourceSelectionIds: entry.sourceSelectionIds,
    targetSelectionIds: entry.targetSelectionIds
  });
  if (
    signature(circle) !== signature(bar) ||
    signature(circle) !== signature(numberLine)
  ) {
    throw new Error(
      `Concrete view correspondence diverges for ${atomicPartId}.`
    );
  }
}

function assertUniqueConcreteRefs(
  entries: readonly KpExactFractionAtomicCorrespondence[]
): void {
  for (const key of [
    "circleSectorId",
    "barPartId",
    "numberLineIntervalId"
  ] as const) {
    const ids = entries.map((entry) => entry[key]);
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Cross-view ${key} references must be unique.`);
    }
  }
}

function symbolicSelectorsBySelection(
  stateId: string,
  selectionCount: number
): readonly (readonly string[])[] {
  const values = stateId === "state.exact-fraction.established" ||
      stateId === "state.exact-fraction.refined" ||
      stateId === "state.exact-fraction.aligned"
    ? [
        ["symbolic.addend.third.numerator"],
        ["symbolic.addend.sixth.numerator"]
      ]
    : stateId === "state.exact-fraction.merged" ||
        stateId === "state.exact-fraction.recognized"
      ? [["symbolic.result.numerator"]]
      : [];
  if (values.length !== selectionCount) {
    throw new Error(
      `Symbolic correspondence is incomplete for ${stateId}.`
    );
  }
  return Object.freeze(values.map((entry) => Object.freeze(entry)));
}

function createViewObligations(
  trace: KpExactFractionQuantityTrace
): KpExactFractionQuantityViewBundle {
  return certifyKpExactFractionQuantityViewBundle(trace, {
    symbolic: createKpExactFractionQuantityViewObligation(
      "symbolic",
      trace,
      "Exact fraction addition rendered as native mathematical notation."
    ),
    "partitioned-circle": createKpExactFractionQuantityViewObligation(
      "partitioned-circle",
      trace,
      "The same exact selected parts shown in one partitioned circle."
    ),
    "fraction-bar": createKpExactFractionQuantityViewObligation(
      "fraction-bar",
      trace,
      "The same exact selected parts shown along one fraction bar."
    ),
    "number-line": createKpExactFractionQuantityViewObligation(
      "number-line",
      trace,
      "The same exact selected intervals composed on a number line."
    )
  });
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
