import {
  certifyKpSettledColumnEvaluation,
  isKpSettledColumnEvaluationCertificate,
  type KpSettledColumnEvaluationCertificate
} from "../../domains/quantities/place-value-column-evaluation.ts";
import {
  isKpCarryRemainderLineage,
  type KpCarryRemainderLineage
} from "../../domains/quantities/place-value-regrouping.ts";
import {
  kpBaseTenPlaces
} from "../../domains/quantities/place-value.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  kpPlaceValueAdditionDecompositions as decomposition
} from "./place-value-addition-decomposition.ts";
import {
  kpPlaceValueAdditionCarryLineages as carryLineages
} from "./place-value-addition-lineage.ts";

declare const kpPlaceValueAdditionTraceBrand: unique symbol;

const sealedPlaceValueAdditionTraces = new WeakSet<object>();

export type KpPlaceValueAdditionStage =
  | "established"
  | "ones-evaluated"
  | "ones-exchanged"
  | "tens-evaluated"
  | "tens-exchanged"
  | "hundreds-evaluated"
  | "settled";

export interface KpPlaceValueAdditionState {
  readonly id: `state.place-value.${KpPlaceValueAdditionStage}`;
  readonly stage: KpPlaceValueAdditionStage;
  readonly settledResultIds: readonly string[];
  readonly visibleCarryIds: readonly string[];
  readonly activeColumnDigitTotal: number | null;
  readonly resolvedExactValue: bigint;
}

export interface KpPlaceValueAdditionBeat {
  readonly id: typeof reference.beats[number]["id"];
  readonly operation:
    | "establish"
    | "evaluate-column"
    | "exchange-adjacent-place"
    | "settle-native-result";
  readonly fromStateId?: KpPlaceValueAdditionState["id"];
  readonly toStateId: KpPlaceValueAdditionState["id"];
  readonly dependencyBeatIds: readonly KpPlaceValueAdditionBeat["id"][];
  readonly contributorIds: readonly string[];
  readonly outputIds: readonly string[];
  readonly proofIds: readonly string[];
}

export interface KpPlaceValueAdditionTrace {
  readonly schemaVersion: "kp.place-value-addition-trace.v1";
  readonly id: "trace.place-value-addition.278-plus-156";
  readonly expression: "278 + 156 = 434";
  readonly direction: "ones-to-tens-to-hundreds";
  readonly states: readonly KpPlaceValueAdditionState[];
  readonly beats: readonly KpPlaceValueAdditionBeat[];
  readonly proofs: {
    readonly ones: KpCarryRemainderLineage<"ones", "tens">;
    readonly tens: KpCarryRemainderLineage<"tens", "hundreds">;
    readonly hundreds: KpSettledColumnEvaluationCertificate<"hundreds">;
  };
  readonly verification: {
    readonly sourceSumVerified: true;
    readonly rightToLeftOrderVerified: true;
    readonly carryIdentityVerified: true;
    readonly exactResultVerified: true;
  };
  readonly [kpPlaceValueAdditionTraceBrand]: true;
}

export function createKpPlaceValueAdditionTrace():
KpPlaceValueAdditionTrace {
  const { first, second, result } = decomposition;
  if (first.quantity.value + second.quantity.value !== result.quantity.value) {
    throw new Error("Place-value addition source sum does not equal its result.");
  }
  if (
    !isKpCarryRemainderLineage(carryLineages.ones) ||
    !isKpCarryRemainderLineage(carryLineages.tens) ||
    carryLineages.tens.contributors[0] !== carryLineages.ones.carry
  ) {
    throw new Error("Place-value trace carry identities are not closed.");
  }

  const hundreds = certifyKpSettledColumnEvaluation(
    kpBaseTenPlaces.hundreds,
    Object.freeze([
      carryLineages.tens.carry,
      first.columns.hundreds,
      second.columns.hundreds
    ]),
    result.columns.hundreds
  );
  if (!isKpSettledColumnEvaluationCertificate(hundreds)) {
    throw new Error("Place-value hundreds evaluation is not certified.");
  }

  const states = Object.freeze([
    state("established", [], [], null, 0n),
    state("ones-evaluated", [], [], 14, 0n),
    state("ones-exchanged", ["result.ones"], ["carry.tens"], null, 4n),
    state(
      "tens-evaluated",
      ["result.ones"],
      ["carry.tens"],
      13,
      4n
    ),
    state(
      "tens-exchanged",
      ["result.ones", "result.tens"],
      ["carry.hundreds"],
      null,
      34n
    ),
    state(
      "hundreds-evaluated",
      ["result.ones", "result.tens", "result.hundreds"],
      [],
      4,
      434n
    ),
    state(
      "settled",
      ["result.ones", "result.tens", "result.hundreds"],
      [],
      null,
      434n
    )
  ] as const);
  const [
    establishReference,
    evaluateOnesReference,
    exchangeOnesReference,
    evaluateTensReference,
    exchangeTensReference,
    evaluateHundredsReference,
    settleReference
  ] = reference.beats;
  if (
    establishReference === undefined ||
    evaluateOnesReference === undefined ||
    exchangeOnesReference === undefined ||
    evaluateTensReference === undefined ||
    exchangeTensReference === undefined ||
    evaluateHundredsReference === undefined ||
    settleReference === undefined ||
    reference.beats.length !== 7
  ) {
    throw new Error("Place-value visual reference must contain seven beats.");
  }

  const initialIds = Object.freeze([
    first.columns.hundreds.id,
    first.columns.tens.id,
    first.columns.ones.id,
    second.columns.hundreds.id,
    second.columns.tens.id,
    second.columns.ones.id
  ]);
  const beats = Object.freeze([
    beat(
      establishReference.id,
      "establish",
      undefined,
      states[0].id,
      [],
      initialIds,
      initialIds,
      [first.id, second.id]
    ),
    beat(
      evaluateOnesReference.id,
      "evaluate-column",
      states[0].id,
      states[1].id,
      [establishReference.id],
      carryLineages.ones.contributors.map(({ id }) => id),
      ["evaluation.ones.total"],
      [carryLineages.ones.id]
    ),
    beat(
      exchangeOnesReference.id,
      "exchange-adjacent-place",
      states[1].id,
      states[2].id,
      [evaluateOnesReference.id],
      ["evaluation.ones.total"],
      [carryLineages.ones.remainder.id, carryLineages.ones.carry.id],
      [carryLineages.ones.exchange.id, carryLineages.ones.id]
    ),
    beat(
      evaluateTensReference.id,
      "evaluate-column",
      states[2].id,
      states[3].id,
      [exchangeOnesReference.id],
      carryLineages.tens.contributors.map(({ id }) => id),
      ["evaluation.tens.total"],
      [carryLineages.tens.id]
    ),
    beat(
      exchangeTensReference.id,
      "exchange-adjacent-place",
      states[3].id,
      states[4].id,
      [evaluateTensReference.id],
      ["evaluation.tens.total"],
      [carryLineages.tens.remainder.id, carryLineages.tens.carry.id],
      [carryLineages.tens.exchange.id, carryLineages.tens.id]
    ),
    beat(
      evaluateHundredsReference.id,
      "evaluate-column",
      states[4].id,
      states[5].id,
      [exchangeTensReference.id],
      hundreds.contributors.map(({ id }) => id),
      [hundreds.result.id],
      [hundreds.id]
    ),
    beat(
      settleReference.id,
      "settle-native-result",
      states[5].id,
      states[6].id,
      [evaluateHundredsReference.id],
      [
        hundreds.result.id,
        carryLineages.tens.remainder.id,
        carryLineages.ones.remainder.id
      ],
      [result.quantity.id],
      [result.id]
    )
  ]);

  const trace = Object.freeze({
    schemaVersion: "kp.place-value-addition-trace.v1" as const,
    id: "trace.place-value-addition.278-plus-156" as const,
    expression: "278 + 156 = 434" as const,
    direction: "ones-to-tens-to-hundreds" as const,
    states,
    beats,
    proofs: Object.freeze({
      ones: carryLineages.ones,
      tens: carryLineages.tens,
      hundreds
    }),
    verification: Object.freeze({
      sourceSumVerified: true as const,
      rightToLeftOrderVerified: true as const,
      carryIdentityVerified: true as const,
      exactResultVerified: true as const
    })
  });
  sealedPlaceValueAdditionTraces.add(trace);
  return trace as unknown as KpPlaceValueAdditionTrace;
}

export const kpPlaceValueAdditionTrace =
  createKpPlaceValueAdditionTrace();

export function isKpPlaceValueAdditionTrace(
  value: unknown
): value is KpPlaceValueAdditionTrace {
  return typeof value === "object" &&
    value !== null &&
    sealedPlaceValueAdditionTraces.has(value);
}

function state(
  stage: KpPlaceValueAdditionStage,
  settledResultIds: readonly string[],
  visibleCarryIds: readonly string[],
  activeColumnDigitTotal: number | null,
  resolvedExactValue: bigint
): KpPlaceValueAdditionState {
  return Object.freeze({
    id: `state.place-value.${stage}`,
    stage,
    settledResultIds: Object.freeze([...settledResultIds]),
    visibleCarryIds: Object.freeze([...visibleCarryIds]),
    activeColumnDigitTotal,
    resolvedExactValue
  });
}

function beat(
  id: KpPlaceValueAdditionBeat["id"],
  operation: KpPlaceValueAdditionBeat["operation"],
  fromStateId: KpPlaceValueAdditionState["id"] | undefined,
  toStateId: KpPlaceValueAdditionState["id"],
  dependencyBeatIds: readonly KpPlaceValueAdditionBeat["id"][],
  contributorIds: readonly string[],
  outputIds: readonly string[],
  proofIds: readonly string[]
): KpPlaceValueAdditionBeat {
  return Object.freeze({
    id,
    operation,
    ...(fromStateId === undefined ? {} : { fromStateId }),
    toStateId,
    dependencyBeatIds: Object.freeze([...dependencyBeatIds]),
    contributorIds: Object.freeze([...contributorIds]),
    outputIds: Object.freeze([...outputIds]),
    proofIds: Object.freeze([...proofIds])
  });
}
