import {
  createKpSemanticDerivedBindingDeclaration
} from "../../src/semantic-state/derived-binding.ts";
import {
  createKpSemanticStateIdentityScope,
  type KpSemanticDerivationId
} from "../../src/semantic-state/identity.ts";

const identities = createKpSemanticStateIdentityScope("fixture.derived");
const inputSlot = identities.slot("input");
const outputSlot = identities.slot("output");
const derivationId = identities.derivation("double-input");

createKpSemanticDerivedBindingDeclaration({
  identities,
  derivationId,
  slotId: outputSlot,
  dependencySlotIds: [inputSlot],
  sourceId: "fixture.double-input"
});

// @ts-expect-error Derivation identities cannot be substituted with slot IDs.
const invalidDerivationId: KpSemanticDerivationId = outputSlot;
void invalidDerivationId;

createKpSemanticDerivedBindingDeclaration({
  identities,
  derivationId,
  slotId: outputSlot,
  // @ts-expect-error Dependencies must be semantic slot references.
  dependencySlotIds: [identities.entity("input")],
  sourceId: "fixture.invalid-dependency"
});
