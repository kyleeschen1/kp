import { defineKpAuthoredFunction } from "../../src/math/authoring/builders.ts";
import { createKpMathAuthoringContext } from "../../src/math/authoring/context.ts";
import { add, constant, multiply } from "../../src/math/expression.ts";
import type {
  KpFunctionType,
  KpScalarType,
  KpVectorType
} from "../../src/math/typed-semantic-math.ts";

const context = createKpMathAuthoringContext({ namespace: "lesson.fixture" });
const affine = defineKpAuthoredFunction(context, {
  path: ["functions", "affine"],
  name: "f",
  parameters: ["x", "y"] as const,
  output: ({ x, y }, { vector }) => vector([
    add(multiply(constant(2), x.expression), y.expression),
    add(x.expression, y.expression)
  ])
});

const signature: KpFunctionType<
  readonly [KpScalarType, KpScalarType],
  KpVectorType<2>
> = affine.type;
const firstName: "x" = affine.parameters[0].name;
void signature;
void firstName;

defineKpAuthoredFunction(context, {
  path: ["functions", "invalid-environment"],
  name: "bad",
  parameters: ["x", "y"] as const,
  output: (parameters, { scalar }) => {
    // @ts-expect-error Undeclared parameters are absent from the environment.
    const z: KpScalarType = parameters.z.type;
    return scalar(add(parameters.x.expression, constant(z.kind.length)));
  }
});
