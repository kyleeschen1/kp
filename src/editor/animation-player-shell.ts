import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import {
  createKpEditorAnimationAuthoringState,
  type KpEditorAnimationAuthoringState
} from "./animation-authoring-controls.ts";
import {
  kpOrganicSubtleStyleRef,
  kpRestrainedEditorialStyleRef
} from "../animation/gestalt-base-styles.ts";

export function renderKpEditorAnimationPlayerShell(input: {
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly player: KpEditorAnimationPlayerState;
  readonly authoring?: KpEditorAnimationAuthoringState | undefined;
}): string {
  const { descriptor, player } = input;
  const authoring = input.authoring ?? createKpEditorAnimationAuthoringState();
  const progressPercent = Math.round(player.progress * 100);
  const hasControl = (kind: KpEditorAnimationDescriptor["controlKinds"][number]) =>
    descriptor.controlKinds.includes(kind);

  return `
    <section class="editor-animation-player" data-kp-editor-animation-player data-kp-editor-animation-descriptor-id="${escapeHtml(player.descriptorId)}" data-kp-editor-animation-id="${escapeHtml(player.animationId)}" data-kp-editor-animation-status="${player.playbackStatus}" data-kp-editor-animation-direction="${player.direction}" data-kp-editor-animation-progress="${player.progress}" data-kp-editor-animation-gestalt-pinned-style="${styleKey(kpOrganicSubtleStyleRef)}" data-kp-editor-animation-gestalt-selected-style="${styleKey(kpOrganicSubtleStyleRef)}" aria-label="${escapeHtml(descriptor.title)} animation player" aria-keyshortcuts="Space ArrowLeft ArrowRight Home End R" tabindex="0">
      <div class="editor-animation-player__stage" data-kp-editor-animation-stage data-kp-editor-animation-surface="${player.surface.kind}">
        ${player.surface.slotKinds.map((slotKind) => `
          <div class="editor-animation-player__surface editor-animation-player__surface--${slotKind}" data-kp-editor-animation-surface-slot="${slotKind}" aria-label="${surfaceLabel(slotKind)}">
            <span>${surfaceLabel(slotKind)}</span>
          </div>
        `).join("")}
      </div>
      <div class="editor-animation-player__controls" role="group" aria-label="Animation playback controls">
        <div class="editor-animation-player__transport">
          ${hasControl("playback") ? `
            <button type="button" data-action="play-editor-animation" aria-label="Play animation">Play</button>
            <button type="button" data-action="pause-editor-animation" aria-label="Pause animation">Pause</button>
          ` : ""}
          ${hasControl("step") ? `<button type="button" data-action="step-editor-animation" aria-label="Step animation forward">Step</button>` : ""}
          ${hasControl("rewind") ? `<button type="button" data-action="rewind-editor-animation" aria-label="Rewind animation">Rewind</button>` : ""}
          ${hasControl("playback") ? `<button type="button" data-action="reset-editor-animation" aria-label="Reset animation">Reset</button>` : ""}
        </div>
        ${hasControl("scrubber") ? `
          <label class="editor-animation-player__scrubber">
            <span>Progress</span>
            <input type="range" min="0" max="1" step="0.001" value="${player.progress}" data-action="seek-editor-animation" aria-label="Scrub animation progress" />
            <output data-kp-editor-animation-progress-label>${progressPercent}%</output>
          </label>
        ` : ""}
        <p class="editor-animation-player__status" data-kp-editor-animation-status-label aria-live="polite">${statusLabel(player.playbackStatus, player.direction)}</p>
        <label class="editor-animation-player__accessibility">Presentation
          <select data-kp-editor-animation-accessibility-control aria-label="Animation accessibility presentation">
            <option value="system">system preference</option>
            <option value="full-motion">full motion</option>
            <option value="reduced-motion">reduced motion</option>
            <option value="static">static checkpoints</option>
            <option value="narrated">narrated</option>
          </select>
        </label>
        <label class="editor-animation-player__gestalt-style">Gestalt style
          <select data-kp-editor-animation-gestalt-style-control aria-label="Animation gestalt style">
            <option value="${styleKey(kpOrganicSubtleStyleRef)}">organic subtle</option>
            <option value="${styleKey(kpRestrainedEditorialStyleRef)}">restrained editorial</option>
          </select>
        </label>
        <label class="editor-animation-player__focus-experiment">Focus
          <select data-kp-editor-animation-focus-experiment-control aria-label="Animation focus experiment">
            <option value="flat">flat</option>
            <option value="elevated">elevated 2.5D</option>
            <option value="no-depth">no depth</option>
          </select>
        </label>
        <output data-kp-editor-animation-narration aria-live="polite">Animation checkpoint</output>
      </div>
      ${renderGestaltDiagnostics()}
      ${renderAuthoringControls(authoring)}
    </section>
  `;
}

function renderGestaltDiagnostics(): string {
  return `
    <details class="editor-animation-gestalt-diagnostics" data-kp-editor-animation-gestalt-diagnostics>
      <summary>
        <span>Choreography &amp; style</span>
        <span data-kp-editor-gestalt-status>Inspecting</span>
      </summary>
      <div class="editor-animation-gestalt-diagnostics__body">
        <dl>
          <div><dt>Pinned style</dt><dd data-kp-editor-gestalt-pinned-style>${styleKey(kpOrganicSubtleStyleRef)}</dd></div>
          <div><dt>Selected style</dt><dd data-kp-editor-gestalt-selected-style>${styleKey(kpOrganicSubtleStyleRef)}</dd></div>
          <div><dt>Resolved chain</dt><dd data-kp-editor-gestalt-resolved-chain>pending</dd></div>
          <div><dt>Envelope phase</dt><dd data-kp-editor-gestalt-envelope-phase>pending</dd></div>
          <div><dt>Focus group</dt><dd data-kp-editor-gestalt-focus-group>pending</dd></div>
          <div><dt>Salience graph</dt><dd data-kp-editor-gestalt-salience>pending</dd></div>
          <div><dt>Traversal</dt><dd data-kp-editor-gestalt-traversal>pending</dd></div>
          <div><dt>Capabilities</dt><dd data-kp-editor-gestalt-capabilities>pending</dd></div>
          <div><dt>Focus experiment</dt><dd data-kp-editor-focus-experiment>flat</dd></div>
          <div><dt>x/y invariance</dt><dd data-kp-editor-focus-invariance>pending</dd></div>
        </dl>
        <ul data-kp-editor-gestalt-warnings></ul>
      </div>
    </details>
  `;
}

function renderAuthoringControls(state: KpEditorAnimationAuthoringState): string {
  return `
    <details class="editor-animation-player__authoring" data-kp-editor-animation-authoring-controls>
      <summary>Semantic and motion authoring</summary>
      <fieldset>
        <legend>Semantic intent</legend>
        ${selectControl("Role assignment", "role-mode", state.semantic.roleMode, ["canonical", "source-focused", "target-focused"])}
        ${selectControl("Lineage", "lineage-mode", state.semantic.lineageMode, ["preserve", "copy", "merge", "replace"])}
        <label>Provenance <input type="checkbox" data-kp-animation-authoring-control="provenance-visibility"${state.semantic.provenanceVisibility ? " checked" : ""} /></label>
        ${selectControl("Salience", "salience-policy", state.semantic.saliencePolicy, ["source-to-target", "balanced", "target-first"])}
        ${selectControl("Correctness disclosure", "correctness-disclosure", state.semantic.correctnessDisclosure, ["immediate", "checkpoint", "learner-request"])}
        ${selectControl("Typed gaps", "gap-policy", state.semantic.gapPolicy, ["strict", "show-typed-gaps"])}
      </fieldset>
      <fieldset>
        <legend>Presentation</legend>
        ${selectControl("Spacing", "spacing", state.presentation.spacing, ["compact", "balanced", "spacious"])}
        <label>Tempo <input type="range" min="0.5" max="2" step="0.1" value="${state.presentation.tempo}" data-kp-animation-authoring-control="tempo" /></label>
        ${selectControl("Path", "path-preference", state.presentation.pathPreference, ["automatic", "arc-above", "arc-below", "around-left", "around-right"])}
      </fieldset>
      <output data-kp-editor-animation-authoring-status aria-live="polite">Plan revision ${state.revision} · semantic edits regenerate canonical operations</output>
    </details>
  `;
}

function selectControl(
  label: string,
  controlId: string,
  value: string,
  options: readonly string[]
): string {
  return `<label>${label} <select data-kp-animation-authoring-control="${controlId}">${options.map((option) =>
    `<option value="${option}"${option === value ? " selected" : ""}>${option.replaceAll("-", " ")}</option>`
  ).join("")}</select></label>`;
}

function surfaceLabel(
  kind: KpEditorAnimationPlayerState["surface"]["slotKinds"][number]
): string {
  switch (kind) {
    case "equation": return "Equation animation stage";
    case "diagram": return "Diagram animation stage";
    case "graph": return "Graph animation stage";
    case "programming": return "Programming animation stage";
  }
}

function statusLabel(
  status: KpEditorAnimationPlayerState["playbackStatus"],
  direction: KpEditorAnimationPlayerState["direction"]
): string {
  const label = status === "complete" ? "Complete" : capitalize(status);
  return `${label} · ${direction === "rewind" ? "rewind" : "forward"}`;
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function styleKey(ref: { readonly id: string; readonly version: string }): string {
  return `${ref.id}@${ref.version}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
