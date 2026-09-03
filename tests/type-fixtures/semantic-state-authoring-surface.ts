import type {
  KpSemanticStateBindableOperationLeafHandle,
  KpSemanticStateDerivedOperationLeafHandle,
  KpSemanticStateOptionalOperationLeafHandle,
  KpSemanticStateWritableOperationLeafHandle
} from "../../src/semantic-state/authoring-state-transform.ts";
import type { KpSemanticStateDerivationDefinition } from
  "../../src/semantic-state/authoring-derived-definition.ts";
import type { KpSemanticStateLeafHandle } from
  "../../src/semantic-state/authoring-state-handles.ts";

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
declare const equilibrium: KpSemanticStateDerivedOperationLeafHandle<number>;
declare const equilibriumDefinition: KpSemanticStateDerivationDefinition<
  number,
  readonly [KpSemanticStateLeafHandle<SupplyCurve>]
>;
declare const invalidEquilibriumDefinition: KpSemanticStateDerivationDefinition<
  string,
  readonly [KpSemanticStateLeafHandle<SupplyCurve>]
>;

supply.update(previous => ({
  kind: "supply",
  intercept: previous.intercept + 1
}));
supply.bind(supplySource);
supply.bindCopy(supplySource);
policy.introduce(2);
policy.remove();
equilibrium.derive(equilibriumDefinition);

// @ts-expect-error Binding retains the target leaf's domain value type.
supply.bind(demandSource);

// @ts-expect-error Derived handles remain read-only.
equilibrium.update(previous => previous);

// @ts-expect-error Derived replacement preserves the declared result type.
equilibrium.derive(invalidEquilibriumDefinition);
