import { createKpVignetteRelease } from "../kp-article-import-lock.ts";

export const kpFractionCompositionArticleObjectBindings = Object.freeze([
  objectBinding("equation", [
    target("factored", "fraction-solve.state.factored.equation"),
    target("normalized", "fraction-solve.state.normalized.equation"),
    target("constant-quotient", "fraction-solve.state.constant-quotient.equation"),
    target("difference-simplified", "fraction-solve.state.difference-simplified.equation"),
    target("right-product-simplified", "fraction-solve.state.right-product-simplified.equation"),
    target("solved", "fraction-solve.state.solved.equation")
  ]),
  objectBinding("factor", [
    target("factored", "fraction-fan-out.source.factor")
  ]),
  objectBinding("grouped-sum", [
    target("factored", "fraction-fan-out.source.grouped-sum")
  ]),
  objectBinding("distributed-variable-term", [
    target("factored", "fraction-fan-out.source.addend.x"),
    target("distributed", "fraction-fan-out.target.term.x"),
    target("normalized", "fraction-normalization.target.x"),
    target("constant-product", "constant-product.left.variable"),
    target("constant-quotient", "constant-quotient.left.variable")
  ]),
  objectBinding("distributed-constant-term", [
    target("factored", "fraction-fan-out.source.addend.6"),
    target("distributed", "fraction-fan-out.target.term.6"),
    target("normalized", "fraction-normalization.target.6"),
    target("constant-product", "constant-product.left.constant"),
    target("constant-quotient", "constant-quotient.left.4")
  ]),
  objectBinding("constant-term", [
    target("constant-quotient", "constant-quotient.left.4")
  ]),
  objectBinding("variable-fraction", [
    target("constant-quotient", "constant-quotient.left.variable"),
    target("difference-simplified", "difference-simplified.left")
  ]),
  objectBinding("left-side", [
    target("factored", "fraction-solve.state.factored.left-side"),
    target("normalized", "fraction-solve.state.normalized.left-side"),
    target("constant-quotient", "fraction-solve.state.constant-quotient.left-side"),
    target("difference-simplified", "fraction-solve.state.difference-simplified.left-side"),
    target("right-product-simplified", "fraction-solve.state.right-product-simplified.left-side"),
    target("solved", "fraction-solve.state.solved.left-side")
  ]),
  objectBinding("right-side", [
    target("factored", "fraction-solve.state.factored.right-relation"),
    target("normalized", "fraction-solve.state.normalized.right-relation"),
    target("constant-quotient", "fraction-solve.state.constant-quotient.right-relation"),
    target("difference-simplified", "fraction-solve.state.difference-simplified.right-relation"),
    target("right-product-simplified", "fraction-solve.state.right-product-simplified.right-relation"),
    target("solved", "fraction-solve.state.solved.right-relation")
  ]),
  objectBinding("denominator", [
    target("difference-simplified", "difference-simplified.left.denominator"),
    target("difference-simplified", "difference-simplified.left.fraction-rule")
  ]),
  objectBinding("coefficient", [
    target("right-product-simplified", "right-product-simplified.left.2")
  ]),
  objectBinding("solution", [
    target("solved", "fraction-solve.state.solved.equation")
  ])
]);

export const kpFractionCompositionArticleCheckpointBindings = Object.freeze([
  checkpoint("factored", "fraction-solve.state.factored", "fraction-solve.state.factored.equation"),
  checkpoint("normalized", "fraction-solve.state.normalized", "fraction-solve.state.normalized.equation"),
  checkpoint(
    "constant-quotient",
    "fraction-solve.state.constant-quotient",
    "fraction-solve.state.constant-quotient.equation"
  ),
  checkpoint(
    "difference-simplified",
    "fraction-solve.state.difference-simplified",
    "fraction-solve.state.difference-simplified.equation"
  ),
  checkpoint(
    "right-product-simplified",
    "fraction-solve.state.right-product-simplified",
    "fraction-solve.state.right-product-simplified.equation"
  ),
  checkpoint("solved", "fraction-solve.state.solved", "fraction-solve.state.solved.equation")
]);

export const kpFractionCompositionArticleTransitionBindings = Object.freeze([
  transition(
    "distribute-and-normalize",
    "evaluation.fraction-composition.expand-fractions",
    "factored",
    "normalized"
  ),
  transition(
    "evaluate-constant",
    "evaluation.fraction-composition.evaluate-constants",
    "normalized",
    "constant-quotient"
  ),
  transition(
    "subtract-and-simplify",
    "evaluation.fraction-composition.subtract-and-simplify",
    "constant-quotient",
    "difference-simplified"
  ),
  transition(
    "clear-denominator",
    "evaluation.fraction-composition.multiply-and-simplify",
    "difference-simplified",
    "right-product-simplified"
  ),
  transition(
    "divide-and-solve",
    "evaluation.fraction-composition.divide-and-solve",
    "right-product-simplified",
    "solved"
  )
]);

export const fractionCompositionArticleVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.algebra.fraction-composition",
  version: "1.0.0",
  integrity: "sha256:de784b886b89bb49a92b33ca0cbc3eb5da386455a22a354a4824731e5fb60655",
  moduleSpecifier: "../../animation/fraction-composition-equation-adapter.ts",
  animationId: "animation.fraction-composition.two-thirds-solve",
  objectPaths: kpFractionCompositionArticleObjectBindings.map(({ path }) => path),
  transitionPaths: kpFractionCompositionArticleTransitionBindings.map(({ path }) => path),
  checkpointPaths: kpFractionCompositionArticleCheckpointBindings.map(({ path }) => path),
  accessibility: {
    accessibleName: "Distribute two thirds and solve the equation",
    semanticSummary:
      "Two thirds distributes across x plus six, both sides remain equal through inverse operations, and x is isolated at nine.",
    reducedMotion: "direct-checkpoint-seek"
  },
  staticProjection: {
    checkpoints: [
      staticCheckpoint(
        "factored",
        "Read the grouped factor",
        "Two thirds multiplies the complete quantity x plus six, and the expression equals ten.",
        "Read the scope of the fraction before distributing it."
      ),
      staticCheckpoint(
        "normalized",
        "Distributed fractions",
        "Two x over three plus two times six over three equals ten.",
        "Both addends now carry the distributed factor over the shared denominator."
      ),
      staticCheckpoint(
        "constant-quotient",
        "Constant evaluated",
        "Two x over three plus four equals ten.",
        "The constant fraction simplifies while the variable fraction remains exact."
      ),
      staticCheckpoint(
        "difference-simplified",
        "Variable fraction isolated",
        "Two x over three equals six.",
        "Subtracting four from both sides isolates the fractional variable term."
      ),
      staticCheckpoint(
        "right-product-simplified",
        "Denominator cleared",
        "Two x equals eighteen.",
        "Multiplying both sides by three clears the denominator and preserves equality."
      ),
      staticCheckpoint(
        "solved",
        "Exact solution",
        "x equals nine.",
        "Dividing both sides by two gives the exact solution."
      )
    ],
    transitions: kpFractionCompositionArticleTransitionBindings.map(
      ({ path, from, to }) => ({ id: path, from, to })
    )
  }
});

export const kpFractionCompositionArticleVignetteRegistry = Object.freeze([
  fractionCompositionArticleVignetteRelease
]);

type CheckpointPath =
  | "factored"
  | "normalized"
  | "constant-quotient"
  | "difference-simplified"
  | "right-product-simplified"
  | "solved";

type EquationStatePath = CheckpointPath | "distributed" | "constant-product";

function objectBinding(
  path: string,
  targets: readonly ReturnType<typeof target>[]
) {
  return Object.freeze({ path, targets: Object.freeze(targets) });
}

function target(statePath: EquationStatePath, targetId: string) {
  return Object.freeze({ statePath, targetId });
}

function checkpoint(path: CheckpointPath, stateId: string, defaultFocusTargetId: string) {
  return Object.freeze({ path, stateId, defaultFocusTargetId });
}

function transition(
  path: string,
  evaluationNodeId: string,
  from: CheckpointPath,
  to: CheckpointPath
) {
  return Object.freeze({ path, evaluationNodeId, from, to });
}

function staticCheckpoint(
  id: CheckpointPath,
  label: string,
  alt: string,
  caption: string
) {
  return Object.freeze({
    id,
    label,
    alt,
    caption,
    assetPath: `./kp-static/algebra-fraction-composition-${id}.svg`
  });
}
