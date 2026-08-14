import assert from "node:assert/strict";
import test from "node:test";

import { kpNormalMatrixProofCheckpointIds } from
  "../src/semantic/normal-matrix-proof-checkpoints.ts";
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
