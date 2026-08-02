export interface KpProgrammingAdditionSourceRangeContract {
  readonly selectorId: string;
  readonly start: readonly [line: number, column: number];
  readonly end: readonly [line: number, column: number];
  readonly exactText: string;
  readonly textHash: string;
}

export interface KpProgrammingAdditionStepContract {
  readonly stepId: string;
  readonly kind: "call" | "evaluate" | "return" | "output";
  readonly progress: number;
  readonly activeSelectorIds: readonly string[];
  readonly stackFrameIds: readonly string[];
  readonly localNames: readonly string[];
  readonly output: readonly string[];
}

export interface KpProgrammingAdditionExemplarContractV1 {
  readonly schemaVersion: "kp.programming-addition-exemplar.v1";
  readonly kind: "native-hostability-exemplar";
  readonly animationId: "animation.programming.add.execution-trace";
  readonly sourceFixtureId: "fixture.programming.add.execution-trace";
  readonly source: {
    readonly sourceFileId: "source-file.programming.add";
    readonly language: "typescript";
    readonly revisionId: "rev-1";
    readonly path: "src/add.ts";
    readonly sourceRanges: readonly KpProgrammingAdditionSourceRangeContract[];
  };
  readonly trace: {
    readonly traceId: "trace.programming.add";
    readonly sharedClockId: "clock.programming.add-demo";
    readonly steps: readonly KpProgrammingAdditionStepContract[];
  };
  readonly host: {
    readonly slotKind: "programming";
    readonly adapterId: "editor-animation-surface.programming.trace";
    readonly coveredAnimationIds: readonly [
      "animation.programming.add.execution-trace",
      "animation.comparison.linear-solve-programming"
    ];
    readonly meaningfulPaintEvidence: readonly string[];
  };
  readonly frameChannelIds: readonly string[];
  readonly authority: {
    readonly semanticState: "precomputed-verified-trace";
    readonly playback: "shared-editor-player-clock";
    readonly paint: "one-native-programming-adapter";
    readonly prohibited: readonly string[];
  };
  readonly promotionBoundary: {
    readonly advancesStableFrontier: false;
    readonly deferredPromotionId: "kp.promotion.programming-algorithms";
    readonly deferredRank: 23;
    readonly deferredExemplar: "BFS across code, queue, and graph";
  };
}

/**
 * The contract freezes an already-verified trace, not a JavaScript runtime.
 * Renderers consume these identities and values; they may not execute source
 * text or infer state that the trace does not contain.
 */
export const kpProgrammingAdditionExemplarContract = Object.freeze({
  schemaVersion: "kp.programming-addition-exemplar.v1",
  kind: "native-hostability-exemplar",
  animationId: "animation.programming.add.execution-trace",
  sourceFixtureId: "fixture.programming.add.execution-trace",
  source: Object.freeze({
    sourceFileId: "source-file.programming.add",
    language: "typescript",
    revisionId: "rev-1",
    path: "src/add.ts",
    sourceRanges: Object.freeze([
      Object.freeze({
        selectorId: "selector.programming.add.signature",
        start: Object.freeze([1, 1] as const),
        end: Object.freeze([1, 44] as const),
        exactText: "export function add(a: number, b: number) {",
        textHash: "fnv1a-5327b31f"
      }),
      Object.freeze({
        selectorId: "selector.programming.add.return",
        start: Object.freeze([2, 3] as const),
        end: Object.freeze([2, 16] as const),
        exactText: "return a + b;",
        textHash: "fnv1a-acab0c94"
      })
    ])
  }),
  trace: Object.freeze({
    traceId: "trace.programming.add",
    sharedClockId: "clock.programming.add-demo",
    steps: Object.freeze([
      step(
        "step.programming.add.call",
        "call",
        0,
        ["selector.programming.add.signature"],
        ["frame.programming.add"],
        ["a", "b"],
        []
      ),
      step(
        "step.programming.add.evaluate-return",
        "evaluate",
        1 / 3,
        ["selector.programming.add.return"],
        ["frame.programming.add"],
        ["a", "b"],
        []
      ),
      step(
        "step.programming.add.return",
        "return",
        2 / 3,
        ["selector.programming.add.return"],
        ["frame.programming.add"],
        ["a", "b", "return"],
        []
      ),
      step(
        "step.programming.add.output",
        "output",
        1,
        [],
        [],
        [],
        ["4"]
      )
    ])
  }),
  host: Object.freeze({
    slotKind: "programming",
    adapterId: "editor-animation-surface.programming.trace",
    coveredAnimationIds: Object.freeze([
      "animation.programming.add.execution-trace",
      "animation.comparison.linear-solve-programming"
    ] as const),
    meaningfulPaintEvidence: Object.freeze([
      "the exact source text is visibly present",
      "the active source range changes with the current verified step",
      "stack and local bindings reflect only the current trace frame",
      "the final output becomes visibly and accessibly 4"
    ])
  }),
  frameChannelIds: Object.freeze([
    "source-focus",
    "call-stack",
    "locals",
    "output",
    "control-state",
    "accessible-description"
  ]),
  authority: Object.freeze({
    semanticState: "precomputed-verified-trace",
    playback: "shared-editor-player-clock",
    paint: "one-native-programming-adapter",
    prohibited: Object.freeze([
      "arbitrary-code-execution",
      "live-language-runtime",
      "renderer-inferred-runtime-state",
      "eager-code-highlighting-dependency"
    ])
  }),
  promotionBoundary: Object.freeze({
    advancesStableFrontier: false,
    deferredPromotionId: "kp.promotion.programming-algorithms",
    deferredRank: 23,
    deferredExemplar: "BFS across code, queue, and graph"
  })
} as const satisfies KpProgrammingAdditionExemplarContractV1);

function step(
  stepId: string,
  kind: KpProgrammingAdditionStepContract["kind"],
  progress: number,
  activeSelectorIds: readonly string[],
  stackFrameIds: readonly string[],
  localNames: readonly string[],
  output: readonly string[]
): KpProgrammingAdditionStepContract {
  return Object.freeze({
    stepId,
    kind,
    progress,
    activeSelectorIds: Object.freeze([...activeSelectorIds]),
    stackFrameIds: Object.freeze([...stackFrameIds]),
    localNames: Object.freeze([...localNames]),
    output: Object.freeze([...output])
  });
}
