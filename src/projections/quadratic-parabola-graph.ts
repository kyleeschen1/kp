import {
  createCanonicalKpQuadraticSemanticFixture,
  type KpQuadraticExactRational
} from "../semantic/quadratic-branching-fixture.ts";
import {
  createKpQuadraticSolutionSetFromFixture,
  normalizeKpQuadraticRational
} from "../semantic/quadratic-solution-set.ts";

export interface KpQuadraticGraphExactPoint {
  readonly id: string;
  readonly x: KpQuadraticExactRational;
  readonly y: KpQuadraticExactRational;
}

export interface KpQuadraticGraphRootPoint extends KpQuadraticGraphExactPoint {
  readonly selectorId:
    | "selector.quadratic.graph.root-two"
    | "selector.quadratic.graph.root-three";
  readonly solutionMemberId: string;
  readonly branchSign: "minus" | "plus";
  readonly intersection: "x-axis";
}

export interface KpQuadraticParabolaGraphProjection {
  readonly schemaVersion: "kp.quadratic-parabola-graph.v1";
  readonly id: "projection.quadratic.parabola.exact";
  readonly equationAuthorityId: string;
  readonly equation: {
    readonly latex: "y=x^2-5x+6";
    readonly coefficients: {
      readonly a: "1";
      readonly b: "-5";
      readonly c: "6";
    };
  };
  readonly selectors: {
    readonly graph: "selector.quadratic.graph";
    readonly xAxis: "selector.quadratic.graph.x-axis";
    readonly yAxis: "selector.quadratic.graph.y-axis";
    readonly curve: "selector.quadratic.graph.curve";
  };
  readonly domain: {
    readonly xMin: KpQuadraticExactRational;
    readonly xMax: KpQuadraticExactRational;
    readonly yMin: KpQuadraticExactRational;
    readonly yMax: KpQuadraticExactRational;
  };
  readonly curveSamples: readonly KpQuadraticGraphExactPoint[];
  readonly vertex: KpQuadraticGraphExactPoint;
  readonly roots: readonly [KpQuadraticGraphRootPoint, KpQuadraticGraphRootPoint];
  readonly authorityBoundary: {
    readonly rootSource: "verified-solution-set";
    readonly curveSource: "exact-polynomial-evaluation";
    readonly rendererMaySolve: false;
  };
}

export interface KpQuadraticParabolaGraphFrame {
  readonly schemaVersion: "kp.quadratic-parabola-graph-frame.v1";
  readonly projectionId: KpQuadraticParabolaGraphProjection["id"];
  readonly semanticProgress: number;
  readonly axesOpacity: number;
  readonly curveReveal: number;
  readonly roots: readonly {
    readonly selectorId: KpQuadraticGraphRootPoint["selectorId"];
    readonly solutionMemberId: string;
    readonly opacity: number;
    readonly labelOpacity: number;
  }[];
  readonly activeSelectorIds: readonly string[];
}

export function createCanonicalKpQuadraticParabolaGraphProjection():
  KpQuadraticParabolaGraphProjection {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const solutionSet = createKpQuadraticSolutionSetFromFixture(fixture);
  const rootTwo = solutionSet.members.find(({ id }) => id === "root:2/1");
  const rootThree = solutionSet.members.find(({ id }) => id === "root:3/1");
  if (rootTwo === undefined || rootThree === undefined) {
    throw new Error("Canonical quadratic graph requires verified roots two and three.");
  }
  const curveSamples = Object.freeze(
    Array.from({ length: 41 }, (_unused, index) => {
      const x = rational(BigInt(index), 8n);
      return Object.freeze({
        id: `point.quadratic.curve.${index}`,
        x,
        y: evaluateCanonicalQuadratic(x)
      });
    })
  );
  const projection = Object.freeze({
    schemaVersion: "kp.quadratic-parabola-graph.v1" as const,
    id: "projection.quadratic.parabola.exact" as const,
    equationAuthorityId: fixture.id,
    equation: Object.freeze({
      latex: "y=x^2-5x+6" as const,
      coefficients: Object.freeze({ a: "1" as const, b: "-5" as const, c: "6" as const })
    }),
    selectors: Object.freeze({
      graph: "selector.quadratic.graph" as const,
      xAxis: "selector.quadratic.graph.x-axis" as const,
      yAxis: "selector.quadratic.graph.y-axis" as const,
      curve: "selector.quadratic.graph.curve" as const
    }),
    domain: Object.freeze({
      xMin: Object.freeze(rational(0n)),
      xMax: Object.freeze(rational(5n)),
      yMin: Object.freeze(rational(-1n)),
      yMax: Object.freeze(rational(7n))
    }),
    curveSamples,
    vertex: Object.freeze({
      id: "point.quadratic.vertex",
      x: Object.freeze(rational(5n, 2n)),
      y: Object.freeze(rational(-1n, 4n))
    }),
    roots: Object.freeze([
      rootPoint("two", "minus", rootTwo.id, rootTwo.value),
      rootPoint("three", "plus", rootThree.id, rootThree.value)
    ]) as unknown as readonly [KpQuadraticGraphRootPoint, KpQuadraticGraphRootPoint],
    authorityBoundary: Object.freeze({
      rootSource: "verified-solution-set" as const,
      curveSource: "exact-polynomial-evaluation" as const,
      rendererMaySolve: false as const
    })
  });
  const issues = validateKpQuadraticParabolaGraphProjection(projection);
  if (issues.length > 0) throw new Error(issues.join(" "));
  return projection;
}

export function sampleKpQuadraticParabolaGraphFrame(input: {
  readonly projection: KpQuadraticParabolaGraphProjection;
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
}): KpQuadraticParabolaGraphFrame {
  if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 1) {
    throw new Error("Quadratic graph frame progress must be normalized.");
  }
  const semanticProgress = normalize(
    input.direction === "rewind" ? 1 - input.progress : input.progress
  );
  const axesOpacity = ease(interval(semanticProgress, 0, 0.2));
  const curveReveal = ease(interval(semanticProgress, 0.12, 0.62));
  const roots = input.projection.roots.map((root, index) => Object.freeze({
    selectorId: root.selectorId,
    solutionMemberId: root.solutionMemberId,
    opacity: ease(interval(semanticProgress, 0.56 + index * 0.08, 0.78 + index * 0.08)),
    labelOpacity: ease(interval(semanticProgress, 0.78 + index * 0.04, 0.96 + index * 0.04))
  }));
  return Object.freeze({
    schemaVersion: "kp.quadratic-parabola-graph-frame.v1" as const,
    projectionId: input.projection.id,
    semanticProgress,
    axesOpacity,
    curveReveal,
    roots: Object.freeze(roots),
    activeSelectorIds: Object.freeze([
      ...(axesOpacity > 0
        ? [input.projection.selectors.graph, input.projection.selectors.xAxis, input.projection.selectors.yAxis]
        : []),
      ...(curveReveal > 0 ? [input.projection.selectors.curve] : []),
      ...roots.filter(({ opacity }) => opacity > 0).map(({ selectorId }) => selectorId)
    ])
  });
}

export function validateKpQuadraticParabolaGraphProjection(
  projection: KpQuadraticParabolaGraphProjection
): readonly string[] {
  const issues: string[] = [];
  if (projection.authorityBoundary.rendererMaySolve !== false) {
    issues.push("Quadratic graph renderers may not solve for roots.");
  }
  if (projection.curveSamples.length < 3) {
    issues.push("Quadratic graph requires an ordered exact curve sample.");
  }
  for (const point of [...projection.curveSamples, projection.vertex, ...projection.roots]) {
    if (!sameRational(point.y, evaluateCanonicalQuadratic(point.x))) {
      issues.push(`Graph point ${point.id} is not on y=x²-5x+6.`);
    }
  }
  const selectorIds = projection.roots.map(({ selectorId }) => selectorId);
  if (new Set(selectorIds).size !== projection.roots.length) {
    issues.push("Graph root selectors must be unique.");
  }
  projection.roots.forEach((root) => {
    if (root.y.numerator !== "0" || root.intersection !== "x-axis") {
      issues.push(`Graph root ${root.id} must be an exact x-axis intersection.`);
    }
    if (!root.solutionMemberId.startsWith("root:")) {
      issues.push(`Graph root ${root.id} must cite verified solution-set identity.`);
    }
  });
  return Object.freeze(issues);
}

function rootPoint(
  name: "two" | "three",
  branchSign: "minus" | "plus",
  solutionMemberId: string,
  x: KpQuadraticExactRational
): KpQuadraticGraphRootPoint {
  return Object.freeze({
    id: `point.quadratic.root-${name}`,
    selectorId: `selector.quadratic.graph.root-${name}`,
    solutionMemberId,
    branchSign,
    intersection: "x-axis" as const,
    x: Object.freeze({ ...x }),
    y: Object.freeze(rational(0n))
  }) as KpQuadraticGraphRootPoint;
}

function evaluateCanonicalQuadratic(
  x: KpQuadraticExactRational
): KpQuadraticExactRational {
  const numerator = BigInt(x.numerator);
  const denominator = BigInt(x.denominator);
  return rational(
    numerator * numerator - 5n * numerator * denominator + 6n * denominator * denominator,
    denominator * denominator
  );
}

function rational(numerator: bigint, denominator = 1n): KpQuadraticExactRational {
  return normalizeKpQuadraticRational({
    numerator: String(numerator),
    denominator: String(denominator)
  });
}

function sameRational(
  left: KpQuadraticExactRational,
  right: KpQuadraticExactRational
): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

function interval(value: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

function ease(value: number): number {
  return normalize(value * value * (3 - 2 * value));
}

function normalize(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}
