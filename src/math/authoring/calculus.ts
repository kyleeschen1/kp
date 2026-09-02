export {
  deriveKpHessian,
  deriveKpJacobian,
  projectKpDerivativeMatrixToLatex,
  type KpDerivativeMatrix,
  type KpDerivativeMatrixKind
} from "../typed-semantic-math.ts";

export {
  deriveKpAuthoredHessian,
  deriveKpAuthoredJacobian
} from "./ergonomic-calculus.ts";

export {
  kpHessianConstructDescriptor,
  kpJacobianConstructDescriptor,
  type KpSemanticConstructDescriptor
} from "./construct-descriptor.ts";
