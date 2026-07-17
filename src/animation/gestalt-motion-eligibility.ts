export interface KpGestaltMotionEligibility {
  readonly identityId: string;
  readonly mode:
    | "material-continuant"
    | "structural-fragment"
    | "ordinary-token";
  readonly coordinateSpace: "path-relative" | "screen";
  readonly microMotionScale: number;
  readonly deformationScale: number;
}

export function resolveKpGestaltMotionEligibility(
  motionId: string
): KpGestaltMotionEligibility {
  const linearRole = [
    "lhs.x",
    "lhs.plus3",
    "lhs.minus3",
    "equals",
    "rhs.7",
    "rhs.minus3",
    "rhs.4"
  ].find((candidate) => motionId.endsWith(`.${candidate}`));
  if (linearRole !== undefined) {
    return {
      identityId: `linear-solve.${linearRole}`,
      mode: "material-continuant",
      coordinateSpace: "path-relative",
      microMotionScale: 0.72,
      deformationScale: 0.55
    };
  }
  if (motionId.endsWith(".power.base") || motionId.endsWith(".radical.radicand")) {
    return {
      identityId: "radical-rewrite.base-radicand",
      mode: "material-continuant",
      coordinateSpace: "path-relative",
      microMotionScale: 0.72,
      deformationScale: 0.5
    };
  }
  const radicalFragment = [
    "exponent-numerator",
    "exponent-fraction-line",
    "exponent-denominator",
    "radical-hook",
    "radical-overbar"
  ].find((candidate) => motionId.endsWith(`.${candidate}`));
  if (radicalFragment !== undefined) {
    const structural =
      radicalFragment === "exponent-fraction-line" ||
      radicalFragment === "radical-hook" ||
      radicalFragment === "radical-overbar";
    return {
      identityId: `radical-rewrite.root-notation.${radicalFragment}`,
      mode: structural ? "structural-fragment" : "material-continuant",
      coordinateSpace: "path-relative",
      microMotionScale: structural ? 0.24 : 0.58,
      deformationScale: structural ? 0 : 0.35
    };
  }
  return {
    identityId: motionId,
    mode: "ordinary-token",
    coordinateSpace: "screen",
    microMotionScale: 1,
    deformationScale: 1
  };
}

export function projectKpGestaltOffsetToPath(input: {
  readonly x: number;
  readonly y: number;
  readonly transform: string;
}): { readonly x: number; readonly y: number } {
  if (input.transform === "" || input.transform === "none") {
    return { x: input.x, y: input.y };
  }
  const matrix = new DOMMatrixReadOnly(input.transform);
  const length = Math.hypot(matrix.m41, matrix.m42);
  if (length < 0.001) return { x: input.x, y: input.y };
  const tangent = { x: matrix.m41 / length, y: matrix.m42 / length };
  const normal = { x: -tangent.y, y: tangent.x };
  return {
    x: input.x * tangent.x + input.y * normal.x,
    y: input.x * tangent.y + input.y * normal.y
  };
}
