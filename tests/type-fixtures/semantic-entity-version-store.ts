import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore
} from "../../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../../src/semantic-state/identity.ts";

const identities = createKpSemanticStateIdentityScope("fixture.version-store");
const entityId = identities.entity("market");
const store = createKpSemanticEntityVersionStore({
  identities,
  entityId,
  value: { tax: 0, curve: { slope: 2 } },
  sourceId: "fixture.market"
});
const successor = appendKpSemanticEntityVersion(store, {
  value: { tax: 4, curve: { slope: 2 } },
  transformationId: identities.appliedTransformation(
    identities.transformation("add-tax"),
    0
  )
});

// @ts-expect-error Committed values are deeply readonly.
successor.versions[1]!.value.curve.slope = 3;
createKpSemanticEntityVersionStore({
  identities,
  entityId,
  // @ts-expect-error Executable closures are not persistent semantic data.
  value: { evaluate: () => 1 },
  sourceId: "fixture.executable"
});
