export { createKpStandardMathAuthoringContext } from "./standard-context.ts";

export {
  createKpCartesianSpace,
  createKpFloatingPointScalars,
  createKpStandardScalarSpace,
  type KpCoordinates
} from "../algebra/standard-spaces.ts";

export {
  createKpFiniteBasis,
  sameKpFiniteBasis,
  type KpCoordinateTuple,
  type KpFiniteBasis
} from "../algebra/finite-basis.ts";

export {
  composeKpLinearMaps,
  createKpLinearMap,
  identityKpLinearMap,
  type KpLinearMap
} from "../algebra/linear-map.ts";

export {
  applyKpMatrixRepresentation,
  representKpLinearMap,
  type KpMatrixRepresentation,
  type KpScalarMatrix
} from "../algebra/matrix-representation.ts";
