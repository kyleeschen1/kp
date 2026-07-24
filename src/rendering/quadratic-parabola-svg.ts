import type {
  KpQuadraticGraphExactPoint,
  KpQuadraticParabolaGraphProjection
} from "../projections/quadratic-parabola-graph.ts";

const width = 600;
const height = 320;
const inset = 34;

/**
 * Maps exact, authority-owned graph points into SVG space. It deliberately has
 * no polynomial or root-finding input, so presentation cannot invent answers.
 */
export function renderKpQuadraticParabolaSvg(
  projection: KpQuadraticParabolaGraphProjection
): string {
  const xAxisY = mapY(projection, { numerator: "0", denominator: "1" });
  const yAxisX = mapX(projection, { numerator: "0", denominator: "1" });
  const points = projection.curveSamples
    .map((point) => `${format(mapX(projection, point.x))},${format(mapY(projection, point.y))}`)
    .join(" ");
  return [
    `<svg class="kp-quadratic-graph" data-kp-quadratic-graph data-kp-selector-id="${projection.selectors.graph}" data-kp-equation-authority="${projection.equationAuthorityId}" data-kp-renderer-may-solve="false" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="kp-quadratic-graph-title kp-quadratic-graph-description">`,
    '<title id="kp-quadratic-graph-title">The parabola y equals x squared minus five x plus six</title>',
    '<desc id="kp-quadratic-graph-description">The curve crosses the x-axis at the exact solution points x equals two and x equals three.</desc>',
    '<g class="kp-quadratic-graph__grid" aria-hidden="true">',
    ...[1, 2, 3, 4].map((x) => line(mapX(projection, rational(x)), inset, mapX(projection, rational(x)), height - inset)),
    ...[1, 2, 3, 4, 5, 6].map((y) => line(inset, mapY(projection, rational(y)), width - inset, mapY(projection, rational(y)))),
    "</g>",
    `<g class="kp-quadratic-graph__axes" data-kp-selector-id="${projection.selectors.xAxis} ${projection.selectors.yAxis}">`,
    line(inset, xAxisY, width - inset, xAxisY),
    line(yAxisX, inset, yAxisX, height - inset),
    "</g>",
    `<polyline class="kp-quadratic-graph__curve" data-kp-selector-id="${projection.selectors.curve}" points="${points}" pathLength="1"/>`,
    ...projection.roots.map((root) => rootMarkup(projection, root)),
    "</svg>"
  ].join("\n");
}

function rootMarkup(
  projection: KpQuadraticParabolaGraphProjection,
  root: KpQuadraticParabolaGraphProjection["roots"][number]
): string {
  const x = mapX(projection, root.x);
  const y = mapY(projection, root.y);
  const label = root.branchSign === "minus" ? "x = 2" : "x = 3";
  return [
    `<g class="kp-quadratic-graph__root" data-kp-graph-root="${root.solutionMemberId}" data-kp-branch-sign="${root.branchSign}" data-kp-selector-id="${root.selectorId}" transform="translate(${format(x)} ${format(y)})">`,
    '<circle r="8"/>',
    `<text y="28" text-anchor="middle">${label}</text>`,
    "</g>"
  ].join("");
}

function mapX(
  projection: KpQuadraticParabolaGraphProjection,
  value: KpQuadraticGraphExactPoint["x"]
): number {
  return inset + ratio(value, projection.domain.xMin, projection.domain.xMax) *
    (width - inset * 2);
}

function mapY(
  projection: KpQuadraticParabolaGraphProjection,
  value: KpQuadraticGraphExactPoint["y"]
): number {
  return height - inset - ratio(value, projection.domain.yMin, projection.domain.yMax) *
    (height - inset * 2);
}

function ratio(
  value: KpQuadraticGraphExactPoint["x"],
  min: KpQuadraticGraphExactPoint["x"],
  max: KpQuadraticGraphExactPoint["x"]
): number {
  const number = rationalNumber(value);
  return (number - rationalNumber(min)) / (rationalNumber(max) - rationalNumber(min));
}

function rationalNumber(value: KpQuadraticGraphExactPoint["x"]): number {
  return Number(value.numerator) / Number(value.denominator);
}

function rational(value: number): KpQuadraticGraphExactPoint["x"] {
  return { numerator: String(value), denominator: "1" };
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `<line x1="${format(x1)}" y1="${format(y1)}" x2="${format(x2)}" y2="${format(y2)}"/>`;
}

function format(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
