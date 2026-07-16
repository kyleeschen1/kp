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

const missingFocusPhase = (
  phaseId: "orient" | "release",
  contract: string
): ChoreographyExemplarPhaseObservation => ({
  phaseId,
  status: "missing",
  evidence: ["No dedicated focus or attention-release phase is present."],
  contract
});

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
        missingFocusPhase(
          "orient",
          "Focus the causal argument x before it changes role."
        ),
        {
          phaseId: "reflow",
          status: "observed",
          evidence: [
            "wrapped-token-shift occupies normalized progress 0.00–0.40.",
            "The x continuant reaches argument position before wrapper entry completes."
          ],
          contract: "Move the argument continuant into its target slot before wrapper artifacts dominate."
        },
        {
          phaseId: "act",
          status: "observed",
          evidence: [
            "Parentheses enter over 0.42–0.70.",
            "The function name enters over 0.50–0.78.",
            "The wrapper phase is named wrap-artifact-enter."
          ],
          contract: "Introduce the delimiters and function name as consequences of wrapping."
        },
        {
          phaseId: "settle",
          status: "implicit",
          evidence: ["Wrapper tokens reach native opacity, scale, and position at their motion endpoints."],
          contract: "Hold a fully recognizable f(x) checkpoint before attention releases."
        },
        missingFocusPhase(
          "release",
          "Remove focus only after f(x) is stable and recognizable."
        )
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
          progress: 0,
          status: "missing",
          evidence: "The exemplar does not preview the argument with focus."
        },
        {
          id: "reflow-complete",
          progress: 0.4,
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
          progress: 1,
          status: "implicit",
          evidence: "All tokens are at native target geometry."
        },
        {
          id: "released",
          progress: 1,
          status: "missing",
          evidence: "No distinct attention release follows the settled target."
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
        "No orient or release phase.",
        "No explicit recognition hold after the target becomes stable.",
        "Entry paths are short linear offsets rather than scene-derived arcs."
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
        missingFocusPhase(
          "orient",
          "Focus the fractional exponent as the notation that will be transformed."
        ),
        {
          phaseId: "reflow",
          status: "partial",
          evidence: [
            "The x continuant has a DOM clone that interpolates to the radicand endpoint.",
            "Its motion is not yet isolated into a named reflow window."
          ],
          contract: "Move x continuously to radicand position while keeping it independently recognizable."
        },
        {
          phaseId: "act",
          status: "observed",
          evidence: [
            "The exponent collapses toward a shared bundle near the radical's opposite corner.",
            "The radical unfolds from that bundle with separate source and target grids.",
            "The handoff is DOM-owned and does not require a texture overlay."
          ],
          contract: "Transfer root-operation salience from exponent notation into radical notation through a shared bundle."
        },
        {
          phaseId: "settle",
          status: "observed",
          evidence: [
            "A late endpoint window keeps the target artifact clone visible before native target handoff.",
            "At progress 1 the persistent x reaches exact target geometry."
          ],
          contract: "Complete the radical shape and native DOM handoff before release."
        },
        missingFocusPhase(
          "release",
          "Release attention after the radical and radicand form a stable perceptual unit."
        )
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
          progress: 0,
          status: "missing",
          evidence: "The exponent is not previewed with a dedicated focus phase."
        },
        {
          id: "reflow-complete",
          progress: 0.48,
          status: "partial",
          evidence: "The exponent collapse reaches its configured end, while x motion is still globally sampled."
        },
        {
          id: "act-midpoint",
          progress: 0.5,
          status: "observed",
          evidence: "Source exponent and target radical clones coexist with partial opacity around the shared bundle."
        },
        {
          id: "settled",
          progress: 0.98,
          status: "observed",
          evidence: "The endpoint window holds the target clone immediately before native target ownership."
        },
        {
          id: "released",
          progress: 1,
          status: "missing",
          evidence: "The target is native, but no separate focus release exists."
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
        "No orient or release phase.",
        "Persistent-x travel is not phase-gated independently from artifact transformation.",
        "Artifact transfer uses a bespoke dashboard controller rather than a renderer-neutral plan."
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
          status: "partial",
          evidence: [
            "The cancellation transformation carries a focus annotation for +3 and -3.",
            "Subtract and final simplify do not yet receive a uniform causal preview."
          ],
          contract: "Focus the smallest causal group for the active algebraic operation."
        },
        {
          phaseId: "reflow",
          status: "observed",
          evidence: [
            "layout-shift occupies beats 0–25 before introduced-token-enter occupies beats 25–50.",
            "post-cancel-layout-shift begins after cancel-meet and cancel-collapse."
          ],
          contract: "Move persistent terms to their target slots before or after the semantic act according to the operation's causal order."
        },
        {
          phaseId: "act",
          status: "observed",
          evidence: [
            "Balanced inverse terms enter only after accommodation reflow.",
            "Cancellation uses meet then collapse.",
            "Final simplification uses meet, collapse, then reveal."
          ],
          contract: "Execute operation-specific causal subgraphs rather than a whole-equation replacement."
        },
        {
          phaseId: "settle",
          status: "partial",
          evidence: [
            "Cancellation leaves a short gap before post-cancel reflow.",
            "Final reveal completes before the transformation endpoint."
          ],
          contract: "Hold each algebraically recognizable result before advancing to the next semantic step."
        },
        {
          phaseId: "release",
          status: "partial",
          evidence: ["Focus annotations are scoped to a transformation but have no named release motion."],
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
          progress: 0,
          status: "partial",
          evidence: "Cancellation focus exists semantically, but has no normalized visual peak."
        },
        {
          id: "reflow-complete",
          progress: 0.5,
          status: "observed",
          evidence: "Subtract-both-sides finishes layout shift before inverse-term entry."
        },
        {
          id: "act-midpoint",
          progress: 0.5,
          status: "observed",
          evidence: "Cancellation collapse ends and final simplification begins its reveal at the midpoint."
        },
        {
          id: "settled",
          progress: 0.7,
          status: "partial",
          evidence: "The final simplified value is revealed, but the recognition hold is implicit."
        },
        {
          id: "released",
          progress: 1,
          status: "partial",
          evidence: "Transformation boundaries clear active focus without a named release phase."
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
        "Orient and release are not uniformly realized as visual phases.",
        "Recognition holds are implicit gaps or unused tail time.",
        "Path geometry remains mostly linear and does not yet use scene-derived arcs."
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
