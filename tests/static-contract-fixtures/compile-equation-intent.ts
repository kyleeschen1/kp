import {
  compileEquationIntent,
  type KpCompiledEquationIntentPlan
} from "../../src/authoring/compile-equation-intent.ts";

const result = compileEquationIntent({
  animationId: "animation.generated.function-wrap.apply-f",
  operation: {
    operationId: "kp.algebra.wrap-function",
    roleBindings: {
      "content-before": ["source"],
      "content-after": ["target"],
      wrapper: ["function"]
    }
  },
  explanationDepth: "compact"
});

if (result.status === "accepted") {
  const plan: KpCompiledEquationIntentPlan = result.plan;
  switch (plan.kind) {
    case "function-wrap-motif-plan":
    case "cancellation-semantic-motion-plan":
    case "distribution-operation-plan":
    case "homomorphic-crossover-semantic-motion-plan":
      break;
    default: {
      const exhaustive: never = plan;
      void exhaustive;
    }
  }
}

const rendererPlan: KpCompiledEquationIntentPlan = {
  // @ts-expect-error Renderers cannot mint a governed equation-intent plan.
  kind: "renderer-plan"
};

void rendererPlan;
