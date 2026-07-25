import { kpQuadraticBranchingAnimationId } from "./quadratic-branching-asset.ts";
import type { KpQuadraticMethodId } from "../semantic/quadratic-solution-method-graph.ts";

export interface KpQuadraticPresentationProfile {
  readonly schemaVersion: "kp.quadratic-presentation-profile.v2";
  readonly id: "presentation.quadratic.canonical";
  readonly assetId: typeof kpQuadraticBranchingAnimationId;
  readonly methodSelection: {
    readonly defaultMethodId: KpQuadraticMethodId;
    readonly availableMethodIds: readonly KpQuadraticMethodId[];
  };
  readonly pacing: {
    readonly introEnd: number;
    readonly methodEnd: number;
    readonly branchEnd: number;
    readonly graphEnd: 1;
  };
  readonly attention: readonly {
    readonly phase: "intro" | "method" | "branch" | "graph";
    readonly semanticRole: string;
  }[];
  readonly branchSchedule: {
    readonly splitAt: number;
    readonly settleAt: number;
  };
  readonly semanticSolutionSet: {
    readonly completeAt: number;
    readonly visiblyStaged: false;
    readonly semanticRole: "exact-solution-set";
  };
  readonly graphHandoffAt: number;
}

export interface KpQuadraticPresentationProfileIssue {
  readonly path: string;
  readonly message: string;
}

export function createCanonicalKpQuadraticPresentationProfile():
  KpQuadraticPresentationProfile {
  return parseKpQuadraticPresentationProfile({
    schemaVersion: "kp.quadratic-presentation-profile.v2",
    id: "presentation.quadratic.canonical",
    assetId: kpQuadraticBranchingAnimationId,
    methodSelection: {
      defaultMethodId: "method.quadratic.completing-square",
      availableMethodIds: [
        "method.quadratic.completing-square",
        "method.quadratic.formula"
      ]
    },
    pacing: {
      introEnd: 0.1,
      methodEnd: 0.58,
      branchEnd: 0.8,
      graphEnd: 1
    },
    attention: [
      { phase: "intro", semanticRole: "source-equation" },
      { phase: "method", semanticRole: "active-method-state" },
      { phase: "branch", semanticRole: "plus-minus-branches" },
      { phase: "graph", semanticRole: "root-correspondence" }
    ],
    branchSchedule: {
      splitAt: 0.58,
      settleAt: 0.76
    },
    semanticSolutionSet: {
      completeAt: 0.8,
      visiblyStaged: false,
      semanticRole: "exact-solution-set"
    },
    graphHandoffAt: 0.8
  });
}

export function parseKpQuadraticPresentationProfile(
  value: unknown
): KpQuadraticPresentationProfile {
  const issues = validateKpQuadraticPresentationProfile(value);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  const profile = value as KpQuadraticPresentationProfile;
  return Object.freeze({
    ...profile,
    methodSelection: Object.freeze({
      ...profile.methodSelection,
      availableMethodIds: Object.freeze([
        ...profile.methodSelection.availableMethodIds
      ])
    }),
    pacing: Object.freeze({ ...profile.pacing }),
    attention: Object.freeze(profile.attention.map((entry) =>
      Object.freeze({ ...entry })
    )),
    branchSchedule: Object.freeze({ ...profile.branchSchedule }),
    semanticSolutionSet: Object.freeze({ ...profile.semanticSolutionSet })
  });
}

export function validateKpQuadraticPresentationProfile(
  value: unknown
): readonly KpQuadraticPresentationProfileIssue[] {
  if (!isRecord(value)) return [issue("$", "Quadratic presentation profile must be an object.")];
  const issues: KpQuadraticPresentationProfileIssue[] = [];
  exactKeys(value, [
    "schemaVersion",
    "id",
    "assetId",
    "methodSelection",
    "pacing",
    "attention",
    "branchSchedule",
    "semanticSolutionSet",
    "graphHandoffAt"
  ], "$", issues);
  literal(value["schemaVersion"], "kp.quadratic-presentation-profile.v2", "$.schemaVersion", issues);
  literal(value["id"], "presentation.quadratic.canonical", "$.id", issues);
  literal(value["assetId"], kpQuadraticBranchingAnimationId, "$.assetId", issues);
  const methods = value["methodSelection"];
  if (!isRecord(methods)) {
    issues.push(issue("$.methodSelection", "Method selection is required."));
  } else {
    exactKeys(methods, ["defaultMethodId", "availableMethodIds"], "$.methodSelection", issues);
    const expected = [
      "method.quadratic.completing-square",
      "method.quadratic.formula"
    ];
    const available = methods["availableMethodIds"];
    if (
      !Array.isArray(available) ||
      available.length !== 2 ||
      expected.some((id) => !available.includes(id)) ||
      !expected.includes(String(methods["defaultMethodId"]))
    ) {
      issues.push(issue("$.methodSelection", "Profile must expose both methods and select one as default."));
    }
  }
  const pacing = value["pacing"];
  if (!isRecord(pacing)) {
    issues.push(issue("$.pacing", "Presentation pacing is required."));
  } else {
    exactKeys(pacing, ["introEnd", "methodEnd", "branchEnd", "graphEnd"], "$.pacing", issues);
    const values = ["introEnd", "methodEnd", "branchEnd", "graphEnd"]
      .map((key) => pacing[key]);
    if (
      values.some((candidate) => typeof candidate !== "number" || candidate <= 0 || candidate > 1) ||
      values.some((candidate, index) => index > 0 && Number(candidate) <= Number(values[index - 1])) ||
      values.at(-1) !== 1
    ) {
      issues.push(issue("$.pacing", "Pacing boundaries must increase strictly from zero to one."));
    }
  }
  const branch = value["branchSchedule"];
  if (!isRecord(branch)) {
    issues.push(issue("$.branchSchedule", "Branch schedule is required."));
  } else {
    exactKeys(branch, ["splitAt", "settleAt"], "$.branchSchedule", issues);
    const split = branch["splitAt"];
    const settle = branch["settleAt"];
    if (
      typeof split !== "number" ||
      typeof settle !== "number" ||
      !(0 <= split && split < settle && settle <= 1)
    ) {
      issues.push(issue("$.branchSchedule", "Branch schedule must order split and settlement within the shared clock."));
    }
  }
  const semanticSolutionSet = value["semanticSolutionSet"];
  if (!isRecord(semanticSolutionSet)) {
    issues.push(issue(
      "$.semanticSolutionSet",
      "Presentation must retain semantic solution-set authority."
    ));
  } else {
    exactKeys(
      semanticSolutionSet,
      ["completeAt", "visiblyStaged", "semanticRole"],
      "$.semanticSolutionSet",
      issues
    );
    if (
      typeof semanticSolutionSet["completeAt"] !== "number" ||
      semanticSolutionSet["completeAt"] < 0 ||
      semanticSolutionSet["completeAt"] > 1 ||
      semanticSolutionSet["visiblyStaged"] !== false ||
      semanticSolutionSet["semanticRole"] !== "exact-solution-set"
    ) {
      issues.push(issue(
        "$.semanticSolutionSet",
        "Solution-set authority must remain semantic without a visible reunion stage."
      ));
    }
  }
  if (
    typeof value["graphHandoffAt"] !== "number" ||
    value["graphHandoffAt"] < 0 ||
    value["graphHandoffAt"] > 1
  ) {
    issues.push(issue("$.graphHandoffAt", "Graph handoff must be a normalized clock position."));
  }
  if (!Array.isArray(value["attention"]) || value["attention"].length !== 4) {
    issues.push(issue("$.attention", "Attention policy requires one entry for each presentation phase."));
  }
  if (
    isRecord(pacing) &&
    typeof pacing["branchEnd"] === "number" &&
    value["graphHandoffAt"] !== pacing["branchEnd"]
  ) {
    issues.push(issue(
      "$.graphHandoffAt",
      "Graph handoff must begin exactly when the visible branch phase ends."
    ));
  }
  return Object.freeze(issues);
}

function exactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  path: string,
  issues: KpQuadraticPresentationProfileIssue[]
): void {
  const unexpected = Object.keys(value).find((key) => !expected.includes(key));
  if (unexpected !== undefined) {
    issues.push(issue(`${path}.${unexpected}`, `Unexpected presentation field ${unexpected}.`));
  }
}

function literal(
  value: unknown,
  expected: string,
  path: string,
  issues: KpQuadraticPresentationProfileIssue[]
): void {
  if (value !== expected) issues.push(issue(path, `Expected ${expected}.`));
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(path: string, message: string): KpQuadraticPresentationProfileIssue {
  return Object.freeze({ path, message });
}
