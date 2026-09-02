import {
  deriveKpHessian,
  deriveKpJacobian,
  type KpDerivativeMatrix,
  type KpScalarParameter,
  type KpScalarValue,
  type KpTypedFunction,
  type KpTypedVector
} from "../typed-semantic-math.ts";
import {
  kpHessianConstructDescriptor,
  kpJacobianConstructDescriptor,
  type KpSemanticConstructDescriptor
} from "./construct-descriptor.ts";

export function deriveKpAuthoredJacobian<
  const Parameters extends readonly KpScalarParameter[],
  const Size extends number,
  const Entries extends readonly KpScalarValue[]
>(input: {
  readonly source: KpTypedFunction<Parameters, KpTypedVector<Size, Entries>>;
  readonly descriptor?: KpSemanticConstructDescriptor | undefined;
}): KpDerivativeMatrix<"jacobian", Size, Parameters["length"]> {
  const descriptor = input.descriptor ?? kpJacobianConstructDescriptor;
  requireConstruct(descriptor, "jacobian");
  return deriveKpJacobian({
    id: `${input.source.id}.jacobian`,
    source: input.source
  });
}

export function deriveKpAuthoredHessian<
  const Parameters extends readonly KpScalarParameter[]
>(input: {
  readonly source: KpTypedFunction<Parameters, KpScalarValue>;
  readonly descriptor?: KpSemanticConstructDescriptor | undefined;
}): KpDerivativeMatrix<
  "hessian",
  Parameters["length"],
  Parameters["length"]
> {
  const descriptor = input.descriptor ?? kpHessianConstructDescriptor;
  requireConstruct(descriptor, "hessian");
  return deriveKpHessian({
    id: `${input.source.id}.hessian`,
    source: input.source
  });
}

function requireConstruct(
  descriptor: KpSemanticConstructDescriptor,
  expected: "jacobian" | "hessian"
): void {
  if (descriptor.construct !== expected) {
    throw new Error(
      `Expected ${expected} descriptor; received ${descriptor.construct}.`
    );
  }
}
