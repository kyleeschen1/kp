import {
  kpPlaceValueAdditionVisualReference as reference
} from "./place-value-addition-visual-reference.ts";
import {
  compileKpPlaceValueTerminalOutputPolicy
} from "./place-value-addition-terminal-output.ts";
import type {
  KpExactRadixPosition,
  KpPlaceValuePositionEvaluationSpec,
  KpPlaceValuePositionExchangeSpec,
  KpPlaceValuePositionProgram,
  KpPlaceValueTerminalOutputPolicy
} from "./place-value-addition-position-types.ts";

export type {
  KpExactRadixPosition,
  KpPlaceValueEvaluationDigitSpec,
  KpPlaceValuePositionEvaluationSpec,
  KpPlaceValuePositionExchangeSpec,
  KpPlaceValuePositionProgram
} from "./place-value-addition-position-types.ts";

const sealedPrograms = new WeakSet<object>();

export interface KpPlaceValuePositionProgramSpec {
  readonly position: KpExactRadixPosition;
  readonly evaluation: KpPlaceValuePositionEvaluationSpec;
  readonly exchange?: KpPlaceValuePositionExchangeSpec | undefined;
  readonly terminalOutput?: KpPlaceValueTerminalOutputPolicy | undefined;
}

/**
 * This fixture adapter is the only layer allowed to know familiar decimal
 * place labels. Reusable compilers consume ordered radix positions so adding
 * unequal widths, zero-filled gaps, or negative exponents cannot require a
 * new renderer branch for a named column.
 */
export function compileKpPlaceValueAdditionPositionPrograms():
readonly KpPlaceValuePositionProgram[] {
  const fixture = [
    {
      position: {
        id: "decimal-position-0",
        sequenceIndex: 0,
        radix: 10,
        exponent: 0,
        columnId: "ones"
      },
      evaluation: {
        schemaVersion: "kp.place-value-addition-ones-evaluation.v1",
        beatId: "beat.place-value.evaluate-ones",
        expression: "8 + 6 = 14",
        contributorCellIds: [
          "digit.first.ones",
          "digit.second.ones"
        ],
        evaluationDigits: [
          {
            semanticEntityId: "evaluation.ones.total.tens",
            columnId: "tens",
            latex: "1"
          },
          {
            semanticEntityId: "evaluation.ones.total.ones",
            columnId: "ones",
            latex: "4"
          }
        ],
        evaluatedTotalEntityId: "evaluation.ones.total",
        stageDataset: "kpPlaceValueOnesEvaluation"
      },
      exchange: {
        schemaVersion: "kp.place-value-addition-ones-exchange.v1",
        beatId: "beat.place-value.exchange-ones",
        baseTenExchangeId: "exchange.ones-to-tens",
        outputCellIds: ["result.ones", "carry.tens"],
        outputDigits: [
          {
            semanticEntityId: "evaluation.ones.total.part.tens",
            columnId: "tens",
            latex: "1"
          },
          {
            semanticEntityId: "evaluation.ones.total.part.ones",
            columnId: "ones",
            latex: "4"
          }
        ],
        stageDataset: "kpPlaceValueOnesExchange"
      }
    },
    {
      position: {
        id: "decimal-position-1",
        sequenceIndex: 1,
        radix: 10,
        exponent: 1,
        columnId: "tens"
      },
      evaluation: {
        schemaVersion: "kp.place-value-addition-tens-evaluation.v1",
        beatId: "beat.place-value.evaluate-tens",
        expression: "1 + 7 + 5 = 13",
        contributorCellIds: [
          "carry.tens",
          "digit.first.tens",
          "digit.second.tens"
        ],
        incomingCarryCellId: "carry.tens",
        evaluationDigits: [
          {
            semanticEntityId: "evaluation.tens.total.hundreds",
            columnId: "hundreds",
            latex: "1"
          },
          {
            semanticEntityId: "evaluation.tens.total.tens",
            columnId: "tens",
            latex: "3"
          }
        ],
        evaluatedTotalEntityId: "evaluation.tens.total",
        stageDataset: "kpPlaceValueTensEvaluation"
      },
      exchange: {
        schemaVersion: "kp.place-value-addition-tens-exchange.v1",
        beatId: "beat.place-value.exchange-tens",
        baseTenExchangeId: "exchange.tens-to-hundreds",
        outputCellIds: ["result.tens", "carry.hundreds"],
        outputDigits: [
          {
            semanticEntityId: "evaluation.tens.total.part.hundreds",
            columnId: "hundreds",
            latex: "1"
          },
          {
            semanticEntityId: "evaluation.tens.total.part.tens",
            columnId: "tens",
            latex: "3"
          }
        ],
        stageDataset: "kpPlaceValueTensExchange"
      }
    },
    {
      position: {
        id: "decimal-position-2",
        sequenceIndex: 2,
        radix: 10,
        exponent: 2,
        columnId: "hundreds"
      },
      evaluation: {
        schemaVersion: "kp.place-value-addition-hundreds-evaluation.v1",
        beatId: "beat.place-value.evaluate-hundreds",
        expression: "1 + 2 + 1 = 4",
        contributorCellIds: [
          "carry.hundreds",
          "digit.first.hundreds",
          "digit.second.hundreds"
        ],
        incomingCarryCellId: "carry.hundreds",
        evaluationDigits: [
          {
            semanticEntityId: "result.hundreds",
            columnId: "hundreds",
            latex: "4"
          }
        ],
        evaluatedTotalEntityId: "evaluation.hundreds.total",
        stageDataset: "kpPlaceValueHundredsEvaluation"
      },
      terminalOutput: {
        evaluatedTotal: 4n,
        targetCellId: "result.hundreds",
        materialEntityId: "result.hundreds"
      }
    }
  ] as const;

  const programs = compileKpPlaceValuePositionProgramSequence({
    specs: fixture.map((entry) => {
    const position = Object.freeze({ ...entry.position });
    return {
      position,
      evaluation: {
        ...entry.evaluation,
        contributorCellIds: [...entry.evaluation.contributorCellIds],
        evaluationDigits: entry.evaluation.evaluationDigits
      },
      ...("exchange" in entry
        ? {
            exchange: {
              ...entry.exchange,
              outputCellIds: [...entry.exchange.outputCellIds],
              outputDigits: entry.exchange.outputDigits
            }
          }
        : {}),
      ...("terminalOutput" in entry
        ? {
            terminalOutput: compileKpPlaceValueTerminalOutputPolicy({
              mode: "settle-in-terminal-position",
              terminalPosition: position,
              evaluatedTotal: entry.terminalOutput.evaluatedTotal,
              result: {
                targetCellId: entry.terminalOutput.targetCellId,
                materialEntityId: entry.terminalOutput.materialEntityId
              }
            })
          }
        : {})
    };
    }),
    allowedBeatIds: reference.beats.map(({ id }) => id)
  });
  return programs;
}

/**
 * Seals a complete ordered radix program sequence. Callers provide semantic
 * IDs and exact positions; the compiler rejects named-place shortcuts,
 * out-of-order adjacency, and terminal output attached to a nonterminal step.
 */
export function compileKpPlaceValuePositionProgramSequence(input: {
  readonly specs: readonly KpPlaceValuePositionProgramSpec[];
  readonly allowedBeatIds: readonly string[];
}): readonly KpPlaceValuePositionProgram[] {
  const programs = input.specs.map((spec) => Object.freeze({
    // Terminal output authority is intentionally tied to this exact position
    // object; cloning it here would break the nominal adjacency proof.
    position: Object.freeze(spec.position),
    evaluation: Object.freeze({
      ...spec.evaluation,
      contributorCellIds:
        Object.freeze([...spec.evaluation.contributorCellIds]),
      evaluationDigits: Object.freeze(spec.evaluation.evaluationDigits.map(
        (digit) => Object.freeze({ ...digit })
      ))
    }),
    ...(spec.exchange === undefined
      ? {}
      : {
          exchange: Object.freeze({
            ...spec.exchange,
            outputCellIds: Object.freeze([...spec.exchange.outputCellIds]),
            outputDigits: Object.freeze(spec.exchange.outputDigits.map(
              (digit) => Object.freeze({ ...digit })
            )) as KpPlaceValuePositionExchangeSpec["outputDigits"]
          })
        }),
    ...(spec.terminalOutput === undefined
      ? {}
      : { terminalOutput: spec.terminalOutput })
  })) as unknown as readonly KpPlaceValuePositionProgram[];
  assertPositionSequence(programs, input.allowedBeatIds);
  for (const program of programs) sealedPrograms.add(program);
  return Object.freeze(programs);
}

export function isKpPlaceValuePositionProgram(
  value: unknown
): value is KpPlaceValuePositionProgram {
  return typeof value === "object" &&
    value !== null &&
    sealedPrograms.has(value);
}

function assertPositionSequence(
  programs: readonly KpPlaceValuePositionProgram[],
  allowedBeatIds: readonly string[]
): void {
  const referenceBeatIds = new Set<string>(allowedBeatIds);
  const positionIds = new Set<string>();
  const beatIds = new Set<string>();
  if (programs.length === 0) {
    throw new Error("Place-value position programs cannot be empty.");
  }
  for (const [index, program] of programs.entries()) {
    const isTerminal = index === programs.length - 1;
    if (
      program.position.sequenceIndex !== index ||
      !Number.isSafeInteger(program.position.radix) ||
      program.position.radix < 2 ||
      !Number.isSafeInteger(program.position.exponent) ||
      program.evaluation.contributorCellIds.length < 2 ||
      program.evaluation.evaluationDigits.length === 0 ||
      positionIds.has(program.position.id) ||
      beatIds.has(program.evaluation.beatId) ||
      !referenceBeatIds.has(program.evaluation.beatId) ||
      (
        program.exchange !== undefined &&
        (
          beatIds.has(program.exchange.beatId) ||
          !referenceBeatIds.has(program.exchange.beatId)
        )
      ) ||
      (isTerminal !== (program.terminalOutput !== undefined)) ||
      (index > 0 && (
        program.position.radix !== programs[index - 1]!.position.radix ||
        program.position.exponent !==
          programs[index - 1]!.position.exponent + 1 ||
        program.evaluation.incomingCarryCellId !==
          programs[index - 1]!.exchange?.outputCellIds[1] ||
        program.evaluation.contributorCellIds[0] !==
          program.evaluation.incomingCarryCellId
      )) ||
      (index === 0 &&
        program.evaluation.incomingCarryCellId !== undefined) ||
      (
        program.terminalOutput !== undefined &&
        (
          program.exchange !== undefined ||
          program.terminalOutput.terminalPosition !== program.position ||
          program.terminalOutput.outputs.some((output) =>
            output.position.radix !== program.position.radix ||
            (
              output.position.sequenceIndex !==
                program.position.sequenceIndex &&
              output.position.sequenceIndex !==
                program.position.sequenceIndex + 1
            )
          )
        )
      )
    ) {
      throw new Error(
        "Place-value position programs must form one exact ordered radix sequence."
      );
    }
    positionIds.add(program.position.id);
    beatIds.add(program.evaluation.beatId);
    if (program.exchange !== undefined) beatIds.add(program.exchange.beatId);
  }
}
