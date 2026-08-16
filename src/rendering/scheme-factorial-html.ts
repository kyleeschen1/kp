import type { KpSchemeResponsiveFrame } from
  "../animation/scheme-factorial-responsive-projection.ts";
import type { KpSchemeFactorialMotionProjection } from
  "../animation/scheme-factorial-motion-projection.ts";
import type { KpSchemeFactorialTimelineSample } from
  "../animation/scheme-factorial-timeline.ts";
import type {
  KpSchemeCheckpointMaterial,
  KpSchemeCheckpointProjection,
  KpSchemeSemanticCheckpoint
} from "../semantic/scheme-factorial-checkpoint-projector.ts";
import {
  encodeKpHtmlAttribute as encodeKpEditorHtmlAttribute,
  encodeKpHtmlText as encodeKpEditorHtmlText
} from "./html-output-encoding.ts";

export const kpSchemeFactorialCss = `
.kp-scheme-factorial-stage {
  --kp-scheme-bg: var(--kp-lesson-theme-surface, #0d0e1c);
  --kp-scheme-ink: var(--kp-lesson-theme-math-foreground, #e7e5df);
  --kp-scheme-muted: color-mix(in srgb, var(--kp-scheme-ink) 54%, var(--kp-scheme-bg));
  --kp-scheme-accent: var(--kp-lesson-theme-focus, #88c9ff);
  background: var(--kp-scheme-bg);
  color: var(--kp-scheme-ink);
  container-type: inline-size;
  display: grid;
  min-block-size: var(--kp-scheme-stage-height);
  overflow: hidden;
  padding: clamp(1rem, 4cqi, 2.5rem);
  place-items: center;
  position: relative;
}
.kp-scheme-factorial-stage__native {
  align-content: center;
  display: grid;
  font: 400 18px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  gap: .75rem;
  inline-size: min(100%, 42rem);
  min-block-size: 18rem;
  position: relative;
  z-index: 1;
}
.kp-scheme-factorial-stage__material {
  display: block;
  grid-column: 1;
  margin: 0;
  opacity: var(--kp-scheme-material-opacity, 1);
  transform: translateY(var(--kp-scheme-material-y, 0)) scale(var(--kp-scheme-material-scale, 1));
  transform-origin: center;
}
.kp-scheme-factorial-stage__material code {
  color: inherit;
  font: inherit;
  user-select: text;
  white-space: pre-wrap;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="definition"] {
  color: var(--kp-scheme-muted);
  justify-self: start;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-state="seed"] {
  border: 1px solid color-mix(in srgb, var(--kp-scheme-muted) 42%, transparent);
  padding: .24rem .5rem;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="invocation"] {
  font-size: 1.15em;
  justify-self: center;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="active-expression"] {
  color: var(--kp-scheme-accent);
  justify-self: center;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="parameter-cell"] {
  border-block-end: 1px solid var(--kp-scheme-accent);
  justify-self: center;
  padding: .12rem .4rem;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="waiting-shell"] {
  border-inline-start: 1px solid var(--kp-scheme-muted);
  color: var(--kp-scheme-muted);
  justify-self: center;
  padding-inline-start: calc(.65rem + var(--kp-scheme-shell-depth, 0) * .8rem);
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="dormant-branch"] {
  color: var(--kp-scheme-muted);
  font-size: .88em;
  justify-self: end;
}
.kp-scheme-factorial-stage__material[data-kp-scheme-material-kind="value"] {
  color: var(--kp-scheme-accent);
  font-size: 1.35em;
  font-weight: 650;
  justify-self: center;
}
.kp-scheme-factorial-stage__overlay {
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}
.kp-scheme-factorial-stage__overlay svg {
  block-size: 100%;
  inline-size: 100%;
}
.kp-scheme-factorial-stage__motion-path,
.kp-scheme-factorial-stage__motion-orbit,
.kp-scheme-factorial-stage__membrane,
.kp-scheme-factorial-stage__shell {
  fill: none;
  stroke: var(--kp-scheme-accent);
  stroke-linecap: round;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.kp-scheme-factorial-stage__motion-orbit { opacity: .28; }
.kp-scheme-factorial-stage__membrane,
.kp-scheme-factorial-stage__shell { stroke: var(--kp-scheme-muted); }
.kp-scheme-factorial-stage__carrier,
.kp-scheme-factorial-stage__particle { fill: var(--kp-scheme-accent); }
.kp-scheme-factorial-stage__particle--dormant { fill: var(--kp-scheme-muted); }
@media (max-width: 639px) {
  .kp-scheme-factorial-stage { padding-inline: .8rem; }
  .kp-scheme-factorial-stage__native { gap: .55rem; }
}
@media (prefers-reduced-motion: reduce) {
  .kp-scheme-factorial-stage__overlay { display: none; }
}
`;

export function renderKpSchemeFactorialHtml(input: {
  readonly checkpoints: KpSchemeCheckpointProjection;
  readonly sample: KpSchemeFactorialTimelineSample;
  readonly frame: KpSchemeResponsiveFrame;
  readonly motion: KpSchemeFactorialMotionProjection;
  readonly reducedMotion?: boolean | undefined;
}): string {
  const from = requiredCheckpoint(input.checkpoints, input.sample.fromCheckpointId);
  const to = requiredCheckpoint(input.checkpoints, input.sample.toCheckpointId);
  const atInitialEndpoint = input.sample.phase === "motion" &&
    input.sample.localProgress === 0;
  const native = input.sample.phase === "hold" || atInitialEndpoint
    ? renderCheckpoint(atInitialEndpoint ? from : to)
    : renderTransition(from, to, input.sample.localProgress);
  const overlay = input.sample.phase === "motion" &&
    input.sample.localProgress > 0 && input.reducedMotion !== true &&
    input.motion.kind !== "none"
    ? renderOverlay(input.motion, input.frame)
    : "";
  const description = input.sample.phase === "hold" || atInitialEndpoint
    ? (atInitialEndpoint ? from : to).accessibleDescription
    : `${input.sample.caption} The code is transitioning from ${from.id} to ${to.id}.`;
  const settlement = input.motion.kind === "none" ? "settled"
    : input.motion.settlement.sample.phase;
  const nativeOwner = input.motion.kind === "none" ? "native.scheme.semantic-dom"
    : input.motion.settlement.sample.accessibleNativeOwnerId;
  return `<section class="kp-scheme-factorial-stage" data-kp-scheme-factorial-stage data-kp-scheme-progress="${input.sample.progress}" data-kp-scheme-phase="${input.sample.phase}" data-kp-scheme-settlement-phase="${settlement}" data-kp-scheme-native-owner="${nativeOwner}" data-kp-scheme-checkpoint="${encodeKpEditorHtmlAttribute(input.sample.settledCheckpointId)}" data-kp-scheme-layout="${input.frame.mode}" data-kp-scheme-paint-owner="semantic-dom" aria-label="${encodeKpEditorHtmlAttribute(description)}" style="--kp-scheme-stage-height:${round(input.frame.stage.heightEm)}em"><div class="kp-scheme-factorial-stage__native" data-kp-scheme-native-layer>${native}</div>${overlay}</section>`;
}

function renderCheckpoint(checkpoint: KpSchemeSemanticCheckpoint): string {
  return checkpoint.material.map((material, index) =>
    renderMaterial(material, 1, 1, 0, index)).join("");
}

function renderTransition(
  from: KpSchemeSemanticCheckpoint,
  to: KpSchemeSemanticCheckpoint,
  progress: number
): string {
  const fromById = new Map(from.material.map((material) => [material.id, material]));
  const toById = new Map(to.material.map((material) => [material.id, material]));
  const ids = [...new Set([...fromById.keys(), ...toById.keys()])];
  let shellIndex = 0;
  return ids.map((id) => {
    const source = fromById.get(id);
    const target = toById.get(id);
    if (source !== undefined && target !== undefined &&
        sameMaterial(source, target)) {
      return renderMaterial(target, 1, 1, 0,
        target.kind === "waiting-shell" ? shellIndex++ : 0);
    }
    const exiting = source === undefined ? "" : renderMaterial(
      source,
      round(1 - progress),
      round(1 - progress * 0.06),
      round(-progress * 0.45),
      source.kind === "waiting-shell" ? shellIndex++ : 0,
      "from"
    );
    const entering = target === undefined ? "" : renderMaterial(
      target,
      round(progress),
      round(0.94 + progress * 0.06),
      round((1 - progress) * 0.45),
      target.kind === "waiting-shell" ? shellIndex++ : 0,
      "to"
    );
    return exiting + entering;
  }).join("");
}

function renderMaterial(
  material: KpSchemeCheckpointMaterial,
  opacity: number,
  scale: number,
  yEm: number,
  shellDepth: number,
  transitionSide?: "from" | "to"
): string {
  const hidden = opacity <= 0.001;
  return `<pre class="kp-scheme-factorial-stage__material" data-kp-scheme-material-id="${encodeKpEditorHtmlAttribute(material.id)}" data-kp-scheme-material-kind="${material.kind}" data-kp-scheme-material-state="${material.state}"${transitionSide === undefined ? "" : ` data-kp-scheme-transition-side="${transitionSide}"`} data-kp-scheme-source-ids="${encodeKpEditorHtmlAttribute(material.sourceExpressionIds.join(" "))}" data-kp-scheme-runtime-ids="${encodeKpEditorHtmlAttribute(material.runtimeIds.join(" "))}"${hidden ? " aria-hidden=\"true\" inert" : ""} style="--kp-scheme-material-opacity:${opacity};--kp-scheme-material-scale:${scale};--kp-scheme-material-y:${yEm}em;--kp-scheme-shell-depth:${shellDepth}"><code>${encodeKpEditorHtmlText(material.nativeCode)}</code></pre>`;
}

function renderOverlay(
  motion: Exclude<KpSchemeFactorialMotionProjection, { readonly kind: "none" }>,
  frame: KpSchemeResponsiveFrame
): string {
  return `<div class="kp-scheme-factorial-stage__overlay" data-kp-scheme-transient-overlay data-kp-scheme-motion-kind="${motion.kind}" data-kp-scheme-transit-paint-owner="${motion.settlement.sample.paintOwnerId}" data-kp-scheme-settlement-transition="${encodeKpEditorHtmlAttribute(motion.settlement.transitionId)}" aria-hidden="true" inert><svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">${renderMotionSvg(motion, frame)}</svg></div>`;
}

function renderMotionSvg(
  motion: Exclude<KpSchemeFactorialMotionProjection, { readonly kind: "none" }>,
  frame: KpSchemeResponsiveFrame
): string {
  switch (motion.kind) {
    case "structural": {
      const outlines = motion.sample.expressions.flatMap((expression) => {
        const geometry = frame.expressions.find(({ expressionId }) =>
          expressionId === expression.expressionId);
        if (geometry === undefined) return [];
        const rect = percentRect(geometry.rect, frame);
        const progress = expression.direction === "fold"
          ? 1 - expression.membraneProgress
          : expression.membraneProgress;
        return [`<rect class="kp-scheme-factorial-stage__membrane" data-kp-scheme-expression-id="${encodeKpEditorHtmlAttribute(expression.expressionId)}" x="${round(rect.x + rect.width * (1 - progress) / 2)}" y="${rect.y}" width="${round(rect.width * progress)}" height="${rect.height}" rx="1.5"></rect>`];
      }).join("");
      const shells = motion.sample.waitingShells.map((shell, index) => {
        const width = round(12 + index * 5);
        return `<path class="kp-scheme-factorial-stage__shell" data-kp-scheme-shell-id="${encodeKpEditorHtmlAttribute(shell.materialId)}" d="M${round(50 - width / 2)} ${round(70 + index * 5)} H${round(50 + width / 2)}" opacity="${shell.progress}"></path>`;
      }).join("");
      return outlines + shells;
    }
    case "binding": {
      const x = round(18 + motion.point.inline * 64);
      const y = round(62 + motion.point.block * 34);
      return `<path class="kp-scheme-factorial-stage__motion-orbit" d="M18 62 C35 22 65 22 82 62"></path><path class="kp-scheme-factorial-stage__motion-path" d="M18 62 C35 22 65 22 82 62" pathLength="1" stroke-dasharray="${motion.sample.arcProgress} 1"></path><circle class="kp-scheme-factorial-stage__carrier" data-kp-scheme-binding-id="${encodeKpEditorHtmlAttribute(motion.arc.bindingId)}" cx="${x}" cy="${y}" r="1.35"></circle>`;
    }
    case "branch": {
      const dormant = motion.sample.dormantParticleProgress;
      const particles = [0, 1, 2].map((index) =>
        `<circle class="kp-scheme-factorial-stage__particle kp-scheme-factorial-stage__particle--dormant" cx="${round(73 + dormant * (index - 1) * 4)}" cy="${round(58 + dormant * (index % 2 === 0 ? -3 : 3))}" r="${round(1.15 * (1 - dormant * .55))}"></circle>`
      ).join("");
      return `<circle class="kp-scheme-factorial-stage__motion-path" data-kp-scheme-selected-expression-id="${encodeKpEditorHtmlAttribute(motion.motif.selectedExpressionId)}" cx="35" cy="52" r="${round(3 + motion.sample.selectedEmphasis * 2)}" opacity="${motion.sample.selectedEmphasis}"></circle>${particles}`;
    }
    case "primitive": {
      const gather = motion.sample.inputGatherProgress;
      const left = round(28 + gather * 20);
      const right = round(72 - gather * 20);
      return `<circle class="kp-scheme-factorial-stage__particle" cx="${left}" cy="52" r="1.25"></circle><circle class="kp-scheme-factorial-stage__particle" cx="${right}" cy="52" r="1.25"></circle><circle class="kp-scheme-factorial-stage__motion-path" data-kp-scheme-primitive="${motion.motif.primitive}" cx="50" cy="52" r="${round(2.4 + motion.sample.operatorPulse * 2.1)}" opacity="${round(.3 + motion.sample.resultRevealProgress * .7)}"></circle>`;
    }
    case "summary": {
      return [0, 1, 2].map((index) => {
        const visible = index < motion.sample.completedRepetitions
          ? 1
          : index === motion.sample.completedRepetitions
            ? motion.sample.activeRepetitionProgress : 0;
        return `<path class="kp-scheme-factorial-stage__shell" data-kp-scheme-summary-depth="${index + 1}" d="M${36 - index * 5} ${42 + index * 10} H${64 + index * 5}" opacity="${visible}"></path>`;
      }).join("");
    }
    case "return": {
      const step = motion.sample.activeStepIndex;
      const local = motion.sample.phase === "base-hold" ? 0
        : (motion.sample.travelProgress + motion.sample.shellReopenProgress +
          motion.sample.productRevealProgress) / 3;
      const startX = 26 + step * 16;
      const x = round(startX + local * 16);
      const y = round(70 - Math.sin(local * Math.PI) * 28 - step * 8);
      return `<path class="kp-scheme-factorial-stage__motion-orbit" d="M${startX} ${70 - step * 8} C${startX + 4} ${35 - step * 8} ${startX + 12} ${35 - step * 8} ${startX + 16} ${62 - step * 8}"></path><circle class="kp-scheme-factorial-stage__carrier" data-kp-scheme-carrier data-kp-scheme-carrier-value-id="${encodeKpEditorHtmlAttribute(motion.sample.carrierValueId)}" cx="${x}" cy="${y}" r="1.6"></circle>`;
    }
  }
}

function percentRect(
  rect: KpSchemeResponsiveFrame["expressions"][number]["rect"],
  frame: KpSchemeResponsiveFrame
): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
  return {
    x: round(rect.xEm / frame.stage.widthEm * 100),
    y: round(rect.yEm / frame.stage.heightEm * 100),
    width: round(rect.widthEm / frame.stage.widthEm * 100),
    height: round(rect.heightEm / frame.stage.heightEm * 100)
  };
}

function sameMaterial(
  left: KpSchemeCheckpointMaterial,
  right: KpSchemeCheckpointMaterial
): boolean {
  return left.kind === right.kind && left.state === right.state &&
    left.nativeCode === right.nativeCode &&
    left.sourceExpressionIds.join("\u0000") === right.sourceExpressionIds.join("\u0000") &&
    left.runtimeIds.join("\u0000") === right.runtimeIds.join("\u0000");
}

function requiredCheckpoint(
  checkpoints: KpSchemeCheckpointProjection,
  id: string
): KpSchemeSemanticCheckpoint {
  const checkpoint = checkpoints.checkpoints.find((candidate) =>
    candidate.id === id);
  if (checkpoint === undefined) throw new Error(`Missing Scheme checkpoint ${id}.`);
  return checkpoint;
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
