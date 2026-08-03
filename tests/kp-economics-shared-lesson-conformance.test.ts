import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const economicsRoot = new URL(
  "../src/tutorial/economics-demand-shift/",
  import.meta.url
);

test("economics consumes shared lesson seams without compatibility wrappers", async () => {
  const [host, publication, motion, toc] = await Promise.all([
    read("KpEconomicsDemandShiftTutorial.svelte"),
    read("economics-demand-shift-publication.ts"),
    read("economics-demand-shift-motion-blocks.ts"),
    read("economics-demand-shift-toc.ts")
  ]);

  assert.match(host, /from "\.\.\/kp-tutorial-motion\.ts"/);
  assert.match(host, /createKpTutorialNavigationController/);
  assert.match(host, /KpTutorialLessonShell/);
  assert.doesNotMatch(host, /economics-demand-shift-scroll-(?:corridor|coordinator)/);
  assert.match(publication, /adaptKpEconomicsDemandShiftLessonDocument/);
  assert.match(publication, /compileKpTutorialPublicationControls/);
  assert.match(motion, /projectKpTutorialCumulativeMotion/);
  assert.doesNotMatch(toc, /createKpEconomicsDemandShiftToc|renderKpTutorialToc/);

  for (const superseded of [
    "economics-demand-shift-scroll-corridor.ts",
    "economics-demand-shift-scroll-coordinator.ts"
  ]) assert.equal(existsSync(new URL(superseded, economicsRoot)), false);
});

test("economics retains only its domain-specific projection boundary", async () => {
  const [checkpoints, composition, verification, stage] = await Promise.all([
    read("economics-demand-shift-checkpoints.ts"),
    read("economics-demand-shift-stage-composition.ts"),
    read("economics-demand-shift-verification.ts"),
    read("economics-demand-shift-verification-surface.ts")
  ]);
  assert.match(checkpoints, /KpEconomicsDemandShiftFocusProfile/);
  assert.match(composition, /KpEconomicsStageCompositionProjection/);
  assert.match(verification, /KpEconomicsVerificationRevealProjection/);
  assert.match(stage, /data-kp-economics-verification-group/);
});

function read(path: string): Promise<string> {
  return readFile(new URL(path, economicsRoot), "utf8");
}
