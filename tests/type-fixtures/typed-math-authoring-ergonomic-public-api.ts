import { add, constant, createKpMathAuthoringContext, defineKpAuthoredFunction, multiply, power } from "../../src/math/authoring/public-api.ts";
import { deriveKpAuthoredHessian, deriveKpAuthoredJacobian, kpHessianConstructDescriptor, kpJacobianConstructDescriptor } from "../../src/math/authoring/calculus.ts";
import type { KpFunctionType, KpScalarType, KpVectorType } from "../../src/math/authoring/public-api.ts";

// KP_AUTHORING_ERGONOMICS_START: affine-jacobian-and-quadratic-hessian
const author = createKpMathAuthoringContext({ namespace: "public.ergonomic" });
const affine = defineKpAuthoredFunction(author, {
  path: ["functions", "affine"], name: "f", parameters: ["x", "y"] as const,
  output: ({ x, y }, { vector }) => vector([
    add(multiply(constant(2), x.expression), y.expression),
    add(x.expression, multiply(constant(-3), y.expression))
  ])
});
export const jacobian = deriveKpAuthoredJacobian({ source: affine, descriptor: kpJacobianConstructDescriptor });
const quadratic = defineKpAuthoredFunction(author, {
  path: ["functions", "quadratic"], name: "q", parameters: ["x", "y"] as const,
  output: ({ x, y }, { scalar }) => scalar(add(
    power(x.expression, 2), multiply(x.expression, y.expression), power(y.expression, 2)
  ))
});
export const hessian = deriveKpAuthoredHessian({ source: quadratic, descriptor: kpHessianConstructDescriptor });
// KP_AUTHORING_ERGONOMICS_END: affine-jacobian-and-quadratic-hessian

const inferred: KpFunctionType<
  readonly [KpScalarType, KpScalarType],
  KpVectorType<2>
> = affine.type;
void inferred;
void jacobian;
void hessian;
