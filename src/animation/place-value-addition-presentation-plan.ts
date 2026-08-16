import {
  isKpCarryRemainderLineage,
  type KpCarryRemainderLineage
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
  compileKpPlaceValueAdditionPositionPrograms,
  isKpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-program.ts";
import type {
  KpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-types.ts";
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
  readonly beatId: string;
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
      readonly expression: string;
      readonly executableProgram: KpOperationEvaluationExecutableProgram;
    })
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "adjacent-place-exchange";
      readonly role: "conservation-proof";
      readonly proof: KpPlaceValueAdjacentExchangeProof;
    })
  | (KpPlaceValuePresentationProgramBase & {
      readonly kind: "carry-split";
      readonly sourceEvaluationId: string;
      readonly remainderId: string;
      readonly carryId: string;
      readonly lineage: KpPlaceValueCarryLineageProof;
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
  readonly beatId: string;
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
  readonly traceId: string;
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

export interface KpPlaceValueAdjacentExchangeProof {
  readonly id: string;
}

export interface KpPlaceValueCarryLineageProof {
  readonly id: string;
  readonly exchange: KpPlaceValueAdjacentExchangeProof;
  readonly remainder: { readonly id: string };
  readonly carry: { readonly id: string };
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
  const positionPrograms = compileKpPlaceValueAdditionPositionPrograms();
  const beats = Object.freeze(
    trace.beats.map((beat) => compileBeat(trace, beat, positionPrograms))
  );
  if (
    beats.length !== trace.beats.length ||
    beats.some((beat, index) => beat.beatId !== trace.beats[index]?.id)
  ) {
    throw new Error(
      "Place-value presentation must bind each trace beat once."
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

/**
 * Builds executable motion authority from an already certified ordered
 * position sequence. The renderer consumes this nominal plan without knowing
 * a fixture's width or familiar place labels.
 */
export function createKpGeneratedPlaceValueAdditionPresentationPlan(input: {
  readonly traceId: string;
  readonly positionPrograms: readonly KpPlaceValuePositionProgram[];
}): KpPlaceValueAdditionPresentationPlan {
  if (
    input.traceId.trim().length === 0 ||
    input.positionPrograms.length === 0 ||
    !input.positionPrograms.every(isKpPlaceValuePositionProgram)
  ) {
    throw new Error(
      "Generated presentation requires a certified position sequence."
    );
  }
  const beats: KpPlaceValueAdditionPresentationBeat[] = [];
  for (const program of input.positionPrograms) {
    const evaluation = mintProgram({
      id: `presentation.${program.evaluation.beatId}.operation-evaluation`,
      beatId: program.evaluation.beatId,
      scheduler: "shared-canonical-beat" as const,
      opacityPolicy: "opaque" as const,
      kind: "operation-evaluation" as const,
      contributorIds: program.evaluation.contributorCellIds as
        readonly [string, string, ...string[]],
      catalystId: "operator.add" as const,
      resultId: program.exchange === undefined
        ? program.terminalOutput!.outputs[0].targetCellId
        : program.evaluation.evaluatedTotalEntityId,
      expression: program.evaluation.expression,
      executableProgram: kpOperationEvaluationExecutableProgramCompiler.program
    });
    beats.push(Object.freeze({
      beatId: program.evaluation.beatId,
      traceOperation: "evaluate-column" as const,
      kind: "evaluate" as const,
      programs: Object.freeze([
        evaluation,
        generatedPersistence(program.evaluation.beatId, [
          ...program.evaluation.contributorCellIds,
          "operator.add"
        ])
      ] as const)
    }));
    if (program.exchange !== undefined) {
      const proof = Object.freeze({ id: program.exchange.baseTenExchangeId });
      const lineage = Object.freeze({
        id: `lineage.${program.position.id}.carry`,
        exchange: proof,
        remainder: Object.freeze({ id: program.exchange.outputCellIds[0] }),
        carry: Object.freeze({ id: program.exchange.outputCellIds[1] })
      });
      beats.push(Object.freeze({
        beatId: program.exchange.beatId,
        traceOperation: "exchange-adjacent-place" as const,
        kind: "exchange-and-carry" as const,
        programs: Object.freeze([
          mintProgram({
            id: `presentation.${program.exchange.beatId}.adjacent-place-exchange`,
            beatId: program.exchange.beatId,
            scheduler: "shared-canonical-beat" as const,
            opacityPolicy: "opaque" as const,
            kind: "adjacent-place-exchange" as const,
            role: "conservation-proof" as const,
            proof
          }),
          mintProgram({
            id: `presentation.${program.exchange.beatId}.carry-split`,
            beatId: program.exchange.beatId,
            scheduler: "shared-canonical-beat" as const,
            opacityPolicy: "opaque" as const,
            kind: "carry-split" as const,
            sourceEvaluationId: program.evaluation.evaluatedTotalEntityId,
            remainderId: program.exchange.outputCellIds[0],
            carryId: program.exchange.outputCellIds[1],
            lineage,
            executableProgram: kpIdentityFissionExecutableProgram
          }),
          generatedPersistence(program.exchange.beatId, [
            ...program.exchange.outputCellIds,
            "operator.add"
          ])
        ] as const)
      }));
    }
  }
  const plan = Object.freeze({
    schemaVersion: "kp.place-value-addition-presentation-plan.v1" as const,
    traceId: input.traceId,
    beats: Object.freeze(beats),
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
  beat: KpPlaceValueAdditionBeat,
  positionPrograms: readonly KpPlaceValuePositionProgram[]
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
          evaluationProgram(beat, positionPrograms),
          persistence
        ] as const)
      });
    case "exchange-adjacent-place":
      return Object.freeze({
        beatId: beat.id,
        traceOperation: beat.operation,
        kind: "exchange-and-carry" as const,
        programs: Object.freeze([
          exchangeProgram(trace, beat, positionPrograms),
          carrySplitProgram(trace, beat, positionPrograms),
          persistence
        ] as const)
      });
    case "settle-native-result":
      return Object.freeze({
        beatId: beat.id,
        traceOperation: beat.operation,
        kind: "settle" as const,
        programs: Object.freeze([
          nativeSettlementProgram(beat, positionPrograms),
          persistence
        ] as const)
      });
    default:
      return assertNever(beat.operation);
  }
}

function evaluationProgram(
  beat: KpPlaceValueAdditionBeat,
  positionPrograms: readonly KpPlaceValuePositionProgram[]
): ProgramOf<"operation-evaluation"> {
  const program = positionPrograms.find(
    ({ evaluation }) => evaluation.beatId === beat.id
  );
  const resultId = program?.exchange === undefined &&
      program?.terminalOutput?.outputs.length === 1
    ? program.terminalOutput.outputs[0].targetCellId
    : program?.evaluation.evaluatedTotalEntityId;
  if (
    program === undefined ||
    resultId === undefined ||
    beat.contributorIds.length < 2 ||
    beat.outputIds.length !== 1 ||
    beat.outputIds[0] !== resultId ||
    !sameIds(beat.contributorIds, program.evaluation.contributorCellIds)
  ) {
    throw new Error(`Evaluation beat ${beat.id} lacks exact inputs.`);
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
    resultId,
    expression: program.evaluation.expression,
    executableProgram: kpOperationEvaluationExecutableProgramCompiler.program
  });
}

function exchangeProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat,
  positionPrograms: readonly KpPlaceValuePositionProgram[]
): ProgramOf<"adjacent-place-exchange"> {
  const { lineage } = resolveExchangeContext(trace, beat, positionPrograms);
  return mintProgram({
    id: `presentation.${beat.id}.adjacent-place-exchange`,
    beatId: beat.id,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "adjacent-place-exchange" as const,
    role: "conservation-proof" as const,
    proof: lineage.exchange
  });
}

function carrySplitProgram(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat,
  positionPrograms: readonly KpPlaceValuePositionProgram[]
): ProgramOf<"carry-split"> {
  const { lineage } = resolveExchangeContext(trace, beat, positionPrograms);
  if (
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
    throw new Error(`Presentation beat ${beat.id} targets unknown state.`);
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

function generatedPersistence(
  beatId: string,
  entityIds: readonly string[]
): ProgramOf<"persistent-translation"> {
  if (entityIds.length === 0) {
    throw new Error(`Generated beat ${beatId} has no continuants.`);
  }
  return mintProgram({
    id: `presentation.${beatId}.persistent-translation`,
    beatId,
    scheduler: "shared-canonical-beat" as const,
    opacityPolicy: "opaque" as const,
    kind: "persistent-translation" as const,
    entityIds: Object.freeze([...entityIds]) as
      readonly [string, ...string[]],
    identityPolicy: "same-entity-continuous" as const
  });
}

function nativeSettlementProgram(
  beat: KpPlaceValueAdditionBeat,
  positionPrograms: readonly KpPlaceValuePositionProgram[]
): ProgramOf<"native-settlement"> {
  const settledOutputIds = positionPrograms.flatMap((program) =>
    program.exchange?.outputCellIds[0] ??
      program.terminalOutput?.outputs
        .filter(({ role }) => role === "settled-digit")
        .map(({ targetCellId }) => targetCellId) ?? []
  );
  if (
    beat.operation !== "settle-native-result" ||
    beat.contributorIds.length < 1 ||
    beat.outputIds.length !== 1 ||
    !sameIdSet(beat.contributorIds, settledOutputIds)
  ) {
    throw new Error("Native settlement must close exact result decomposition.");
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

function resolveExchangeContext(
  trace: KpPlaceValueAdditionTrace,
  beat: KpPlaceValueAdditionBeat,
  positionPrograms: readonly KpPlaceValuePositionProgram[]
): {
  readonly program: KpPlaceValuePositionProgram & {
    readonly exchange: NonNullable<KpPlaceValuePositionProgram["exchange"]>;
  };
  readonly lineage: KpCarryRemainderLineage;
} {
  const candidate = positionPrograms.find(
    ({ exchange }) => exchange?.beatId === beat.id
  );
  const lineages: KpCarryRemainderLineage[] = [];
  for (const proof of Object.values(trace.proofs)) {
    if (isKpCarryRemainderLineage(proof)) lineages.push(proof);
  }
  const lineage = candidate?.exchange === undefined
    ? undefined
    : lineages.find(({ exchange }) =>
        exchange.id === candidate.exchange!.baseTenExchangeId
      );
  if (
    candidate?.exchange === undefined ||
    lineage === undefined ||
    !beat.proofIds.includes(lineage.id) ||
    !beat.proofIds.includes(lineage.exchange.id) ||
    !sameIds(beat.outputIds, candidate.exchange.outputCellIds)
  ) {
    throw new Error(`Exchange beat ${beat.id} lacks exact position proof.`);
  }
  return Object.freeze({
    program: candidate as KpPlaceValuePositionProgram & {
      readonly exchange: NonNullable<KpPlaceValuePositionProgram["exchange"]>;
    },
    lineage
  });
}

function mintProgram<const Program extends object>(
  program: Program
): Program & KpPlaceValuePresentationProgramBase {
  const sealed = Object.freeze(program);
  sealedPresentationPrograms.add(sealed);
  return sealed as Program & KpPlaceValuePresentationProgramBase;
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}

function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((id) => right.includes(id));
}

function assertNever(value: never): never {
  throw new Error(`Unsupported trace operation ${String(value)}.`);
}
