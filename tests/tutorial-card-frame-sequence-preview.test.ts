import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialEquationFrameAdapter } from "../src/tutorial/equation-frame-adapter.ts";
import { sampleKpTutorialEquationFramesForExport } from "../src/tutorial/equation-frame-export-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";
import { createKpTutorialFrameSequenceArtifact } from "../src/tutorial/frame-sequence-artifact.ts";
import { renderKpTutorialFrameSequencePreviewHtml } from "../src/tutorial/frame-sequence-preview.ts";
import { createKpTutorialGraphFrameAdapter } from "../src/tutorial/graph-frame-adapter.ts";
import { sampleKpTutorialGraphFramesForExport } from "../src/tutorial/graph-frame-export-sampler.ts";
import { createAdditionProgrammingExecutionTraceTutorialCardSample } from "../src/tutorial/programming-execution-trace-card-sample.ts";
import { sampleKpTutorialProgrammingFramesForExport } from "../src/tutorial/programming-frame-export-sampler.ts";

test("frame sequence preview renders artifact metadata, json payload, and sampled frame rows", () => {
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest: createLinearSolveTutorialCardManifest(),
    parentTimeline: cardSampler.parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });
  const sequence = createKpTutorialFrameSequenceArtifact({
    contract,
    equationSequence: sampleKpTutorialEquationFramesForExport({
      contract,
      equationAdapter: createKpTutorialEquationFrameAdapter(cardSampler)
    }),
    graphSequence: sampleKpTutorialGraphFramesForExport({
      contract,
      graphAdapter: createKpTutorialGraphFrameAdapter(cardSampler)
    }),
    programmingSequence: sampleKpTutorialProgrammingFramesForExport({
      contract,
      programmingSample: createAdditionProgrammingExecutionTraceTutorialCardSample()
    })
  });
  const html = renderKpTutorialFrameSequencePreviewHtml({
    sequence,
    title: "Frame <Sequence> Preview"
  });

  assert.ok(html.startsWith("<!doctype html>"));
  assert.match(
    html,
    /<html lang="en" data-kp-export-artifact="artifact\.linear-solve\.gif\.frames"/
  );
  assert.match(html, /data-kp-export-kind="gif"/);
  assert.match(html, /data-kp-export-target="media"/);
  assert.match(html, /data-kp-export-status="renderable"/);
  assert.match(html, /<title>Frame &lt;Sequence&gt; Preview<\/title>/);
  assert.match(
    html,
    /<body data-kp-export-payload="json-document" data-kp-frame-sequence="frame-sequence\.frame-export\.tutorial\.linear-solve\.card\.gif"/
  );
  assert.match(
    html,
    /data-kp-frame-sequence-frame="frame-sequence\.timeline-linear-solve-shared\.0002"/
  );
  assert.match(html, /data-kp-frame-progress="0\.5"/);
  assert.match(html, /data-kp-frame-beat="25"/);
  assert.match(html, /data-kp-frame-domains="equation graph programming"/);
  assert.match(html, /Equation transition 1/);
  assert.match(html, /Graph progress 0\.5/);
  assert.match(html, /step\.programming\.add\.evaluate-return/);

  const match = html.match(
    /<script type="application\/json" data-kp-frame-sequence-json>([\s\S]*?)<\/script>/
  );

  assert.ok(match);
  assert.deepEqual(JSON.parse(match[1] ?? ""), sequence);
});
