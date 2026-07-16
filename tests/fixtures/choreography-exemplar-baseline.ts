export const choreographyEnvelopePhaseIds = [
  "orient",
  "reflow",
  "act",
  "settle",
  "release"
] as const;

export type ChoreographyEnvelopePhaseId =
  (typeof choreographyEnvelopePhaseIds)[number];

export type ExemplarObservationStatus =
  | "observed"
  | "partial"
  | "implicit"
  | "missing";

export interface ChoreographyExemplarPhaseObservation {
  readonly phaseId: ChoreographyEnvelopePhaseId;
  readonly status: ExemplarObservationStatus;
  readonly evidence: readonly string[];
  readonly contract: string;
}

export interface ChoreographyExemplarContinuant {
  readonly id: string;
  readonly meaning: string;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly relation: "identity" | "role-change" | "representational-lineage";
}

export interface ChoreographyExemplarAppearance {
  readonly targetSelectorIds: readonly string[];
  readonly cause: string;
}

export interface ChoreographyExemplarCheckpoint {
  readonly id:
    | "start"
    | "focus-peak"
    | "reflow-complete"
    | "act-midpoint"
    | "settled"
    | "released"
    | "rewind";
  readonly progress: number;
  readonly status: ExemplarObservationStatus;
  readonly evidence: string;
}

export interface ChoreographyExemplarBaseline {
  readonly id: string;
  readonly label: string;
  readonly animationIds: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly continuants: readonly ChoreographyExemplarContinuant[];
  readonly appearances: readonly ChoreographyExemplarAppearance[];
  readonly phases: readonly ChoreographyExemplarPhaseObservation[];
  readonly checkpoints: readonly ChoreographyExemplarCheckpoint[];
  readonly geometry: readonly string[];
  readonly propagation: readonly string[];
  readonly rewind: readonly string[];
  readonly knownGaps: readonly string[];
}

export const choreographyExemplarBaselines:
  readonly ChoreographyExemplarBaseline[] = [
    {
      id: "exemplar.function-wrap.dashboard-v0",
      label: "Function wrap: x to f(x)",
      animationIds: [
        "fixture-wrapper-function-wrap",
        "animation.generated.function-wrap.apply-f"
      ],
      sourceRefs: [
        "src/editor/equation-animation-catalog.ts#createFunctionWrapFixtureTransition",
        "src/rendering/visual-motif.ts#wrap",
        "src/animation/function-wrap-choreography.ts#createKpFunctionWrapChoreography",
        "tests/editor-animation-visuals.browser.spec.ts#function-wrap-family"
      ],
      continuants: [
        {
          id: "continuant.function-wrap.argument-x",
          meaning: "The same x changes role from free expression to function argument.",
          sourceSelectorIds: ["wrapper.function.wrap.source.x"],
          targetSelectorIds: ["wrapper.function.wrap.target.x"],
          relation: "role-change"
        }
      ],
      appearances: [
        {
          targetSelectorIds: ["wrapper.function.wrap.target.f"],
          cause: "The wrap operation introduces the function name."
        },
        {
          targetSelectorIds: [
            "wrapper.function.wrap.target.open-paren",
            "wrapper.function.wrap.target.close-paren"
          ],
          cause: "The wrap operation introduces a delimiter pair around the argument."
        }
      ],
      phases: [
        {
          phaseId: "orient",
          status: "observed",
          evidence: [
            "The shared choreography timeline reserves normalized progress 0.00–0.14 for argument focus.",
            "The editor binds the persistent x to the layout-safe focus profile."
          ],
          contract: "Focus the causal argument x before it changes role."
        },
        {
          phaseId: "reflow",
          status: "observed",
          evidence: [
            "The shared choreography timeline reserves normalized progress 0.14–0.42 for reflow.",
            "Persistent travel completes before enclosure visibility begins at 0.42."
          ],
          contract: "Move the argument continuant into its target slot before wrapper artifacts dominate."
        },
        {
          phaseId: "act",
          status: "observed",
          evidence: [
            "Parentheses enter over 0.42–0.70.",
            "The function name enters later over 0.58–0.82.",
            "The wrapper phase is named wrap-artifact-enter."
          ],
          contract: "Introduce the delimiters and function name as consequences of wrapping."
        },
        {
          phaseId: "settle",
          status: "observed",
          evidence: [
            "The shared timeline holds settle over normalized progress 0.70–0.90.",
            "Recognition is an explicit stable checkpoint before release."
          ],
          contract: "Hold a fully recognizable f(x) checkpoint before attention releases."
        },
        {
          phaseId: "release",
          status: "observed",
          evidence: [
            "Release occupies normalized progress 0.90–1.00.",
            "Focus z, scale, shadow, outline, and context dimming return exactly to neutral."
          ],
          contract: "Remove focus only after f(x) is stable and recognizable."
        }
      ],
      checkpoints: [
        {
          id: "start",
          progress: 0,
          status: "observed",
          evidence: "The source x is native and wrapper tokens are absent."
        },
        {
          id: "focus-peak",
          progress: 0.14,
          status: "observed",
          evidence: "The argument reaches full focus before reflow begins."
        },
        {
          id: "reflow-complete",
          progress: 0.42,
          status: "observed",
          evidence: "The wrapped-token-shift phase ends before artifact entry is established."
        },
        {
          id: "act-midpoint",
          progress: 0.6,
          status: "observed",
          evidence: "Both parentheses and the function name are entering around the persistent x."
        },
        {
          id: "settled",
          progress: 0.9,
          status: "observed",
          evidence: "The recognition checkpoint holds native target geometry before release."
        },
        {
          id: "released",
          progress: 1,
          status: "observed",
          evidence: "The focus profile is exactly neutral at the release endpoint."
        },
        {
          id: "rewind",
          progress: 0.5,
          status: "observed",
          evidence: "The shared player reverses source and target while preserving semantic motion."
        }
      ],
      geometry: [
        "The x token translates independently; the whole expression is not scaled as one group.",
        "Parentheses approach from opposite horizontal sides.",
        "The function name approaches from the leading side after argument reflow begins."
      ],
      propagation: [
        "Argument reflow precedes artifact entry.",
        "Parentheses begin together; the function name follows with a later start."
      ],
      rewind: [
        "Rewind restores x as the source expression rather than cross-fading the whole structures.",
        "The same semantic continuant must remain authoritative in both directions."
      ],
      knownGaps: [
        "The legacy dashboard fixture remains a comparison exemplar rather than consuming the generated editor choreography plan directly."
      ]
    },
    {
      id: "exemplar.radical-rewrite.dashboard-v0",
      label: "Fractional exponent to radical",
      animationIds: [
        "fixture-radical-rewrite-power-as-root",
        "animation.generated.radical-rewrite.square-root-as-power"
      ],
      sourceRefs: [
        "src/editor/equation-animation-catalog.ts#createRadicalPowerAsRootFixtureTransition",
        "src/editor/equation-motion-demo-controller.ts#createRadicalArtifactSeedRevealPlan",
        "src/animation/radical-succession-choreography.ts#createKpRadicalSuccessionChoreography",
        "src/rendering/equation-representational-succession.ts#sampleKpEquationRepresentationalSuccession",
        "tests/katex-transition.browser.spec.ts#radical-artifact"
      ],
      continuants: [
        {
          id: "continuant.radical-rewrite.x",
          meaning: "The same x changes role from power base to radicand.",
          sourceSelectorIds: ["radical.rewrite-power-as-root.source.x"],
          targetSelectorIds: ["radical.rewrite-power-as-root.target.x"],
          relation: "role-change"
        },
        {
          id: "continuant.radical-rewrite.notation",
          meaning: "The fractional exponent and radical are successive representations of the same root operation.",
          sourceSelectorIds: ["radical.rewrite-power-as-root.source.exponent"],
          targetSelectorIds: ["radical.rewrite-power-as-root.target.radical"],
          relation: "representational-lineage"
        }
      ],
      appearances: [
        {
          targetSelectorIds: ["radical.rewrite-power-as-root.target.radical"],
          cause: "The root operation changes from fractional-exponent notation to radical notation."
        }
      ],
      phases: [
        {
          phaseId: "orient",
          status: "observed",
          evidence: [
            "The shared choreography timeline reserves normalized progress 0.00–0.12 for root-notation focus.",
            "One shared focus shadow spans the independently addressable exponent tokens."
          ],
          contract: "Focus the fractional exponent as the notation that will be transformed."
        },
        {
          phaseId: "reflow",
          status: "observed",
          evidence: [
            "The x continuant reflows independently over normalized progress 0.12–0.32.",
            "Exponent gathering remains at zero until x reflow completes."
          ],
          contract: "Move x continuously to radicand position while keeping it independently recognizable."
        },
        {
          phaseId: "act",
          status: "observed",
          evidence: [
            "The exponent collapses toward a shared bundle near the radical's opposite corner.",
            "Generated editor tokens use measured opposite-corner paths and far-side reveal order.",
            "The dashboard comparison retains its DOM fold/bundle/swap grids without a texture overlay."
          ],
          contract: "Transfer root-operation salience from exponent notation into radical notation through a shared bundle."
        },
        {
          phaseId: "settle",
          status: "observed",
          evidence: [
            "A late endpoint window keeps the target artifact clone visible before native target handoff.",
            "Generated source tokens remain independently transformed above nonzero scale.",
            "At progress 1 both the persistent x and radical return to exact native target geometry."
          ],
          contract: "Complete the radical shape and native DOM handoff before release."
        },
        {
          phaseId: "release",
          status: "observed",
          evidence: [
            "Release occupies normalized progress 0.90–1.00.",
            "The shared shadow is removed and the focus profile is exactly neutral."
          ],
          contract: "Release attention after the radical and radicand form a stable perceptual unit."
        }
      ],
      checkpoints: [
        {
          id: "start",
          progress: 0,
          status: "observed",
          evidence: "x^(1/2) is native and the radical is absent."
        },
        {
          id: "focus-peak",
          progress: 0.12,
          status: "observed",
          evidence: "The exponent reaches full group focus before x reflow."
        },
        {
          id: "reflow-complete",
          progress: 0.32,
          status: "observed",
          evidence: "The x continuant reaches its radicand endpoint before exponent gathering begins."
        },
        {
          id: "act-midpoint",
          progress: 0.55,
          status: "observed",
          evidence: "Independent exponent tokens converge near the shared bundle while the radical begins unfolding."
        },
        {
          id: "settled",
          progress: 0.9,
          status: "observed",
          evidence: "The recognition window holds complete radical geometry before focus release."
        },
        {
          id: "released",
          progress: 1,
          status: "observed",
          evidence: "The target is native and the shared focus shadow has been removed."
        },
        {
          id: "rewind",
          progress: 0.5,
          status: "observed",
          evidence: "Reverse handoff restores DOM ownership to the source exponent."
        }
      ],
      geometry: [
        "The shared artifact bundle sits down and inward from the target radical's leading corner.",
        "Artifact fragments collapse from the exponent and unfold into the radical instead of scaling the whole expression.",
        "The x continuant travels independently on the foreground clone layer."
      ],
      propagation: [
        "Source fragments use a six-by-two grid with bounded stagger and drift.",
        "Target fragments use a ten-by-two grid with a wider stagger.",
        "The source far side begins collapsing first, creating directional transfer."
      ],
      rewind: [
        "Reverse sampling restores source ownership without mutating endpoint DOM.",
        "The representational lineage must reverse from radical notation to exponent notation."
      ],
      knownGaps: [
        "The legacy dashboard fixture still renders through its DOM fold/bundle/swap controller; the generated editor now supplies the renderer-neutral shared successor plan used for comparison."
      ]
    },
    {
      id: "exemplar.linear-rearrangement.dashboard-v0",
      label: "Linear rearrangement: solve x + 3 = 7",
      animationIds: ["linear-equation-solve-x", "animation.linear-solve.solve-x"],
      sourceRefs: [
        "src/animation/linear-solve-adapter.ts#createLinearSolveAnimationAsset",
        "src/semantic/linear-solve-asset.ts#createLinearSolveTransformations",
        "tests/katex-transition.browser.spec.ts#editor-equation-motion-demo"
      ],
      continuants: [
        {
          id: "continuant.linear.x",
          meaning: "x persists through every rearrangement and simplification step.",
          sourceSelectorIds: ["equation.linear-solve.initial.lhs.x"],
          targetSelectorIds: ["equation.linear-solve.solved.lhs.x"],
          relation: "identity"
        },
        {
          id: "continuant.linear.relation",
          meaning: "Equality remains the stable structural anchor.",
          sourceSelectorIds: ["equation.linear-solve.initial.equals"],
          targetSelectorIds: ["equation.linear-solve.solved.equals"],
          relation: "identity"
        }
      ],
      appearances: [
        {
          targetSelectorIds: [
            "equation.linear-solve.after-subtract.lhs.minus3",
            "equation.linear-solve.after-subtract.rhs.minus3"
          ],
          cause: "Subtracting the same value from both sides introduces balanced inverse terms."
        },
        {
          targetSelectorIds: ["equation.linear-solve.solved.rhs.4"],
          cause: "Evaluating the constant difference derives 4 from 7 and -3."
        }
      ],
      phases: [
        {
          phaseId: "orient",
          status: "observed",
          evidence: [
            "Every generated solve step compiles a causal focus group before motion.",
            "Subtract focuses the existing +3; cancellation and evaluation focus their complete operand groups.",
            "One elevated group shadow follows each causal group without entering equation layout."
          ],
          contract: "Focus the smallest causal group for the active algebraic operation."
        },
        {
          phaseId: "reflow",
          status: "observed",
          evidence: [
            "Balanced introduction reaches reservation progress 1 before either inverse term becomes visible.",
            "Cancellation holds survivor slots until meet/collapse, then compacts persistent tokens.",
            "x and equality remain fully opaque while measured continuant geometry moves."
          ],
          contract: "Move persistent terms to their target slots before or after the semantic act according to the operation's causal order."
        },
        {
          phaseId: "act",
          status: "observed",
          evidence: [
            "Balanced inverse terms enter diagonally with bounded independent stagger after accommodation reflow.",
            "Cancellation keeps both terms at nonzero scale through meet before collapse.",
            "Final simplification moves 7 and -3 independently on opposite arcs before revealing 4."
          ],
          contract: "Execute operation-specific causal subgraphs rather than a whole-equation replacement."
        },
        {
          phaseId: "settle",
          status: "observed",
          evidence: [
            "Each operation subgraph ends in an explicit recognize-result node.",
            "The derived 4 overlaps its still-visible operands before holding at native geometry."
          ],
          contract: "Hold each algebraically recognizable result before advancing to the next semantic step."
        },
        {
          phaseId: "release",
          status: "observed",
          evidence: [
            "Release is a named subgraph node and normalized envelope phase.",
            "At the endpoint focus z, scale, outline, context dimming, and shared shadow return exactly to neutral."
          ],
          contract: "Remove focus after the step's stable recognition checkpoint."
        }
      ],
      checkpoints: [
        {
          id: "start",
          progress: 0,
          status: "observed",
          evidence: "Each transformation begins from a native equation state."
        },
        {
          id: "focus-peak",
          progress: 0.14,
          status: "observed",
          evidence: "Each causal group reaches full focus before the reflow phase."
        },
        {
          id: "reflow-complete",
          progress: 0.38,
          status: "observed",
          evidence: "Subtract-both-sides completes reserved-space reflow before inverse-term opacity rises above zero."
        },
        {
          id: "act-midpoint",
          progress: 0.55,
          status: "observed",
          evidence: "Canceling or simplifying operands remain independently visible while converging through their operation subgraph."
        },
        {
          id: "settled",
          progress: 0.9,
          status: "observed",
          evidence: "The exact target holds under a named recognition checkpoint before release."
        },
        {
          id: "released",
          progress: 1,
          status: "observed",
          evidence: "Native target ownership is exact and the shared focus shadow is removed."
        },
        {
          id: "rewind",
          progress: 0.75,
          status: "observed",
          evidence: "Forward 0.25 and rewind 0.75 sample the same semantic transformation and complementary beat."
        }
      ],
      geometry: [
        "Equality acts as a persistent layout anchor while terms move around it.",
        "Introduced inverse terms occupy newly opened space; they do not replace persisted terms.",
        "Canceling terms meet and collapse before survivors settle into the vacated layout."
      ],
      propagation: [
        "Subtract-both-sides treats the two introduced inverse terms as one balanced causal event.",
        "Cancellation orders meet before collapse before survivor reflow.",
        "Constant simplification orders meet before collapse before result reveal."
      ],
      rewind: [
        "Rewind preserves active transformation identity and reverses normalized progress.",
        "Persisted x and equality continuants remain authoritative throughout reverse sampling."
      ],
      knownGaps: [
        "The legacy dashboard exemplar and generated editor now express the same causal ordering through separate runtime adapters; a future consolidation can share one renderer-neutral sampler."
      ]
    }
  ];

export function choreographyExemplarBaseline(
  id: string
): ChoreographyExemplarBaseline {
  const baseline = choreographyExemplarBaselines.find(
    (candidate) => candidate.id === id
  );

  if (baseline === undefined) {
    throw new Error(`Missing choreography exemplar baseline ${id}.`);
  }

  return baseline;
}
