import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { compileKpLlmAnimationDraft } from "../src/animation/llm-animation-draft-compiler.ts";
import {
  acceptedGeneratedPipelineDiagramDraft,
  createAcceptedGeneratedPipelineDiagramAnimationAsset
} from "../src/animation/llm-diagram-draft-example.ts";
import { createKpEditorAnimationDescriptor } from "../src/editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { renderDiagramAnimation } from "../src/editor/diagram-svg-adapter.ts";

test("generated diagram draft compiles through the shared LLM animation compiler", () => {
  const result = compileKpLlmAnimationDraft(acceptedGeneratedPipelineDiagramDraft);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.transitionIrs.length, 0);
  assert.equal(result.diagramTransitions.length, 1);
  assert.deepEqual(result.diagramTransitions[0]?.correspondenceMap.records.map(
    (record) => record.relation
  ), ["identity", "identity", "identity", "introduction", "fan-out", "removal", "introduction"]);
});

test("generated semantic diagram is catalogued and sampled on the shared player clock", () => {
  const animation = createAcceptedGeneratedPipelineDiagramAnimationAsset();
  assert.ok(createKpAnimationAssets().some((candidate) => candidate.id === animation.id));
  const descriptor = createKpEditorAnimationDescriptor({
    animationId: animation.id,
    title: animation.title,
    summary: animation.title,
    renderTargetKinds: ["diagram"],
    durationMs: animation.timeline?.durationMs
  });
  const state = createKpEditorAnimationPlayerState({
    animation,
    descriptor,
    direction: "forward",
    progress: 0.5
  });
  const svg = renderDiagramAnimation(animation, state);
  assert.match(svg, /data-kp-editor-diagram-progress="0.5"/);
  assert.match(svg, /data-kp-diagram-relation="introduction"/);
  assert.match(svg, /data-kp-diagram-relation="fan-out"/);
  assert.match(svg, /data-kp-diagram-opacity="0.5"/);
});

test("generated diagram mirrors local progress during rewind", () => {
  const animation = createAcceptedGeneratedPipelineDiagramAnimationAsset();
  const descriptor = createKpEditorAnimationDescriptor({
    animationId: animation.id,
    title: animation.title,
    summary: animation.title,
    renderTargetKinds: ["diagram"]
  });
  const state = createKpEditorAnimationPlayerState({
    animation,
    descriptor,
    direction: "rewind",
    progress: 0.75
  });
  const svg = renderDiagramAnimation(animation, state);
  assert.match(svg, /data-kp-editor-diagram-progress="0.25"/);
  assert.match(svg, /data-kp-editor-diagram-direction="rewind"/);
});
