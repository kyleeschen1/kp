import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAnimationAsset } from "../src/animation/asset.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  checkKpCatalogPackPurity,
  checkKpCompatibilityClassification,
  checkKpRuntimeAuthorityClassification
} from "../src/architecture/pre-expansion-health.ts";
import { kpRuntimeAuthorityInventory } from "../src/architecture/runtime-authority-inventory.ts";
import {
  checkKpSemanticAnimationImports
} from "../src/architecture/semantic-animation-import-fitness.ts";

test("negative health fixtures reject every named regression family", () => {
  const readerClock = kpRuntimeAuthorityInventory.find(
    ({ id }) => id === "runtime.reader-clock-arbitration"
  )!;
  assert.deepEqual(
    checkKpRuntimeAuthorityClassification([
      ...kpRuntimeAuthorityInventory,
      { ...readerClock, id: "runtime.synthetic-second-clock" }
    ]),
    ["second playback-clock for one mounted reader session"]
  );

  assert.deepEqual(checkKpCatalogPackPurity([{
    path: "src/animation/catalog-packs/synthetic.ts",
    source:
      'import "../../editor/synthetic-surface-register.ts";\n' +
      "registerKpSyntheticSurface();\n"
  }]), [
    "src/animation/catalog-packs/synthetic.ts: catalog data imports editor capability code",
    "src/animation/catalog-packs/synthetic.ts: catalog data registers a capability on import"
  ]);

  const animation = createLinearSolveAnimationAsset();
  assert.match(validateKpAnimationAsset({
    ...animation,
    metadata: {
      ...animation.metadata,
      equationMotionPresentationRecipe: "continuity-v1"
    }
  })[0]?.message ?? "", /unsupported; author presentationProfile instead/);

  assert.deepEqual(checkKpCompatibilityClassification([{
    id: "compatibility.synthetic",
    status: "unclassified"
  }]), ["compatibility.synthetic: compatibility status is unclassified"]);

  assert.deepEqual(checkKpSemanticAnimationImports([{
    path: "src/animation/synthetic-policy.ts",
    source: 'import { paint } from "../rendering/synthetic-painter.ts";'
  }], []), [{
    sourceFile: "src/animation/synthetic-policy.ts",
    specifier: "../rendering/synthetic-painter.ts",
    kind: "unapproved-rendering-import",
    message:
      "Semantic and renderer-neutral animation code may not add rendering dependencies."
  }]);
});
