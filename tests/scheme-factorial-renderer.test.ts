import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-canonical-timeline.ts";
import { projectKpSchemeFactorialResponsiveFrame } from
  "../src/animation/scheme-factorial-responsive-projection.ts";
import {
  sampleKpSchemeFactorialTimeline,
  seekKpSchemeFactorialCheckpoint
} from "../src/animation/scheme-factorial-timeline.ts";
import {
  kpSchemeFactorialCss,
  renderKpSchemeFactorialHtml
} from "../src/rendering/scheme-factorial-html.ts";
import { kpSchemeFactorialCheckpoints } from
  "../src/semantic/scheme-factorial-checkpoints.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";

const document = parseKpSchemeFactorialSource();

function render(progress: number, reducedMotion = false): string {
  const sample = sampleKpSchemeFactorialTimeline({
    timeline: kpSchemeFactorialTimeline,
    progress
  });
  const frame = projectKpSchemeFactorialResponsiveFrame({
    document,
    checkpoints: kpSchemeFactorialCheckpoints,
    sample,
    availableWidthPx: 760,
    reducedMotion
  });
  return renderKpSchemeFactorialHtml({
    checkpoints: kpSchemeFactorialCheckpoints,
    sample,
    frame,
    reducedMotion
  });
}

test("renders every semantic checkpoint as native searchable code", () => {
  for (const checkpoint of kpSchemeFactorialCheckpoints.checkpoints) {
    const progress = seekKpSchemeFactorialCheckpoint(
      kpSchemeFactorialTimeline,
      checkpoint.id
    );
    const html = render(progress);
    for (const material of checkpoint.material) {
      assert.match(html, new RegExp(escapeRegex(escapeHtml(material.nativeCode))));
    }
    assert.equal(count(html, "data-kp-scheme-paint-owner="), 1);
    assert.equal(count(html, "data-kp-scheme-transient-overlay"), 0);
    assert.match(html, /data-kp-scheme-native-layer/);
  }
});

test("uses one inert text-free overlay only during motion", () => {
  const motion = render(0.2);
  assert.equal(count(motion, "data-kp-scheme-paint-owner="), 1);
  assert.equal(count(motion, "data-kp-scheme-transient-overlay"), 1);
  assert.match(motion, /data-kp-scheme-transient-overlay[^>]+aria-hidden="true" inert/);
  const svg = motion.match(/<svg[\s\S]*?<\/svg>/u)?.[0] ?? "";
  assert.match(svg, /<path/u);
  assert.doesNotMatch(svg, /<text|<foreignObject|<code/u);
  assert.match(motion, /<code>/u);
});

test("removes transient overlays for reduced motion and settled holds", () => {
  assert.equal(count(render(0.2, true), "data-kp-scheme-transient-overlay"), 0);
  assert.equal(count(render(0.282609), "data-kp-scheme-transient-overlay"), 0);
});

test("keeps source and runtime identities on native material", () => {
  const html = render(0.2);
  assert.match(html, /data-kp-scheme-source-ids="scheme-source\.factorial-3/u);
  assert.match(html, /data-kp-scheme-material-kind="parameter-cell"/u);
  assert.match(html, /data-kp-scheme-runtime-ids="scheme-factorial\.binding\./u);
  assert.doesNotMatch(kpSchemeFactorialCss, /animation\s*:|transition\s*:/u);
  assert.match(kpSchemeFactorialCss, /user-select: text/u);
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
