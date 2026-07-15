import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";

export function renderKpEditorAnimationPlayerShell(input: {
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly player: KpEditorAnimationPlayerState;
}): string {
  const { descriptor, player } = input;
  const progressPercent = Math.round(player.progress * 100);
  const hasControl = (kind: KpEditorAnimationDescriptor["controlKinds"][number]) =>
    descriptor.controlKinds.includes(kind);

  return `
    <section class="editor-animation-player" data-kp-editor-animation-player data-kp-editor-animation-descriptor-id="${escapeHtml(player.descriptorId)}" data-kp-editor-animation-id="${escapeHtml(player.animationId)}" data-kp-editor-animation-status="${player.playbackStatus}" data-kp-editor-animation-direction="${player.direction}" data-kp-editor-animation-progress="${player.progress}" aria-label="${escapeHtml(descriptor.title)} animation player">
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
      </div>
    </section>
  `;
}

function surfaceLabel(
  kind: KpEditorAnimationPlayerState["surface"]["slotKinds"][number]
): string {
  switch (kind) {
    case "equation": return "Equation animation stage";
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
