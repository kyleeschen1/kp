export type MaterialContinuityRegressionKind =
  | "ownership-swap"
  | "envelope-restart"
  | "disconnected-bundle"
  | "structural-deformation";

export interface MaterialContinuityRegressionObservation {
  readonly id: string;
  readonly kind: MaterialContinuityRegressionKind;
  readonly progress: number;
  readonly sourceEvidence: readonly string[];
  readonly visibleFailure: string;
  readonly repairContract: string;
}

export interface MaterialContinuityRegressionBaseline {
  readonly id: string;
  readonly animationId: string;
  readonly descriptorId: string;
  readonly observations: readonly MaterialContinuityRegressionObservation[];
}

/**
 * These baselines intentionally describe known-bad behavior. They keep the
 * repair loop honest until executable quality laws replace source inspection.
 */
export const materialContinuityRegressionBaselines:
  readonly MaterialContinuityRegressionBaseline[] = [
    {
      id: "regression.linear-solve.material-continuity-v0",
      animationId: "animation.linear-solve.solve-x",
      descriptorId: "editor-animation.animation.linear-solve.solve-x",
      observations: [
        {
          id: "linear.persistent-owner-swap",
          kind: "ownership-swap",
          progress: 1 / 3,
          sourceEvidence: [
            "src/rendering/equation-linear-rearrangement.ts#samplePersistentRelation",
            "Source continuants remain fully visible for every progress below one.",
            "Target continuants remain fully hidden until progress equals one."
          ],
          visibleFailure:
            "Persistent x, equality, and constants are replaced by state-specific DOM tokens at an operation boundary.",
          repairContract:
            "One visual material owner must remain mounted across adjacent solve transformations."
        },
        {
          id: "linear.envelope-restart",
          kind: "envelope-restart",
          progress: 2 / 3,
          sourceEvidence: [
            "src/editor/equation-surface-adapter.ts#createKpEditorEquationStageFrame",
            "Local progress resets independently for each transformation phase.",
            "Each linear step samples a complete orient-reflow-act-settle-release envelope."
          ],
          visibleFailure:
            "The solve stops, releases attention, and begins a new clip for each algebraic operation.",
          repairContract:
            "Adjacent causal operations must bridge envelopes while preserving explicit step checkpoints."
        }
      ]
    },
    {
      id: "regression.radical-rewrite.material-continuity-v0",
      animationId: "animation.generated.radical.square-root-as-power",
      descriptorId:
        "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
      observations: [
        {
          id: "radical.disconnected-source-target-bundles",
          kind: "disconnected-bundle",
          progress: 0.58,
          sourceEvidence: [
            "src/rendering/equation-representational-succession.ts#sampleKpEquationRepresentationalSuccession",
            "Exponent fragments plan paths toward targetCenter.",
            "Radical target fragments originate at bundlePoint."
          ],
          visibleFailure:
            "Exponent pieces gather toward one destination while the radical independently grows from another.",
          repairContract:
            "Source exponent fragments and target radical fragments must reconcile through the same measured bundle."
        },
        {
          id: "radical.base-owner-swap",
          kind: "ownership-swap",
          progress: 1,
          sourceEvidence: [
            "src/rendering/semantic-equation-token-renderer.ts#sampleRelation",
            "The source role-change token owns visibility below progress one.",
            "The target role-change token becomes visible only at progress one."
          ],
          visibleFailure:
            "The base appears continuous geometrically but changes DOM material at release.",
          repairContract:
            "The power base and radicand must share one mounted visual material owner."
        },
        {
          id: "radical.structural-gestalt-deformation",
          kind: "structural-deformation",
          progress: 0.5,
          sourceEvidence: [
            "src/editor/equation-surface-adapter.ts#applyGestaltTokenRealization",
            "Every data-kp-motion-id token receives individual translate and nonuniform scale.",
            "Fraction lines and radical structural tokens are not exempt."
          ],
          visibleFailure:
            "Thin fraction and radical structures shimmer or squash while canonical artifact motion is active.",
          repairContract:
            "Structural notation must opt out of nonuniform deformation while retaining bounded path-relative motion."
        }
      ]
    }
  ];

