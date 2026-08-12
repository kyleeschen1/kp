import { projectKpSchemeFactorialResponsiveFrame } from
  "../../animation/scheme-factorial-responsive-projection.ts";
import {
  defineKpSchemeFactorialFirstExpansion,
  type KpSchemeFirstExpansion
} from "../../animation/scheme-factorial-first-expansion.ts";
import {
  defineKpSchemeFactorialChoreography,
  type KpSchemeFactorialChoreography
} from "../../animation/scheme-factorial-choreography.ts";
import { projectKpSchemeFactorialMotion } from
  "../../animation/scheme-factorial-motion-projection.ts";
import {
  sampleKpSchemeFactorialTimeline,
  type KpSchemeFactorialTimeline
} from "../../animation/scheme-factorial-timeline.ts";
import {
  renderKpSchemeFactorialHtml
} from "../../rendering/scheme-factorial-html.ts";
import type { KpSchemeCheckpointProjection } from
  "../../semantic/scheme-factorial-checkpoint-projector.ts";
import type { KpSchemeSourceDocument } from
  "../../semantic/scheme-factorial-source-model.ts";
import { renderKpTutorialScrubBar } from
  "../kp-tutorial-scrub-bar-renderer.ts";
import { kpSchemeFactorialTutorialPath } from "./scheme-factorial-route.ts";

export interface KpSchemeFactorialPublicationArtifact {
  readonly schemaVersion: "kp.scheme-factorial-publication.v3";
  readonly checkpoints: KpSchemeCheckpointProjection;
  readonly timeline: KpSchemeFactorialTimeline;
  readonly choreography: KpSchemeFactorialChoreography;
  readonly firstExpansion: KpSchemeFirstExpansion;
}

export function defineKpSchemeFactorialPublicationArtifact(input: {
  readonly checkpoints: KpSchemeCheckpointProjection;
  readonly timeline: KpSchemeFactorialTimeline;
  readonly choreography: KpSchemeFactorialChoreography;
  readonly firstExpansion: KpSchemeFirstExpansion;
}): KpSchemeFactorialPublicationArtifact {
  if (input.checkpoints.checkpoints.length !== 7 ||
      input.timeline.intervals.length !== 6) {
    throw new Error("Factorial publication requires seven checkpoints and six beats.");
  }
  const checkpointIds = new Set(input.checkpoints.checkpoints.map(({ id }) => id));
  for (const id of Object.keys(input.timeline.checkpointSeeks)) {
    if (!checkpointIds.has(id)) {
      throw new Error(`Timeline seek ${id} has no publication checkpoint.`);
    }
  }
  return deepFreeze({
    schemaVersion: "kp.scheme-factorial-publication.v3",
    checkpoints: input.checkpoints,
    timeline: input.timeline,
    choreography: defineKpSchemeFactorialChoreography(input.choreography),
    firstExpansion: defineKpSchemeFactorialFirstExpansion(input.firstExpansion)
  });
}

export function readKpSchemeFactorialPublicationArtifact(
  ownerDocument: Document
): KpSchemeFactorialPublicationArtifact {
  const source = ownerDocument.querySelector<HTMLScriptElement>(
    "script[data-kp-scheme-factorial-publication]"
  );
  if (source === null || source.textContent === null) {
    throw new Error("Scheme factorial publication data is missing.");
  }
  const parsed: unknown = JSON.parse(source.textContent);
  if (!isRecord(parsed) ||
      parsed["schemaVersion"] !== "kp.scheme-factorial-publication.v3" ||
      !isRecord(parsed["checkpoints"]) || !isRecord(parsed["timeline"]) ||
      !isRecord(parsed["choreography"]) ||
      !isRecord(parsed["firstExpansion"])) {
    throw new Error("Scheme factorial publication data has an invalid schema.");
  }
  return defineKpSchemeFactorialPublicationArtifact({
    checkpoints: parsed["checkpoints"] as unknown as KpSchemeCheckpointProjection,
    timeline: parsed["timeline"] as unknown as KpSchemeFactorialTimeline,
    choreography: parsed["choreography"] as unknown as KpSchemeFactorialChoreography,
    firstExpansion: parsed["firstExpansion"] as unknown as KpSchemeFirstExpansion
  });
}

export function serializeKpSchemeFactorialPublicationArtifact(
  artifact: KpSchemeFactorialPublicationArtifact
): string {
  return JSON.stringify(artifact).replaceAll("<", "\\u003c");
}

export function renderKpSchemeFactorialStaticPublication(input: {
  readonly document: KpSchemeSourceDocument;
  readonly artifact: KpSchemeFactorialPublicationArtifact;
  readonly availableWidthPx?: number | undefined;
}): string {
  const sample = sampleKpSchemeFactorialTimeline({
    timeline: input.artifact.timeline,
    progress: 0
  });
  const frame = projectKpSchemeFactorialResponsiveFrame({
    document: input.document,
    checkpoints: input.artifact.checkpoints,
    sample,
    availableWidthPx: input.availableWidthPx ?? 720,
    reducedMotion: true
  });
  const motion = projectKpSchemeFactorialMotion({
    choreography: input.artifact.choreography,
    timeline: sample
  });
  const stage = renderKpSchemeFactorialHtml({
    checkpoints: input.artifact.checkpoints,
    sample,
    frame,
    motion,
    reducedMotion: true
  });
  const checkpoints = input.artifact.checkpoints.checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    label: checkpoint.caption,
    progress: input.artifact.timeline.checkpointSeeks[checkpoint.id]!,
    href: `${kpSchemeFactorialTutorialPath}#kp-checkpoint-${checkpoint.id}`
  }));
  const scrubber = renderKpTutorialScrubBar({
    blockId: "scheme-factorial",
    label: "Factorial evaluation timeline",
    checkpoints
  });
  const transcript = input.artifact.checkpoints.checkpoints.map((checkpoint) =>
    `<li id="kp-checkpoint-${escapeAttribute(checkpoint.id)}" data-kp-scheme-checkpoint-transcript="${escapeAttribute(checkpoint.id)}"><a href="#kp-checkpoint-${escapeAttribute(checkpoint.id)}">${escapeHtml(checkpoint.caption)}</a></li>`
  ).join("");
  return `<main class="kp-scheme-factorial-publication" data-kp-scheme-factorial-publication>
    <header class="kp-scheme-factorial-publication__header">
      <p class="kp-scheme-factorial-publication__eyebrow">A small Scheme story</p>
      <h1>How does <code>(factorial 3)</code> come back?</h1>
      <p>The definition descends toward its base case, leaving multiplication behind. Then one value returns through the waiting work.</p>
    </header>
    <figure class="kp-scheme-factorial-publication__figure">
      <div data-kp-scheme-factorial-stage-host>${stage}</div>
      <figcaption data-kp-scheme-factorial-caption>${escapeHtml(input.artifact.timeline.initialCaption)}</figcaption>
    </figure>
    <div class="kp-scheme-factorial-publication__controls">${scrubber}</div>
    <details class="kp-scheme-factorial-publication__transcript">
      <summary>Evaluation outline</summary>
      <ol>${transcript}</ol>
    </details>
    <footer><a href="/?view=animation-library-host">Open the animation library</a></footer>
  </main>`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
