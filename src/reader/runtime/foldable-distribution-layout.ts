import type {
  KpFoldableDistributionProjection
} from "../../semantic/foldable-distribution-fold-projection.ts";

export type KpFoldableDistributionViewport = "wide" | "phone";

export interface KpFoldableDistributionLayoutRow {
  readonly id: string;
  readonly envelopeIds: readonly string[];
  readonly role: "single-equation" | "left-branch" | "right-branch" |
    "coefficient-group" | "constant-group" | "result";
}

export interface KpFoldableDistributionPhaseLayout {
  readonly nodeId: string;
  readonly policy: "single-row" | "semantic-two-row-stage";
  readonly rows: readonly KpFoldableDistributionLayoutRow[];
  readonly lineChangeReason?: "viewport-semantic-staging" | undefined;
}

export interface KpFoldableDistributionLayoutPlan {
  readonly schemaVersion: "kp.foldable-distribution-layout.v1";
  readonly viewport: KpFoldableDistributionViewport;
  readonly phases: readonly KpFoldableDistributionPhaseLayout[];
  readonly geometryAuthority: "native-measurement";
  readonly operationSpecificCoordinates: false;
}

export function planKpFoldableDistributionLayout(input: {
  readonly projection: KpFoldableDistributionProjection;
  readonly viewport: KpFoldableDistributionViewport;
}): KpFoldableDistributionLayoutPlan {
  const phone = input.viewport === "phone";
  const collapsed = new Set(input.projection.collapsedNodeIds);
  const phases = Object.freeze([
    phase(
      "evaluation.foldable-distribution.distribute",
      phone && !collapsed.has("evaluation.foldable-distribution.distribute")
        ? branchRows("factored", "raw")
        : singleRow("factored", "raw")
    ),
    phase(
      "evaluation.foldable-distribution.evaluate-products",
      phone &&
        !collapsed.has("evaluation.foldable-distribution.evaluate-products")
        ? branchRows("raw", "distributed")
        : singleRow("raw", "distributed")
    ),
    phase(
      "transform.foldable-distribution.group-like-terms",
      singleRow("distributed", "grouped")
    ),
    phase(
      "transform.foldable-distribution.factor-common-x",
      singleRow("grouped", "coefficient-factored")
    ),
    phase(
      "transform.foldable-distribution.collect-results",
      singleRow("coefficient-factored", "collected.result")
    )
  ].map(({ nodeId, rows }) => Object.freeze({
    nodeId,
    policy: rows.length === 1
      ? "single-row" as const
      : "semantic-two-row-stage" as const,
    rows: Object.freeze(rows),
    ...(rows.length === 1
      ? {}
      : { lineChangeReason: "viewport-semantic-staging" as const })
  })));

  return Object.freeze({
    schemaVersion: "kp.foldable-distribution-layout.v1" as const,
    viewport: input.viewport,
    phases,
    geometryAuthority: "native-measurement" as const,
    operationSpecificCoordinates: false as const
  });
}

function phase(
  nodeId: string,
  rows: readonly KpFoldableDistributionLayoutRow[]
) {
  return { nodeId, rows };
}

function branchRows(
  sourceState: "factored" | "raw",
  targetState: "raw" | "distributed"
): readonly KpFoldableDistributionLayoutRow[] {
  return [
    row(
      "left",
      [
        `layout.foldable-distribution.${sourceState}.left-branch`,
        `layout.foldable-distribution.${targetState}.left-branch`
      ],
      "left-branch"
    ),
    row(
      "right",
      [
        `layout.foldable-distribution.${sourceState}.right-branch`,
        `layout.foldable-distribution.${targetState}.right-branch`
      ],
      "right-branch"
    )
  ];
}

function singleRow(
  ...states: readonly string[]
): readonly KpFoldableDistributionLayoutRow[] {
  return [
    row(
      "equation",
      states.map((state) => `layout.foldable-distribution.${state}`),
      "single-equation"
    )
  ];
}

function row(
  suffix: string,
  envelopeIds: readonly string[],
  role: KpFoldableDistributionLayoutRow["role"]
): KpFoldableDistributionLayoutRow {
  return Object.freeze({
    id: `row.foldable-distribution.${suffix}`,
    envelopeIds: Object.freeze([...envelopeIds]),
    role
  });
}
