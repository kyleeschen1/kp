import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import type {
  KpExactFractionQuantityTrace
} from "./exact-fraction-quantity-trace.ts";

declare const kpExactFractionViewBundleBrand: unique symbol;

const sealedViewBundles = new WeakSet<object>();

// Keep the required-view union explicit at the authoring boundary. Inferring
// through the manifest import can widen to `string` under NodeNext project
// references, which would silently turn the mapped set into an index signature
// and let a missing representation typecheck.
export type KpExactFractionQuantityViewKind =
  | "symbolic"
  | "partitioned-circle"
  | "fraction-bar"
  | "number-line";

export interface KpExactFractionQuantityViewProjection<
  ViewKind extends KpExactFractionQuantityViewKind
> {
  readonly schemaVersion: "kp.exact-fraction-quantity-view-projection.v1";
  readonly kind: ViewKind;
  readonly traceId: string;
  readonly stateIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly semanticSelectionIds: readonly string[];
  readonly accessibleSummary: string;
}

export type KpExactFractionQuantityProjectionSet = {
  readonly [ViewKind in KpExactFractionQuantityViewKind]:
    KpExactFractionQuantityViewProjection<ViewKind>;
};

export interface KpExactFractionQuantityViewBundle {
  readonly schemaVersion: "kp.exact-fraction-quantity-view-bundle.v1";
  readonly traceId: string;
  readonly projections: KpExactFractionQuantityProjectionSet;
  readonly [kpExactFractionViewBundleBrand]: true;
}

export function createKpExactFractionQuantityViewObligation<
  ViewKind extends KpExactFractionQuantityViewKind
>(
  kind: ViewKind,
  trace: KpExactFractionQuantityTrace,
  accessibleSummary: string
): KpExactFractionQuantityViewProjection<ViewKind> {
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-view-projection.v1",
    kind,
    traceId: trace.id,
    stateIds: Object.freeze(trace.states.map(({ id }) => id)),
    checkpointIds: Object.freeze(
      trace.states.map(({ checkpointId }) => checkpointId)
    ),
    semanticSelectionIds: Object.freeze(uniqueStrings(
      trace.states.flatMap(({ selections }) =>
        selections.map(({ selectionId }) => selectionId)
      )
    )),
    accessibleSummary
  });
}

export function certifyKpExactFractionQuantityViewBundle(
  trace: KpExactFractionQuantityTrace,
  projections: KpExactFractionQuantityProjectionSet
): KpExactFractionQuantityViewBundle {
  const requiredKinds =
    manifest.viewObligations as readonly KpExactFractionQuantityViewKind[];
  const actualKinds = Object.keys(projections);
  if (
    actualKinds.length !== requiredKinds.length ||
    actualKinds.some((kind) => !requiredKinds.includes(
      kind as KpExactFractionQuantityViewKind
    ))
  ) {
    throw new Error(
      "Exact fraction view bundle must contain every required view exactly once."
    );
  }
  const expectedStateIds = trace.states.map(({ id }) => id);
  const expectedCheckpointIds = trace.states.map(
    ({ checkpointId }) => checkpointId
  );
  const expectedSelectionIds = uniqueStrings(
    trace.states.flatMap(({ selections }) =>
      selections.map(({ selectionId }) => selectionId)
    )
  );
  for (const kind of requiredKinds) {
    const projection = projections[kind];
    if (projection === undefined) {
      throw new Error(`Exact fraction view bundle is missing ${kind}.`);
    }
    if (projection.kind !== kind) {
      throw new Error(
        `Exact fraction ${kind} projection reports kind ${projection.kind}.`
      );
    }
    if (projection.traceId !== trace.id) {
      throw new Error(
        `Exact fraction ${kind} projection belongs to another trace.`
      );
    }
    assertSameSequence(
      projection.stateIds,
      expectedStateIds,
      `${kind} state identity`
    );
    assertSameSequence(
      projection.checkpointIds,
      expectedCheckpointIds,
      `${kind} checkpoint identity`
    );
    assertSameSequence(
      projection.semanticSelectionIds,
      expectedSelectionIds,
      `${kind} selection identity`
    );
    if (projection.accessibleSummary.trim().length === 0) {
      throw new Error(
        `Exact fraction ${kind} projection requires an accessible summary.`
      );
    }
  }
  // A sealed bundle is the only value later promotion gates accept. Authors
  // cannot replace the mapped type with an optional dictionary.
  const bundle = Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-view-bundle.v1",
    traceId: trace.id,
    projections: Object.freeze({ ...projections })
  });
  sealedViewBundles.add(bundle);
  return bundle as KpExactFractionQuantityViewBundle;
}

export function isKpExactFractionQuantityViewBundle(
  value: unknown
): value is KpExactFractionQuantityViewBundle {
  return typeof value === "object" &&
    value !== null &&
    sealedViewBundles.has(value);
}

function assertSameSequence(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): void {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(`${label} must match the verified trace.`);
  }
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
