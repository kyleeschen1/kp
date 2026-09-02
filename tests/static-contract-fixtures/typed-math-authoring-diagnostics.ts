import { defineKpAuthoredFunction } from "../../src/math/authoring/builders.ts";
import { createKpMathAuthoringContext } from "../../src/math/authoring/context.ts";

const context = createKpMathAuthoringContext({
  namespace: "lesson.diagnostic-locality"
});

defineKpAuthoredFunction(context, {
  path: ["functions", "demand"],
  name: "demand",
  parameters: ["quantity", "price"] as const,
  output: (parameters, { scalar }) => {
    // @ts-expect-error Misspelled parameters must fail at this authoring expression.
    return scalar(parameters.quantit.expression);
  }
});
