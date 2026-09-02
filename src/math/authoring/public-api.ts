export {
  add,
  constant,
  cos,
  divide,
  multiply,
  negate,
  power,
  sin,
  variable,
  type MathExpression,
  type NumericScope
} from "../expression.ts";

export {
  composeKpFunctionSignatures,
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedEquation,
  createKpTypedMatrix,
  createKpTypedVector,
  defineKpTypedFunction,
  evaluateKpTypedMatrix,
  isKpTypedVectorFunction,
  multiplyKpTypedMatrices,
  projectKpTypedMathToLatex,
  type KpFunctionType,
  type KpMathProvenance,
  type KpMathValueType,
  type KpMatrixType,
  type KpScalarExpression,
  type KpScalarParameter,
  type KpScalarType,
  type KpScalarValue,
  type KpTypedEquation,
  type KpTypedFunction,
  type KpTypedMathValue,
  type KpTypedMatrix,
  type KpTypedVector,
  type KpVectorType
} from "../typed-semantic-math.ts";

export {
  createKpMathAuthoringContext,
  type KpMathAuthoringContext,
  type KpMathAuthoringDefaults,
  type KpMathAuthoringNotation,
  type KpSemanticAuthoringRef
} from "./context.ts";

export {
  defineKpAuthoredFunction,
  type KpFunctionOutputBuilder,
  type KpParameterEnvironment,
  type KpParametersForNames
} from "./builders.ts";
