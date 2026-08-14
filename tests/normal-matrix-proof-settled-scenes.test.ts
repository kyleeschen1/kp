import assert from "node:assert/strict";
import test from "node:test";

import { kpNormalMatrixProofCheckpointIds } from
  "../src/semantic/normal-matrix-proof-checkpoints.ts";
import { kpNormalMatrixProofSemanticRegistry } from
  "../src/semantic/normal-matrix-proof-semantics.ts";
import {
  kpNormalMatrixProofSettledScenes,
  renderKpNormalMatrixProofSettledStageHtml
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-settled-scenes.ts";

test("all six proof checkpoints own one native settled scene", () => {
  assert.deepEqual(
    kpNormalMatrixProofSettledScenes.map(({ checkpointId }) => checkpointId),
    kpNormalMatrixProofCheckpointIds
  );
  assert.equal(new Set(kpNormalMatrixProofSettledScenes.map(
    ({ checkpointId }) => checkpointId
  )).size, 6);
  assert.ok(kpNormalMatrixProofSettledScenes.every(
    ({ matrixLatex, evidenceLatex }) =>
      matrixLatex.length > 0 && evidenceLatex.length > 0
  ));
});

test("settled stage uses native KaTeX and a single stable matrix lane", () => {
  const html = renderKpNormalMatrixProofSettledStageHtml();

  assert.equal(
    html.split("data-kp-normal-proof-settled-scene=").length - 1,
    6
  );
  assert.equal(
    html.split("data-kp-normal-proof-matrix-footprint").length - 1,
    6
  );
  assert.equal(html.split('class="katex-mathml"').length - 1, 12);
  assert.equal(html.split("<math").length - 1, 12);
  assert.equal(html.split(" hidden").length - 1, 5);
  assert.match(html, /data-kp-normal-proof-active-checkpoint="statement"/u);
  assert.doesNotMatch(html, /<script|katex\.render|translate|scale|opacity/iu);
});

test("settled proof math retains the stable block decomposition", () => {
  for (const scene of kpNormalMatrixProofSettledScenes) {
    assert.match(scene.matrixLatex, /M=\\begin\{bmatrix\}/u);
    assert.match(scene.matrixLatex, /\\lambda/u);
    assert.match(scene.matrixLatex, /B/u);
  }
  assert.match(
    kpNormalMatrixProofSettledScenes.find(
      ({ checkpointId }) => checkpointId === "remainder-zero"
    )?.matrixLatex ?? "",
    /=\\lambda\\oplus B/u
  );
});

test("authored fragment bindings resolve semantic identity before KaTeX paint", () => {
  const semanticAddresses = new Set(
    kpNormalMatrixProofSemanticRegistry.map(({ address }) => address)
  );
  const bindingIds = new Set<string>();

  for (const scene of kpNormalMatrixProofSettledScenes) {
    for (const binding of [...scene.matrix.bindings, ...scene.evidence.bindings]) {
      assert.ok(semanticAddresses.has(binding.semanticEntityId));
      assert.equal(bindingIds.has(binding.id), false, binding.id);
      bindingIds.add(binding.id);
      assert.match(binding.motionId, /^normal-proof\./u);
      assert.ok(binding.glyphKey.length > 0);
    }
  }
  assert.ok(bindingIds.size >= 40);
});

test("rendered wrappers carry authored paths without KaTeX-shape authority", () => {
  const html = renderKpNormalMatrixProofSettledStageHtml();

  assert.match(html, /data-kp-normal-proof-path="normal-proof\/matrix\/eigenvalue"/u);
  assert.match(html, /data-kp-normal-proof-glyph-key="row-remainder"/u);
  assert.doesNotMatch(html, /\.mord|nth-child|query-order/iu);
});
