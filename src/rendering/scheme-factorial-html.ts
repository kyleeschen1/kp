import type { KpSchemeResponsiveFrame } from
  "../animation/scheme-factorial-responsive-projection.ts";
import type { KpSchemeFactorialTimelineSample } from
  "../animation/scheme-factorial-timeline.ts";
import type {
  KpSchemeCheckpointMaterial,
  KpSchemeCheckpointProjection,
  KpSchemeSemanticCheckpoint
} from "../semantic/scheme-factorial-checkpoint-projector.ts";

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
.kp-scheme-factorial-stage__motion-orbit {
  fill: none;
  stroke: var(--kp-scheme-accent);
  stroke-linecap: round;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.kp-scheme-factorial-stage__motion-orbit { opacity: .28; }
.kp-scheme-factorial-stage__carrier { fill: var(--kp-scheme-accent); }
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
    input.sample.localProgress > 0 && input.reducedMotion !== true
    ? renderOverlay(input.sample, input.frame)
    : "";
  const description = input.sample.phase === "hold" || atInitialEndpoint
    ? (atInitialEndpoint ? from : to).accessibleDescription
    : `${input.sample.caption} The code is transitioning from ${from.id} to ${to.id}.`;
  return `<section class="kp-scheme-factorial-stage" data-kp-scheme-factorial-stage data-kp-scheme-progress="${input.sample.progress}" data-kp-scheme-phase="${input.sample.phase}" data-kp-scheme-checkpoint="${escapeAttribute(input.sample.settledCheckpointId)}" data-kp-scheme-layout="${input.frame.mode}" data-kp-scheme-paint-owner="semantic-dom" aria-label="${escapeAttribute(description)}" style="--kp-scheme-stage-height:${round(input.frame.stage.heightEm)}em"><div class="kp-scheme-factorial-stage__native" data-kp-scheme-native-layer>${native}</div>${overlay}</section>`;
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
  return `<pre class="kp-scheme-factorial-stage__material" data-kp-scheme-material-id="${escapeAttribute(material.id)}" data-kp-scheme-material-kind="${material.kind}" data-kp-scheme-material-state="${material.state}"${transitionSide === undefined ? "" : ` data-kp-scheme-transition-side="${transitionSide}"`} data-kp-scheme-source-ids="${escapeAttribute(material.sourceExpressionIds.join(" "))}" data-kp-scheme-runtime-ids="${escapeAttribute(material.runtimeIds.join(" "))}"${hidden ? " aria-hidden=\"true\" inert" : ""} style="--kp-scheme-material-opacity:${opacity};--kp-scheme-material-scale:${scale};--kp-scheme-material-y:${yEm}em;--kp-scheme-shell-depth:${shellDepth}"><code>${escapeHtml(material.nativeCode)}</code></pre>`;
}

function renderOverlay(
  sample: KpSchemeFactorialTimelineSample,
  frame: KpSchemeResponsiveFrame
): string {
  const progress = sample.localProgress;
  const x = round(18 + progress * 64);
  const y = sample.motionKind === "return-cascade"
    ? round(72 - Math.sin(progress * Math.PI) * 46)
    : round(58 - Math.sin(progress * Math.PI) * 28);
  const path = sample.motionKind === "return-cascade"
    ? "M18 72 C32 16 68 16 82 28"
    : "M18 58 C34 22 66 22 82 58";
  return `<div class="kp-scheme-factorial-stage__overlay" data-kp-scheme-transient-overlay data-kp-scheme-motion-kind="${sample.motionKind}" aria-hidden="true" inert><svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path class="kp-scheme-factorial-stage__motion-orbit" d="${path}"></path><path class="kp-scheme-factorial-stage__motion-path" d="${path}" pathLength="1" stroke-dasharray="${round(progress)} 1"></path><circle class="kp-scheme-factorial-stage__carrier" cx="${x}" cy="${y}" r="1.25" data-kp-scheme-carrier></circle></svg><span data-kp-scheme-overlay-width="${round(frame.stage.widthEm)}"></span></div>`;
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

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
