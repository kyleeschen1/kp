import assert from "node:assert/strict";
import test from "node:test";

import {
  economicsEquilibriumAnimationId
} from "../src/animation/economics-equilibrium-adapter.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEconomicsDemandShiftAnimationCapability
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-animation-capability.ts";

test("economics publication capability matches canonical catalogue metadata", () => {
  const capability = createKpEconomicsDemandShiftAnimationCapability();
  const descriptors = createKpEditorAnimationLibrary();
  const canonicalDescriptor = descriptors.find(
    ({ animationId }) => animationId === economicsEquilibriumAnimationId
  );
  const canonicalEntry = createKpAnimationCatalogueProjection({ descriptors })
    .entries.find(
      ({ animationId }) => animationId === economicsEquilibriumAnimationId
    );

  assert.deepEqual(capability.descriptor, canonicalDescriptor);
  assert.deepEqual(capability.entry, canonicalEntry);
  assert.equal(capability.descriptors.length, 1);
});
