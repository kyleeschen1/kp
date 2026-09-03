import type { KpSemanticStateEntityDescriptor } from
  "../../src/semantic/semantic-state-authority-adapter.ts";
import { createKpSemanticStateIdentityScope } from
  "../../src/semantic-state/identity.ts";

const identities = createKpSemanticStateIdentityScope("fixture.authority-adapter");
const descriptor: KpSemanticStateEntityDescriptor = {
  entityId: identities.entity("market"),
  semanticKind: "market",
  label: "Market",
  provenance: { kind: "authored", sourceId: "fixture.market" }
};
void descriptor;

const invalidDescriptor: KpSemanticStateEntityDescriptor = {
  // @ts-expect-error Authority descriptors require semantic entity identity.
  entityId: identities.slot("market"),
  semanticKind: "market",
  label: "Market"
};
void invalidDescriptor;
