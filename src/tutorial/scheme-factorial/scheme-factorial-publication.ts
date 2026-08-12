import { projectKpSchemeFactorialResponsiveFrame } from
  "../../animation/scheme-factorial-responsive-projection.ts";
import {
  defineKpSchemeFactorialFirstExpansion,
  type KpSchemeFirstExpansion
} from "../../animation/scheme-factorial-first-expansion.ts";
import {
  defineKpSchemeFactorialFullEvaluation,
  sampleKpSchemeFactorialFullEvaluation,
  type KpSchemeFactorialFullEvaluation
} from "../../animation/scheme-factorial-full-evaluation.ts";
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
import {
  renderKpSchemeFactorialFullEvaluationHtml
} from
  "../../rendering/scheme-factorial-first-expansion-html.ts";
import type { KpSchemeCheckpointProjection } from
  "../../semantic/scheme-factorial-checkpoint-projector.ts";
import type { KpSchemeSourceDocument } from
  "../../semantic/scheme-factorial-source-model.ts";
import { renderKpTutorialScrubBar } from
  "../kp-tutorial-scrub-bar-renderer.ts";
import { kpSchemeFactorialTutorialPath } from "./scheme-factorial-route.ts";

export interface KpSchemeFactorialPublicationArtifact {
  readonly schemaVersion: "kp.scheme-factorial-publication.v5";
  readonly checkpoints: KpSchemeCheckpointProjection;
  readonly timeline: KpSchemeFactorialTimeline;
  readonly choreography: KpSchemeFactorialChoreography;
  readonly firstExpansion: KpSchemeFirstExpansion;
  readonly fullEvaluation: KpSchemeFactorialFullEvaluation;
}

export function defineKpSchemeFactorialPublicationArtifact(input: {
  readonly checkpoints: KpSchemeCheckpointProjection;
  readonly timeline: KpSchemeFactorialTimeline;
  readonly choreography: KpSchemeFactorialChoreography;
  readonly firstExpansion: KpSchemeFirstExpansion;
  readonly fullEvaluation: KpSchemeFactorialFullEvaluation;
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
    schemaVersion: "kp.scheme-factorial-publication.v5",
    checkpoints: input.checkpoints,
    timeline: input.timeline,
    choreography: defineKpSchemeFactorialChoreography(input.choreography),
    firstExpansion: defineKpSchemeFactorialFirstExpansion(input.firstExpansion),
    fullEvaluation: defineKpSchemeFactorialFullEvaluation(input.fullEvaluation)
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
      parsed["schemaVersion"] !== "kp.scheme-factorial-publication.v5" ||
      !isRecord(parsed["checkpoints"]) || !isRecord(parsed["timeline"]) ||
      !isRecord(parsed["choreography"]) ||
      !isRecord(parsed["firstExpansion"]) ||
      !isRecord(parsed["fullEvaluation"])) {
    throw new Error("Scheme factorial publication data has an invalid schema.");
  }
  return defineKpSchemeFactorialPublicationArtifact({
    checkpoints: parsed["checkpoints"] as unknown as KpSchemeCheckpointProjection,
    timeline: parsed["timeline"] as unknown as KpSchemeFactorialTimeline,
    choreography: parsed["choreography"] as unknown as KpSchemeFactorialChoreography,
    firstExpansion: parsed["firstExpansion"] as unknown as KpSchemeFirstExpansion,
    fullEvaluation: unpackFullEvaluation(parsed["fullEvaluation"])
  });
}

export function serializeKpSchemeFactorialPublicationArtifact(
  artifact: KpSchemeFactorialPublicationArtifact
): string {
  return JSON.stringify({
    ...artifact,
    fullEvaluation: packFullEvaluation(artifact.fullEvaluation)
  }).replaceAll("<", "\\u003c");
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

/**
 * Visual discovery defaults to one claim. The complete trace story remains a
 * linked alternate projection rather than competing with the exemplar.
 */
export function renderKpSchemeFactorialFocusPublication(input: {
  readonly artifact: KpSchemeFactorialPublicationArtifact;
}): string {
  const stage = renderKpSchemeFactorialFullEvaluationHtml({
    evaluation: input.artifact.fullEvaluation,
    sample: sampleKpSchemeFactorialFullEvaluation(
      input.artifact.fullEvaluation, 0)
  });
  return `<main class="kp-scheme-factorial-focus" data-kp-scheme-factorial-focus-publication>
    <header class="kp-scheme-factorial-focus__header">
      <p class="kp-scheme-factorial-focus__eyebrow">One recursive evaluation</p>
      <h1>Watch the calls open—and return.</h1>
    </header>
    <figure class="kp-scheme-factorial-focus__figure">
      <div data-kp-scheme-factorial-focus-stage-host>${stage}</div>
      <figcaption data-kp-scheme-factorial-focus-caption>Begin with <code>(factorial 3)</code>. Each call will open only when it becomes the active expression.</figcaption>
    </figure>
    <div class="kp-scheme-factorial-focus__transport" data-kp-scheme-factorial-focus-transport>
      <button type="button" data-action="focus-toggle" disabled>Play</button>
      <input type="range" min="0" max="1" step="0.001" value="0" data-action="focus-seek" aria-label="Scrub the complete factorial evaluation" disabled />
      <output data-focus-progress>0%</output>
    </div>
    <footer><a href="${kpSchemeFactorialTutorialPath}?view=full">Detailed factorial trace</a></footer>
  </main>`;
}

function packFullEvaluation(evaluation: KpSchemeFactorialFullEvaluation): object {
  const materials = new Map(evaluation.states.flatMap(({ tokens }) =>
    tokens.map((token) => [token.id, token] as const)));
  const materialList = [...materials.values()];
  const indexes = new Map(materialList.map((material, index) => [material.id, index]));
  return {
    packed: "kp.scheme-factorial-full-evaluation.pack.v1",
    schemaVersion: evaluation.schemaVersion,
    id: evaluation.id,
    materials: materialList.map(({ id, lexeme, provenance }) =>
      [id, lexeme, provenance]),
    states: evaluation.states.map(({ id, kind, nativeCode, tokens }) =>
      [id, kind, nativeCode, tokens.map(({ id: materialId, span }) =>
        [indexes.get(materialId), span.start, span.end])]),
    actions: evaluation.actions,
    transitions: evaluation.transitions,
    sourceStateId: evaluation.sourceStateId,
    targetStateId: evaluation.targetStateId,
    accessibleDescription: evaluation.accessibleDescription
  };
}

function unpackFullEvaluation(value: Record<string, unknown>):
  KpSchemeFactorialFullEvaluation {
  if (value["packed"] !== "kp.scheme-factorial-full-evaluation.pack.v1" ||
      !Array.isArray(value["materials"]) || !Array.isArray(value["states"]) ||
      !Array.isArray(value["actions"]) || !Array.isArray(value["transitions"])) {
    return value as unknown as KpSchemeFactorialFullEvaluation;
  }
  const materials = value["materials"].map((entry) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" ||
        typeof entry[1] !== "string" || !isRecord(entry[2])) {
      throw new Error("Packed factorial material is invalid.");
    }
    return { id: entry[0], lexeme: entry[1], provenance: entry[2] };
  });
  const states = value["states"].map((entry) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" ||
        typeof entry[1] !== "string" || typeof entry[2] !== "string" ||
        !Array.isArray(entry[3])) {
      throw new Error("Packed factorial state is invalid.");
    }
    return {
      id: entry[0],
      kind: entry[1],
      nativeCode: entry[2],
      tokens: entry[3].map((placement) => {
        if (!Array.isArray(placement) || typeof placement[0] !== "number" ||
            typeof placement[1] !== "number" || typeof placement[2] !== "number") {
          throw new Error("Packed factorial placement is invalid.");
        }
        const material = materials[placement[0]];
        if (material === undefined) throw new Error("Packed material is missing.");
        return { ...material, span: { start: placement[1], end: placement[2] } };
      })
    };
  });
  return {
    schemaVersion: value["schemaVersion"],
    id: value["id"],
    states,
    actions: value["actions"],
    transitions: value["transitions"],
    sourceStateId: value["sourceStateId"],
    targetStateId: value["targetStateId"],
    accessibleDescription: value["accessibleDescription"]
  } as unknown as KpSchemeFactorialFullEvaluation;
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
