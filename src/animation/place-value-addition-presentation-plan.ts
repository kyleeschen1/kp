import type {
  KpAdjacentPlaceExchangeCertificate
} from "../../domains/quantities/place-value-exchange.ts";
import type {
  KpCarryRemainderLineage
} from "../../domains/quantities/place-value-regrouping.ts";
import {
  createKpExplicitStaticCheckpointPlan,
  type KpExplicitStaticCheckpointPlan
} from "./operation-presentation-plan-types.ts";
import {
  kpIdentityFissionExecutableProgram,
  type KpVerifiedIdentityFissionExecutableProgram
} from "./motifs/identity-fission-executable-program.ts";
import {
  kpOperationEvaluationExecutableProgramCompiler
} from "./operation-evaluation-presentation-registry.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  isKpPlaceValueAdditionTrace,
  kpPlaceValueAdditionTrace,
  type KpPlaceValueAdditionBeat,
  type KpPlaceValueAdditionTrace
} from "../semantic/place-value-addition-trace.ts";

declare const kpPlaceValuePresentationProgramBrand: unique symbol;
declare const kpPlaceValuePresentationPlanBrand: unique symbol;

const sealedPresentationPrograms = new WeakSet<object>();
const sealedPresentationPlans = new WeakSet<object>();

type KpOperationEvaluationExecutableProgram =
  typeof kpOperationEvaluationExecutableProgramCompiler.program;

interface KpPlaceValuePresentationProgramBase {
  readonly id: string;
  readonly beatId: KpPlaceValueAdditionBeat["id"];
  readonly scheduler: "shared-canonical-beat";
  readonly opacityPolicy: "opaque";
  readonly [kpPlaceValuePresentationProgramBrand]: true;
}

export type KpPlaceValuePresentationProgram =
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "operation-evaluation";
      readonly contributorIds: readonly [string, string, ...string[]];
      readonly catalystId: "operator.add";
      readonly resultId: string;
      readonly expression: "8 + 6 = 14" | "1 + 7 + 5 = 13" | "1 + 2 + 1 = 4";
      readonly executableProgram: KpOperationEvaluationExecutableProgram;
    })
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "adjacent-place-exchange";
      readonly role: "conservation-proof";
      readonly proof:
        | KpAdjacentPlaceExchangeCertificate<"ones", "tens">
        | KpAdjacentPlaceExchangeCertificate<"tens", "hundreds">;
    })
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "carry-split";
      readonly sourceEvaluationId: string;
      readonly remainderId: string;
      readonly carryId: string;
      readonly lineage:
        | KpCarryRemainderLineage<"ones", "tens">
        | KpCarryRemainderLineage<"tens", "hundreds">;
      readonly executableProgram: KpVerifiedIdentityFissionExecutableProgram;
    })
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "persistent-translation";
      readonly entityIds: readonly [string, ...string[]];
      readonly identityPolicy: "same-entity-continuous";
    })
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "native-settlement";
      readonly sourceEntityIds: readonly [string, ...string[]];
      readonly targetEntityId: "result";
      readonly endpointOwner: "native-katex";
      readonly handoffPolicy: "same-paint-root-no-first-frame";
    });

type ProgramOf<Kind extends KpPlaceValuePresentationProgram["kind"]> =
  Extract<KpPlaceValuePresentationProgram, { readonly kind: Kind }>;

interface KpPlaceValuePresentationBeatBase {
  readonly beatId: KpPlaceValueAdditionBeat["id"];
  readonly traceOperation: KpPlaceValueAdditionBeat["operation"];
}

export type KpPlaceValueAdditionPresentationBeat =
  | (KpPlaceValuePresentationBeatBase & {
      readonly kind: "establish";
      readonly programs: readonly [
        ProgramOf<"persistent-translation">
      ];
    })
  | (KpPlaceValuePresentationBeatBase & {
      readonly kind: "evaluate";
      readonly programs: readonly [
        ProgramOf<"operation-evaluation">,
        ProgramOf<"persistent-translation">
      ];
    })
  | (KpPlaceValuePresentationBeatBase & {
      readonly kind: "exchange-and-carry";
      readonly programs: readonly [
        ProgramOf<"adjacent-place-exchange">,
        ProgramOf<"carry-split">,
        ProgramOf<"persistent-translation">
      ];
    })
  | (KpPlaceValuePresentationBeatBase & {
      readonly kind: "settle";
      readonly programs: readonly [
        ProgramOf<"native-settlement">,
        ProgramOf<"persistent-translation">
      ];
    });

export interface KpPlaceValueAdditionPresentationPlan {
  readonly schemaVersion: "kp.place-value-addition-presentation-plan.v1";
  readonly traceId: typeof kpPlaceValueAdditionTrace.id;
  readonly beats: readonly KpPlaceValueAdditionPresentationBeat[];
  readonly programVocabulary: readonly [
    "operation-evaluation",
    "adjacent-place-exchange",
    "carry-split",
    "persistent-translation",
    "native-settlement"
  ];
  readonly fallbackPolicy: "reject-animation";
  readonly schedulerVocabulary: readonly ["shared-canonical-beat"];
  readonly [kpPlaceValuePresentationPlanBrand]: true;
}

export type KpPlaceValueAdditionPresentationResolution =
  | {
      readonly kind: "verified-animated";
      readonly plan: KpPlaceValueAdditionPresentationPlan;
    }
  | {
      readonly kind: "explicit-static";
      readonly checkpoint: KpExplicitStaticCheckpointPlan;
    };

export function createKpPlaceValueAdditionPresentationPlan(
  trace: KpPlaceValueAdditionTrace = kpPlaceValueAdditionTrace
): KpPlaceValueAdditionPresentationPlan {
  if (!isKpPlaceValueAdditionTrace(trace)) {
    throw new Error(
      "Animated place-value presentation requires a compiler-owned trace."
    );
  }
  const beats = Object.freeze(
    trace.beats.map((beat) => compileBeat(trace, beat))
  );
  if (
    beats.length !== trace.beats.length ||
    beats.some((beat, index) => beat.beatId !== trace.beats[index]?.id)
  ) {
    throw new Error(
      "Place-value presentation must bind every trace beat exactly once."
    );
  }
  const plan = Object.freeze({
    schemaVersion: "kp.place-value-addition-presentation-plan.v1" as const,
    traceId: trace.id,
    beats,
    programVocabulary: Object.freeze([
      "operation-evaluation",
      "adjacent-place-exchange",
      "carry-split",
      "persistent-translation",
      "native-settlement"
    ] as const),
    fallbackPolicy: "reject-animation" as const,
    schedulerVocabulary: Object.freeze(["shared-canonical-beat"] as const)
  });
  sealedPresentationPlans.add(plan);
  return plan as unknown as KpPlaceValueAdditionPresentationPlan;
}

export function resolveKpPlaceValueAdditionPresentation(
  trace: unknown
): KpPlaceValueAdditionPresentationResolution {
  if (!isKpPlaceValueAdditionTrace(trace)) {
    return Object.freeze({
      kind: "explicit-static" as const,
      checkpoint: createKpExplicitStaticCheckpointPlan({
        transformationId: "trace.place-value-addition.unverified",
        reason: "missing-verified-plan",
        summary:
          "Place-value work stays static because no compiler-owned trace can authorize motion."
      })
    });
  }
  return Object.freeze({
    kind: "verified-animated" as const,
    plan: createKpPlaceValueAdditionPresentationPlan(trace)
  });
}

export function isKpPlaceValuePresentationProgram(
  value: unknown
): value is KpPlaceValuePresentationProgram {
  return typeof value === "object" &&
    value !== null &&
    sealedPresentationPrograms.has(value);
}

export function isKpPlaceValueAdditionPresentationPlan(
  value: unknown
): value is KpPlaceValueAdditionPresentationPlan {
  return typeof value === "object" &&
    value !== null &&
    sealedPresentationPlans.has(value);
}

function compileBeat(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat
): KpPlaceValueAdditionPresentationBeat {
  const persistence = persistentProgram(trace, beat);
  switch (beat.operation) {
    case "establish":
      return Object.freeze({
        beatId: beat.id,
        traceOperation: beat.operation,
        kind: "establish" as const,
        programs: Object.freeze([persistence] as const)
      });
    case "evaluate-column":
      return Object.freeze({
        beatId: beat.id,
        traceOperation: beat.operation,
        kind: "evaluate" as const,
        programs: Object.freeze([
          evaluationProgram(trace, beat),
          persistence
        ] as const)
      });
    case "exchange-adjacent-place":
      return Object.freeze({
        beatId: beat.id,
        traceOperation: beat.operation,
        kind: "exchange-and-carry" as const,
        programs: Object.freeze([
          exchangeProgram(trace, beat),
          carrySplitProgram(trace, beat),
          persistence
        ] as const)
      });
    case "settle-native-result":
      return Object.freeze({
        beatId: beat.id,
        traceOperation: beat.operation,
        kind: "settle" as const,
        programs: Object.freeze([
          nativeSettlementProgram(trace, beat),
          persistence
        ] as const)
      });
    default:
      return assertNever(beat.operation);
  }
}

function evaluationProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat
): ProgramOf<"operation-evaluation"> {
  const details =
    beat.id === "beat.place-value.evaluate-ones"
      ? {
          expression: "8 + 6 = 14" as const,
          resultId: "evaluation.ones.total"
        }
      : beat.id === "beat.place-value.evaluate-tens"
        ? {
            expression: "1 + 7 + 5 = 13" as const,
            resultId: "evaluation.tens.total"
          }
        : beat.id === "beat.place-value.evaluate-hundreds"
          ? {
              expression: "1 + 2 + 1 = 4" as const,
              resultId: trace.proofs.hundreds.result.id
            }
          : undefined;
  if (
    details === undefined ||
    beat.contributorIds.length < 2 ||
    beat.outputIds.length !== 1 ||
    beat.outputIds[0] !== details.resultId
  ) {
    throw new Error(`Evaluation beat ${beat.id} lacks exact presentation inputs.`);
  }
  return mintProgram({
    id: `presentation.${beat.id}.operation-evaluation`,
    beatId: beat.id,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "operation-evaluation" as const,
    contributorIds: Object.freeze([...beat.contributorIds]) as
      readonly [string, string, ...string[]],
    catalystId: "operator.add" as const,
    resultId: details.resultId,
    expression: details.expression,
    executableProgram: kpOperationEvaluationExecutableProgramCompiler.program
  });
}

function exchangeProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat
): ProgramOf<"adjacent-place-exchange"> {
  const proof =
    beat.id === "beat.place-value.exchange-ones"
      ? trace.proofs.ones.exchange
      : beat.id === "beat.place-value.exchange-tens"
        ? trace.proofs.tens.exchange
        : undefined;
  if (proof === undefined) {
    throw new Error(`Exchange beat ${beat.id} lacks adjacent-place proof.`);
  }
  return mintProgram({
    id: `presentation.${beat.id}.adjacent-place-exchange`,
    beatId: beat.id,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "adjacent-place-exchange" as const,
    role: "conservation-proof" as const,
    proof
  });
}

function carrySplitProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat
): ProgramOf<"carry-split"> {
  const lineage =
    beat.id === "beat.place-value.exchange-ones"
      ? trace.proofs.ones
      : beat.id === "beat.place-value.exchange-tens"
        ? trace.proofs.tens
        : undefined;
  if (
    lineage === undefined ||
    beat.contributorIds.length !== 1 ||
    beat.outputIds.length !== 2
  ) {
    throw new Error(`Carry beat ${beat.id} lacks one-to-two lineage.`);
  }
  return mintProgram({
    id: `presentation.${beat.id}.carry-split`,
    beatId: beat.id,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "carry-split" as const,
    sourceEvaluationId: beat.contributorIds[0]!,
    remainderId: lineage.remainder.id,
    carryId: lineage.carry.id,
    lineage,
    executableProgram: kpIdentityFissionExecutableProgram
  });
}

function persistentProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat
): ProgramOf<"persistent-translation"> {
  const state = trace.states.find(({ id }) => id === beat.toStateId);
  if (state === undefined) {
    throw new Error(`Presentation beat ${beat.id} targets an unknown state.`);
  }
  const entityIds = new Set<string>([
    ...trace.beats[0]!.contributorIds,
    "operator.add",
    reference.primaryStage.underline.id,
    ...state.settledResultIds,
    ...state.visibleCarryIds
  ]);
  for (const owned of [
    ...beat.contributorIds,
    ...beat.outputIds
  ]) {
    if (beat.operation !== "establish") {
      entityIds.delete(owned);
    }
  }
  if (beat.operation === "evaluate-column") {
    entityIds.delete("operator.add");
  }
  if (entityIds.size === 0) {
    throw new Error(`Presentation beat ${beat.id} has no continuants.`);
  }
  return mintProgram({
    id: `presentation.${beat.id}.persistent-translation`,
    beatId: beat.id,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "persistent-translation" as const,
    entityIds: Object.freeze([...entityIds]) as readonly [string, ...string[]],
    identityPolicy: "same-entity-continuous" as const
  });
}

function nativeSettlementProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat
): ProgramOf<"native-settlement"> {
  if (
    beat.id !== "beat.place-value.settle" ||
    beat.contributorIds.length < 1 ||
    beat.outputIds[0] !== trace.proofs.hundreds.result.quantityId
  ) {
    throw new Error("Native settlement must close the exact result decomposition.");
  }
  return mintProgram({
    id: `presentation.${beat.id}.native-settlement`,
    beatId: beat.id,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "native-settlement" as const,
    sourceEntityIds: Object.freeze([...beat.contributorIds]) as
      readonly [string, ...string[]],
    targetEntityId: "result" as const,
    endpointOwner: "native-katex" as const,
    handoffPolicy: "same-paint-root-no-first-frame" as const
  });
}

function mintProgram<const Program extends object>(
  program: Program
): Program & KpPlaceValuePresentationProgramBase {
  const sealed = Object.freeze(program);
  sealedPresentationPrograms.add(sealed);
  return sealed as Program & KpPlaceValuePresentationProgramBase;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported place-value trace operation ${String(value)}.`);
}
