import {
  kpPlaceValueAdditionVisualReference as reference
} from "./place-value-addition-visual-reference.ts";
import {
  compileKpPlaceValueTerminalOutputPolicy
} from "./place-value-addition-terminal-output.ts";
import type {
  KpPlaceValuePositionProgram
} from "./place-value-addition-position-types.ts";

export type {
  KpExactRadixPosition,
  KpPlaceValueEvaluationDigitSpec,
  KpPlaceValuePositionEvaluationSpec,
  KpPlaceValuePositionExchangeSpec,
  KpPlaceValuePositionProgram
} from "./place-value-addition-position-types.ts";

const sealedPrograms = new WeakSet<object>();

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

  const programs = fixture.map((entry) => {
    const position = Object.freeze({ ...entry.position });
    return Object.freeze({
      position,
      evaluation: Object.freeze({
        ...entry.evaluation,
        contributorCellIds:
          Object.freeze([...entry.evaluation.contributorCellIds]),
        evaluationDigits: Object.freeze(entry.evaluation.evaluationDigits.map(
          (digit) => Object.freeze({ ...digit })
        ))
      }),
      ...("exchange" in entry
        ? {
            exchange: Object.freeze({
              ...entry.exchange,
              outputCellIds: Object.freeze([...entry.exchange.outputCellIds]),
              outputDigits: Object.freeze(entry.exchange.outputDigits.map(
                (digit) => Object.freeze({ ...digit })
              ))
            })
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
    });
  });

  assertPositionSequence(
    programs as unknown as readonly KpPlaceValuePositionProgram[]
  );
  for (const program of programs) sealedPrograms.add(program);
  return Object.freeze(programs) as unknown as
    readonly KpPlaceValuePositionProgram[];
}

export function isKpPlaceValuePositionProgram(
  value: unknown
): value is KpPlaceValuePositionProgram {
  return typeof value === "object" &&
    value !== null &&
    sealedPrograms.has(value);
}

function assertPositionSequence(
  programs: readonly KpPlaceValuePositionProgram[]
): void {
  const referenceBeatIds = new Set<string>(
    reference.beats.map(({ id }) => id)
  );
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
