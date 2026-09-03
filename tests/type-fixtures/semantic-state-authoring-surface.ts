import type {
  KpSemanticStateBindableOperationLeafHandle,
  KpSemanticStateOperationLeafHandle,
  KpSemanticStateOptionalOperationLeafHandle,
  KpSemanticStateWritableOperationLeafHandle
} from "../../src/semantic-state/authoring-state-transform.ts";

interface SupplyCurve {
  readonly kind: "supply";
  readonly intercept: number;
}

interface DemandCurve {
  readonly kind: "demand";
  readonly intercept: number;
}

// Keep cumulative inference pressure representative and bounded; exhaustive
// negative contracts remain in tests/type-contracts under the full typecheck.
declare const supply: KpSemanticStateWritableOperationLeafHandle<SupplyCurve>;
declare const supplySource:
  KpSemanticStateBindableOperationLeafHandle<SupplyCurve>;
declare const demandSource:
  KpSemanticStateBindableOperationLeafHandle<DemandCurve>;
declare const policy: KpSemanticStateOptionalOperationLeafHandle<number>;
declare const equilibrium: KpSemanticStateOperationLeafHandle<number>;

supply.update(previous => ({
  kind: "supply",
  intercept: previous.intercept + 1
}));
supply.bind(supplySource);
supply.bindCopy(supplySource);
policy.introduce(2);
policy.remove();

// @ts-expect-error Binding retains the target leaf's domain value type.
supply.bind(demandSource);

// @ts-expect-error Derived handles remain read-only.
equilibrium.update(previous => previous);
