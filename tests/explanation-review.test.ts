import assert from "node:assert/strict";
import test from "node:test";
import { reviewGradientExplanation } from "../scripts/review-gradient-explanation.ts";
import { gradientContourBeats, type GradientStoryBeat } from "../src/tutorial/gradient-contour/gradient-contour-story.ts";
import { checkCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-author-check.ts";
import { createCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-evidence.ts";

test("accepted gradient, harmless paraphrase and independent direction order produce no structural alarms", () => {
  const paraphrase = gradientContourBeats.map(beat => ({ ...beat, title: `Consider: ${beat.title}` }));
  const reordered = [...paraphrase];
  const east = reordered.findIndex(beat => beat.slug === "east"), north = reordered.findIndex(beat => beat.slug === "north");
  [reordered[east], reordered[north]] = [reordered[north]!, reordered[east]!];
  for (const beats of [gradientContourBeats, paraphrase, reordered]) {
    assert.deepEqual(reviewGradientExplanation(beats).findings, []);
    assert.equal(reviewGradientExplanation(beats).editorialStatus, "not-assessed");
  }
});

test("missing prerequisites, duplicate identities, empty prose and native-math loss return located repairs", () => {
  const damaged: readonly GradientStoryBeat[][] = [
    gradientContourBeats.filter(beat => beat.slug !== "projection"),
    [...gradientContourBeats, gradientContourBeats[0]],
    gradientContourBeats.map(beat => beat.slug === "height" ? { ...beat, html: "" } : beat),
    gradientContourBeats.map(beat => beat.slug === "east" ? { ...beat, html: "The slope is two." } : beat),
    gradientContourBeats.map(beat => beat.slug === "height" ? { ...beat, evidence: "tangent" } : beat),
  ];
  for (const beats of damaged) {
    const review = reviewGradientExplanation(beats);
    assert.ok(review.findings.length > 0);
    assert.ok(review.findings.every(finding => finding.location && finding.defect && finding.repair));
  }
  assert.ok(reviewGradientExplanation(damaged[0]!).findings.some(finding => finding.location === "components" && finding.defect.includes("projection")));
});

test("plausible but unhelpful reasoning remains an editorial finding, not mechanical certification", () => {
  const beats = gradientContourBeats.map(beat => beat.slug === "general-projection"
    ? { ...beat, html: "<p>The gradient wins because the dot product says so.</p>" } : beat);
  assert.deepEqual(reviewGradientExplanation(beats).findings, []);
  assert.equal(reviewGradientExplanation(beats).editorialStatus, "not-assessed");
});

test("distinct code caller accepts editorial paraphrase but rejects damaged source pins and stage references", () => {
  const source = createCodeReasoningSource();
  for (const explanation of [source.explanation, "Extract the threshold decision, then have both callers use the helper.", "This proves every possible behavior is identical."]) {
    const result = checkCodeReasoningSource(JSON.stringify({ ...source, explanation }));
    assert.equal(result.status, "compiled");
    if (result.status === "compiled") assert.equal(result.editorialStatus, "editorial");
  }
  for (const sourceChange of [{ sourceRevisionId: "unreviewed" }, { stageIds: source.stageIds.slice(1) }]) {
    const result = checkCodeReasoningSource(JSON.stringify({ ...source, ...sourceChange }));
    assert.equal(result.status, "repair-gap");
    if (result.status === "repair-gap") assert.ok(result.diagnostic.path && result.diagnostic.expected);
  }
});
