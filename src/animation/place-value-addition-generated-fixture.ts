import {
  createKpGeneratedPlaceValueAdditionPresentationPlan,
  type KpPlaceValueAdditionPresentationPlan
} from "./place-value-addition-presentation-plan.ts";
import {
  compileKpPlaceValuePersistentWorkspacePlan,
  type KpPlaceValuePersistentWorkspacePlan
} from "./place-value-addition-persistent-workspace.ts";
import {
  compileKpPlaceValuePositionProgramSequence,
  type KpPlaceValuePositionProgramSpec
} from "../reader/compiler/place-value-addition-position-program.ts";
import {
  compileKpPlaceValueTerminalOutputPolicy
} from "../reader/compiler/place-value-addition-terminal-output.ts";
import type {
  KpExactRadixPosition,
  KpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-types.ts";
import {
  compileKpPlaceValueWrittenColumnProjectionSpec,
  type KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";

declare const kpGeneratedPlaceValueFixtureBrand: unique symbol;
declare const kpGeneratedPlaceValueTraceBrand: unique symbol;

const sealedFixtures = new WeakSet<object>();
const sealedTraces = new WeakSet<object>();

export interface KpGeneratedPlaceValueAdditionTraceBeat {
  readonly id: string;
  readonly operation:
    | "establish"
    | "evaluate-position"
    | "exchange-adjacent-position"
    | "settle-result";
  readonly positionId?: string | undefined;
  readonly dependencyBeatIds: readonly string[];
  readonly contributorIds: readonly string[];
  readonly outputIds: readonly string[];
}

export interface KpGeneratedPlaceValueAdditionTrace {
  readonly schemaVersion: "kp.generated-place-value-addition-trace.v1";
  readonly id: string;
  readonly expression: string;
  readonly direction: "ascending-radix-position-sequence";
  readonly positionIds: readonly string[];
  readonly beats: readonly KpGeneratedPlaceValueAdditionTraceBeat[];
  readonly verification: {
    readonly exactSum: true;
    readonly exactCausalOrder: true;
    readonly outputSequenceClosed: true;
  };
  readonly [kpGeneratedPlaceValueTraceBrand]: true;
}

export interface KpGeneratedPlaceValueAdditionFixture {
  readonly schemaVersion: "kp.generated-place-value-addition-fixture.v1";
  readonly id: string;
  readonly animationId: string;
  readonly traceId: string;
  readonly expression: string;
  readonly addends: readonly [string, string];
  readonly exactResult: bigint;
  readonly trace: KpGeneratedPlaceValueAdditionTrace;
  readonly positions: readonly KpExactRadixPosition[];
  readonly positionPrograms: readonly KpPlaceValuePositionProgram[];
  readonly beatIds: readonly string[];
  readonly projection: KpPlaceValueWrittenColumnProjection;
  readonly presentation: KpPlaceValueAdditionPresentationPlan;
  readonly workspace: KpPlaceValuePersistentWorkspacePlan;
  readonly verification: {
    readonly exactSum: true;
    readonly unequalWidth: boolean;
    readonly terminalResultExtension: boolean;
    readonly orderedRadixSequence: true;
  };
  readonly [kpGeneratedPlaceValueFixtureBrand]: true;
}

/**
 * This bounded generator proves that the production motion pipeline is driven
 * by ordered radix positions rather than a three-column fixture. It currently
 * accepts integer strings whose visited positions all have at least two
 * material contributors. A later direct-settlement operation must cover
 * single-contributor positions before arbitrary sparse inputs are certified.
 */
export function compileKpPlaceValueIntegerAdditionFixture(input: {
  readonly id: string;
  readonly addends: readonly [string, string];
}): KpGeneratedPlaceValueAdditionFixture {
  const [leftText, rightText] = input.addends;
  if (
    input.id.trim().length === 0 ||
    !canonicalInteger(leftText) ||
    !canonicalInteger(rightText)
  ) {
    throw new Error(
      "Generated place-value addition requires an ID and canonical nonnegative integer strings."
    );
  }
  const leftValue = BigInt(leftText);
  const rightValue = BigInt(rightText);
  const exactResult = leftValue + rightValue;
  const resultText = String(exactResult);
  const sourceWidth = Math.max(leftText.length, rightText.length);
  const terminalResultExtension = resultText.length > sourceWidth;
  if (resultText.length > sourceWidth + 1) {
    throw new Error("One addition step may extend the result by one position.");
  }

  const animationId = `animation.place-value-addition.${input.id}`;
  const traceId = `trace.place-value-addition.${input.id}`;
  const positionCount = sourceWidth;
  const resultPositionCount = resultText.length;
  const positions = Object.freeze(Array.from(
    { length: resultPositionCount },
    (_, sequenceIndex) => Object.freeze({
      id: `radix-position-${sequenceIndex}`,
      sequenceIndex,
      radix: 10,
      exponent: sequenceIndex,
      columnId: `radix-column-${sequenceIndex}`
    })
  ));
  const operationPositions = positions.slice(0, positionCount);
  const leftDigits = [...leftText].reverse().map(Number);
  const rightDigits = [...rightText].reverse().map(Number);
  const resultDigits = [...resultText].reverse().map(Number);
  const digitId = (addendIndex: number, sequenceIndex: number) =>
    `digit.addend-${addendIndex}.radix-position-${sequenceIndex}`;
  const resultId = (sequenceIndex: number) =>
    `result.radix-position-${sequenceIndex}`;
  const carryId = (sequenceIndex: number) =>
    `carry.radix-position-${sequenceIndex}`;
  const evaluationId = (sequenceIndex: number) =>
    `evaluation.radix-position-${sequenceIndex}.total`;

  let incomingCarry = 0;
  const specs: KpPlaceValuePositionProgramSpec[] = [];
  const beatIds: string[] = [`beat.${input.id}.establish`];
  const carrySlots: {
    id: string;
    row: string;
    column: string;
    latex: string;
  }[] = [];
  for (const position of operationPositions) {
    const index = position.sequenceIndex;
    const sourceDigits = [leftDigits[index], rightDigits[index]]
      .filter((value): value is number => value !== undefined);
    const contributors = [
      ...(incomingCarry > 0 ? [carryId(index)] : []),
      ...(leftDigits[index] === undefined ? [] : [digitId(0, index)]),
      ...(rightDigits[index] === undefined ? [] : [digitId(1, index)])
    ];
    if (contributors.length < 2) {
      throw new Error(
        `Radix position ${index} requires direct-settlement support before this fixture can animate.`
      );
    }
    const total = sourceDigits.reduce((sum, digit) => sum + digit, incomingCarry);
    const remainder = total % 10;
    const overflow = Math.floor(total / 10);
    const terminal = index === positionCount - 1;
    const evaluationBeatId = `beat.${input.id}.evaluate.${position.id}`;
    const exchangeBeatId = `beat.${input.id}.exchange.${position.id}`;
    const nextPosition = positions[index + 1];
    const evaluationDigits = overflow === 0
      ? [{
          semanticEntityId: resultId(index),
          columnId: position.columnId,
          latex: String(remainder)
        }]
      : [
          {
            semanticEntityId: `${evaluationId(index)}.part.next`,
            columnId: nextPosition!.columnId,
            latex: String(overflow)
          },
          {
            semanticEntityId: `${evaluationId(index)}.part.current`,
            columnId: position.columnId,
            latex: String(remainder)
          }
        ];
    const evaluation = {
      schemaVersion: "kp.place-value-position-evaluation.v1",
      beatId: evaluationBeatId,
      expression: `${[
        ...(incomingCarry > 0 ? [incomingCarry] : []),
        ...sourceDigits
      ].join(" + ")} = ${total}`,
      contributorCellIds: contributors,
      ...(incomingCarry > 0
        ? { incomingCarryCellId: carryId(index) }
        : {}),
      evaluationDigits,
      evaluatedTotalEntityId: evaluationId(index),
      stageDataset: `kpPlaceValueGeneratedPosition${index}Evaluation`
    };
    beatIds.push(evaluationBeatId);
    if (!terminal) {
      if (overflow !== 1 || nextPosition === undefined) {
        throw new Error(
          `Radix position ${index} requires direct-settlement support before this fixture can animate.`
        );
      }
      const nextCarryId = carryId(index + 1);
      carrySlots.push({
        id: nextCarryId,
        row: "carry",
        column: nextPosition.columnId,
        latex: "1"
      });
      specs.push({
        position,
        evaluation,
        exchange: {
          schemaVersion: "kp.place-value-position-exchange.v1",
          beatId: exchangeBeatId,
          baseTenExchangeId:
            `exchange.${position.id}-to-${nextPosition.id}`,
          outputCellIds: [resultId(index), nextCarryId],
          outputDigits: [evaluationDigits[1]!, evaluationDigits[0]!],
          stageDataset: `kpPlaceValueGeneratedPosition${index}Exchange`
        }
      });
      beatIds.push(exchangeBeatId);
      incomingCarry = overflow;
      continue;
    }
    if (overflow === 0) {
      specs.push({
        position,
        evaluation,
        terminalOutput: compileKpPlaceValueTerminalOutputPolicy({
          mode: "settle-in-terminal-position",
          terminalPosition: position,
          evaluatedTotal: BigInt(total),
          result: {
            targetCellId: resultId(index),
            materialEntityId: resultId(index)
          }
        })
      });
    } else {
      if (overflow !== 1 || nextPosition === undefined) {
        throw new Error("Terminal overflow requires one adjacent result position.");
      }
      specs.push({
        position,
        evaluation,
        terminalOutput: compileKpPlaceValueTerminalOutputPolicy({
          mode: "extend-result-sequence",
          terminalPosition: position,
          extensionPosition: nextPosition,
          evaluatedTotal: BigInt(total),
          remainder: {
            targetCellId: resultId(index),
            materialEntityId: evaluationDigits[1]!.semanticEntityId
          },
          overflow: {
            targetCellId: resultId(index + 1),
            materialEntityId: evaluationDigits[0]!.semanticEntityId
          }
        })
      });
    }
    incomingCarry = overflow;
  }
  beatIds.push(`beat.${input.id}.settle`);
  const positionPrograms = compileKpPlaceValuePositionProgramSequence({
    specs,
    allowedBeatIds: beatIds
  });
  const rows = Object.freeze([
    "carry",
    "addend-0",
    "addend-1",
    "underline",
    "result"
  ]);
  const columns = Object.freeze([
    "operator",
    ...positions.map(({ columnId }) => columnId).reverse()
  ]);
  const initialCells = [
    ...leftDigits.map((digit, sequenceIndex) => ({
      id: digitId(0, sequenceIndex),
      row: "addend-0",
      column: positions[sequenceIndex]!.columnId,
      latex: String(digit)
    })),
    {
      id: "operator.add",
      row: "addend-1",
      column: "operator",
      latex: "+"
    },
    ...rightDigits.map((digit, sequenceIndex) => ({
      id: digitId(1, sequenceIndex),
      row: "addend-1",
      column: positions[sequenceIndex]!.columnId,
      latex: String(digit)
    }))
  ];
  const resultSlots = resultDigits.map((digit, sequenceIndex) => ({
    id: resultId(sequenceIndex),
    row: "result",
    column: positions[sequenceIndex]!.columnId,
    latex: String(digit)
  }));
  const expression = `${leftText} + ${rightText} = ${resultText}`;
  const projection = compileKpPlaceValueWrittenColumnProjectionSpec({
    animationId,
    traceId,
    rows,
    columns,
    initialCells,
    carrySlots,
    resultSlots,
    underline: {
      id: "rule.addition.underline",
      row: "underline",
      fromColumn: "operator",
      throughColumn: positions[0]!.columnId
    },
    accessibility: {
      expression,
      readingOrder: ["addend-0", "operator", "addend-1", "result"]
    }
  });
  const trace = compileGeneratedTrace({
    traceId,
    expression,
    positionPrograms,
    initialCellIds: initialCells.map(({ id }) => id),
    resultCellIds: resultSlots.map(({ id }) => id),
    establishBeatId: beatIds[0]!,
    settleBeatId: beatIds.at(-1)!
  });
  const presentation = createKpGeneratedPlaceValueAdditionPresentationPlan({
    traceId: trace.id,
    positionPrograms
  });
  const workspace = compileKpPlaceValuePersistentWorkspacePlan({
    projection,
    positionPrograms,
    beatIds
  });
  const fixture = Object.freeze({
    schemaVersion: "kp.generated-place-value-addition-fixture.v1" as const,
    id: input.id,
    animationId,
    traceId,
    expression,
    addends: Object.freeze([leftText, rightText] as const),
    exactResult,
    trace,
    positions,
    positionPrograms,
    beatIds: Object.freeze(beatIds),
    projection,
    presentation,
    workspace,
    verification: Object.freeze({
      exactSum: true as const,
      unequalWidth: leftText.length !== rightText.length,
      terminalResultExtension,
      orderedRadixSequence: true as const
    })
  });
  sealedFixtures.add(fixture);
  return fixture as unknown as KpGeneratedPlaceValueAdditionFixture;
}

export function isKpGeneratedPlaceValueAdditionFixture(
  value: unknown
): value is KpGeneratedPlaceValueAdditionFixture {
  return typeof value === "object" && value !== null && sealedFixtures.has(value);
}

export function isKpGeneratedPlaceValueAdditionTrace(
  value: unknown
): value is KpGeneratedPlaceValueAdditionTrace {
  return typeof value === "object" && value !== null && sealedTraces.has(value);
}

function compileGeneratedTrace(input: {
  readonly traceId: string;
  readonly expression: string;
  readonly positionPrograms: readonly KpPlaceValuePositionProgram[];
  readonly initialCellIds: readonly string[];
  readonly resultCellIds: readonly string[];
  readonly establishBeatId: string;
  readonly settleBeatId: string;
}): KpGeneratedPlaceValueAdditionTrace {
  const beats: KpGeneratedPlaceValueAdditionTraceBeat[] = [];
  let dependencyBeatId = input.establishBeatId;
  beats.push(Object.freeze({
    id: input.establishBeatId,
    operation: "establish" as const,
    dependencyBeatIds: Object.freeze([]),
    contributorIds: Object.freeze([...input.initialCellIds]),
    outputIds: Object.freeze([...input.initialCellIds])
  }));
  for (const program of input.positionPrograms) {
    const evaluationOutputs = program.exchange === undefined
      ? program.terminalOutput!.outputs.map(({ targetCellId }) => targetCellId)
      : [program.evaluation.evaluatedTotalEntityId];
    beats.push(Object.freeze({
      id: program.evaluation.beatId,
      operation: "evaluate-position" as const,
      positionId: program.position.id,
      dependencyBeatIds: Object.freeze([dependencyBeatId]),
      contributorIds: Object.freeze([
        ...program.evaluation.contributorCellIds
      ]),
      outputIds: Object.freeze(evaluationOutputs)
    }));
    dependencyBeatId = program.evaluation.beatId;
    if (program.exchange !== undefined) {
      beats.push(Object.freeze({
        id: program.exchange.beatId,
        operation: "exchange-adjacent-position" as const,
        positionId: program.position.id,
        dependencyBeatIds: Object.freeze([dependencyBeatId]),
        contributorIds: Object.freeze([
          program.evaluation.evaluatedTotalEntityId
        ]),
        outputIds: Object.freeze([...program.exchange.outputCellIds])
      }));
      dependencyBeatId = program.exchange.beatId;
    }
  }
  beats.push(Object.freeze({
    id: input.settleBeatId,
    operation: "settle-result" as const,
    dependencyBeatIds: Object.freeze([dependencyBeatId]),
    contributorIds: Object.freeze([...input.resultCellIds]),
    outputIds: Object.freeze(["result"])
  }));
  const trace = Object.freeze({
    schemaVersion: "kp.generated-place-value-addition-trace.v1" as const,
    id: input.traceId,
    expression: input.expression,
    direction: "ascending-radix-position-sequence" as const,
    positionIds: Object.freeze(input.positionPrograms.map(
      ({ position }) => position.id
    )),
    beats: Object.freeze(beats),
    verification: Object.freeze({
      exactSum: true as const,
      exactCausalOrder: true as const,
      outputSequenceClosed: true as const
    })
  });
  sealedTraces.add(trace);
  return trace as unknown as KpGeneratedPlaceValueAdditionTrace;
}

function canonicalInteger(value: string): boolean {
  return /^(?:0|[1-9][0-9]*)$/u.test(value);
}
