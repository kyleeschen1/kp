export interface EquationAnimationConformanceBaseline {
  readonly descriptorId: string;
  readonly animationId: string;
  readonly transformType: string;
  readonly definitionId: string;
  readonly observedMotif: string;
  readonly requiredMotif: string;
  readonly checkpoints: readonly {
    readonly direction: "forward" | "rewind";
    readonly progress: number;
  }[];
  readonly gaps: readonly string[];
}

// These observations intentionally pin known deficiencies. Later choreography
// slices must remove a gap only when executable conformance evidence replaces it.
export const equationAnimationConformanceBaselines:
  readonly EquationAnimationConformanceBaseline[] = [
    {
      descriptorId: "editor-animation.sample.animation.function-wrap.apply-f",
      animationId: "animation.generated.function-wrap.apply-f",
      transformType: "wrapFunction",
      definitionId: "definition.generated.function-wrap.wrap-function",
      observedMotif: "wrap",
      requiredMotif: "wrap",
      checkpoints: [
        { direction: "forward", progress: 0 },
        { direction: "forward", progress: 0.5 },
        { direction: "forward", progress: 1 },
        { direction: "rewind", progress: 0.5 }
      ],
      gaps: []
    },
    {
      descriptorId: "editor-animation.sample.animation.distribution.expand-a-sum",
      animationId: "animation.generated.distribution.expand-a-sum",
      transformType: "distributeMultiplication",
      definitionId: "definition.generated.distribution.distribute-multiplication",
      observedMotif: "artifact-replace",
      requiredMotif: "copy-fan-out",
      checkpoints: [
        { direction: "forward", progress: 0 },
        { direction: "forward", progress: 0.5 },
        { direction: "forward", progress: 1 },
        { direction: "rewind", progress: 0.5 }
      ],
      gaps: [
        "fan-out semantics select generic artifact replacement",
        "two destinations share one union-bounds delta",
        "copies remain invisible at the semantic midpoint",
        "copy transit has no independently inspectable paths"
      ]
    }
  ];

export function equationAnimationConformanceBaseline(
  animationId: string
): EquationAnimationConformanceBaseline {
  const baseline = equationAnimationConformanceBaselines.find(
    (candidate) => candidate.animationId === animationId
  );
  if (baseline === undefined) {
    throw new Error(`Missing equation animation conformance baseline ${animationId}.`);
  }
  return baseline;
}
