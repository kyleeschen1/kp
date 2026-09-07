import {
  resolveKpSemanticSalience
} from "../../animation/semantic-salience-resolver.ts";
import type { KpSemanticSalienceState } from
  "../../animation/semantic-salience-state.ts";
import type { KpEconomicsSupplyTaxAnimationAsset } from
  "../../animation/economics-supply-tax-asset.ts";
import type { KpSupplyTaxPedagogicalBeatV1 } from
  "./kinetic-figure-supply-tax-score.ts";

export type KpSupplyTaxTraceRole = "current" | "historical" |
  "prospective" | "unaddressed";

export interface KpSupplyTaxSceneEntityV1 {
  readonly entityId: string;
  readonly salience: KpSemanticSalienceState;
  readonly traceRole: KpSupplyTaxTraceRole;
}

export interface KpSupplyTaxSceneProjectionV1 {
  readonly beatId: KpSupplyTaxPedagogicalBeatV1["id"];
  readonly beatSlug: string;
  readonly settledFrame: KpSupplyTaxPedagogicalBeatV1["settledFrame"];
  readonly entities: readonly KpSupplyTaxSceneEntityV1[];
}

export interface KpSupplyTaxSceneTransitionEntityV1 {
  readonly entityId: string;
  readonly presence: number;
  readonly focus: number;
  readonly bloom: number;
  readonly historical: number;
  readonly target: KpSupplyTaxSceneEntityV1;
}

export interface KpSupplyTaxSceneTransitionProjectionV1 {
  readonly fromBeatId: KpSupplyTaxPedagogicalBeatV1["id"];
  readonly toBeatId: KpSupplyTaxPedagogicalBeatV1["id"];
  readonly progress: number;
  readonly entities: readonly KpSupplyTaxSceneTransitionEntityV1[];
}

export type KpSupplyTaxSceneTransitionProfile = "playback" | "scrub";

export type KpSupplyTaxNavigationMotion = "forward" | "rewind" | "settle";
export type KpSupplyTaxNavigationDisposition =
  "animate-forward" | "animate-rewind" | "animate-attention" |
  "direct-settle";

export function kpSupplyTaxBeatHash(
  beat: KpSupplyTaxPedagogicalBeatV1
): string {
  return `#beat.${beat.slug}`;
}

export function readKpSupplyTaxBeatFromHash(
  beats: readonly KpSupplyTaxPedagogicalBeatV1[],
  hash: string
): KpSupplyTaxPedagogicalBeatV1 {
  const slug = hash.startsWith("#beat.") ? hash.slice("#beat.".length) : "";
  return beats.find((beat) => beat.slug === slug) ?? beats[0]!;
}

export function resolveKpSupplyTaxNavigationMotion(input: {
  readonly from: KpSupplyTaxPedagogicalBeatV1;
  readonly to: KpSupplyTaxPedagogicalBeatV1;
}): KpSupplyTaxNavigationMotion {
  if (input.from.ordinal === 2 && input.to.ordinal === 3) return "forward";
  if (input.from.ordinal === 3 && input.to.ordinal === 2) return "rewind";
  return "settle";
}

export function resolveKpSupplyTaxNavigationDisposition(input: {
  readonly from: KpSupplyTaxPedagogicalBeatV1;
  readonly to: KpSupplyTaxPedagogicalBeatV1;
  readonly interrupted: boolean;
  readonly reducedMotion: boolean;
  readonly allowMotion?: boolean | undefined;
}): KpSupplyTaxNavigationDisposition {
  if (input.reducedMotion || input.interrupted ||
      input.allowMotion === false ||
      Math.abs(input.to.ordinal - input.from.ordinal) !== 1) {
    return "direct-settle";
  }
  const motion = resolveKpSupplyTaxNavigationMotion(input);
  if (motion === "forward") return "animate-forward";
  if (motion === "rewind") return "animate-rewind";
  return "animate-attention";
}

export function projectKpSupplyTaxScene(input: {
  readonly authority: KpEconomicsSupplyTaxAnimationAsset;
  readonly beat: KpSupplyTaxPedagogicalBeatV1;
}): KpSupplyTaxSceneProjectionV1 {
  const attention = input.beat.attention;
  const target = new Set(attention.targetEntityIds);
  const context = new Set(attention.contextEntityIds);
  const historical = new Set(attention.historicalTraceEntityIds);
  const prospective = new Set(attention.prospectiveTraceEntityIds);
  const entities = input.authority.animation.bundle.objects.map(({ id }) => {
    const present = isPresent(input.authority, input.beat, id);
    const traceRole: KpSupplyTaxTraceRole = target.has(id) || context.has(id)
      ? "current"
      : historical.has(id)
        ? "historical"
        : prospective.has(id)
          ? "prospective"
          : "unaddressed";
    const signals = target.has(id)
      ? ["focused" as const]
      : context.has(id)
        ? ["contextual" as const]
        : historical.has(id) || prospective.has(id)
          ? ["ghost" as const]
          : [];
    return Object.freeze({
      entityId: id,
      salience: resolveKpSemanticSalience({
        baseLevel: "normal",
        identityFamily: "neutral",
        presence: present ? 1 : 0,
        signals
      }).state,
      traceRole
    });
  });
  return Object.freeze({
    beatId: input.beat.id,
    beatSlug: input.beat.slug,
    settledFrame: input.beat.settledFrame,
    entities: Object.freeze(entities)
  });
}

export function projectKpSupplyTaxSceneDom(input: {
  readonly root: HTMLElement;
  readonly scene: KpSupplyTaxSceneProjectionV1;
}): void {
  projectSceneVisualDom({
    root: input.root,
    beatSlug: input.scene.beatSlug,
    settledFrame: input.scene.settledFrame,
    entities: input.scene.entities.map((entity) => ({
      entityId: entity.entityId,
      presence: entity.salience.presence,
      focus: entity.salience.level === "focus" ? 1 : 0,
      bloom: 0,
      historical: entity.traceRole === "historical" ? 1 : 0,
      target: entity
    }))
  });
  delete input.root.dataset["kpSupplyTaxTransitionFrom"];
  delete input.root.dataset["kpSupplyTaxTransitionTo"];
  input.root.dataset["kpSupplyTaxTransitionProgress"] = "1.0000";
}

/**
 * Interpolate renderer paint between authored semantic stops. This remains a
 * pure playhead projection: endpoints carry meaning; the scalar only carries
 * the learner's gaze from one endpoint to the next.
 */
export function projectKpSupplyTaxSceneTransition(input: {
  readonly from: KpSupplyTaxSceneProjectionV1;
  readonly to: KpSupplyTaxSceneProjectionV1;
  readonly progress: number;
  readonly profile?: KpSupplyTaxSceneTransitionProfile;
}): KpSupplyTaxSceneTransitionProjectionV1 {
  const progress = boundedProgress(input.progress);
  const profile = input.profile ?? "playback";
  const visualProgress = profile === "scrub" ? progress : smoothstep(progress);
  const fromById = new Map(input.from.entities.map((entity) =>
    [entity.entityId, entity] as const));
  const entities = input.to.entities.map((target) => {
    const source = fromById.get(target.entityId);
    if (source === undefined) {
      throw new Error(`Transition source is missing ${target.entityId}.`);
    }
    return Object.freeze({
      entityId: target.entityId,
      presence: interpolatePresence({ source, target, progress, profile }),
      focus: interpolate(
        source.salience.level === "focus" ? 1 : 0,
        target.salience.level === "focus" ? 1 : 0,
        visualProgress
      ),
      // Scroll scrubbing is direct manipulation. Playback may announce a new
      // arrival, but scrubbed paint must remain attached to the user's input.
      bloom: profile === "scrub"
        ? 0
        : projectReceptionBloom({ source, target, progress }),
      historical: interpolateHistoricalRole({
        source,
        target,
        progress: visualProgress
      }),
      target
    });
  });
  if (fromById.size !== entities.length) {
    throw new Error("Supply-tax transition endpoints must share entity identity.");
  }
  return Object.freeze({
    fromBeatId: input.from.beatId,
    toBeatId: input.to.beatId,
    progress,
    entities: Object.freeze(entities)
  });
}

export function projectKpSupplyTaxSceneTransitionDom(input: {
  readonly root: HTMLElement;
  readonly from: KpSupplyTaxSceneProjectionV1;
  readonly to: KpSupplyTaxSceneProjectionV1;
  readonly progress: number;
  readonly profile?: KpSupplyTaxSceneTransitionProfile;
}): void {
  const transition = projectKpSupplyTaxSceneTransition(input);
  projectSceneVisualDom({
    root: input.root,
    beatSlug: input.to.beatSlug,
    settledFrame: input.to.settledFrame,
    entities: transition.entities
  });
  input.root.dataset["kpSupplyTaxTransitionFrom"] = input.from.beatSlug;
  input.root.dataset["kpSupplyTaxTransitionTo"] = input.to.beatSlug;
  input.root.dataset["kpSupplyTaxTransitionProgress"] =
    transition.progress.toFixed(4);
}

function projectSceneVisualDom(input: {
  readonly root: HTMLElement;
  readonly beatSlug: string;
  readonly settledFrame: KpSupplyTaxPedagogicalBeatV1["settledFrame"];
  readonly entities: readonly KpSupplyTaxSceneTransitionEntityV1[];
}): void {
  input.root.dataset["kpSupplyTaxSceneBeat"] = input.beatSlug;
  input.root.dataset["kpSupplyTaxSceneFrame"] = input.settledFrame;
  const sceneById = new Map(input.entities.map((entity) =>
    [entity.entityId, entity] as const));
  input.root.querySelectorAll<HTMLElement | SVGElement>(
    "[data-kp-supply-tax-entity]"
  ).forEach((element) => {
    const id = element.dataset["kpSupplyTaxEntity"];
    const entity = id === undefined ? undefined : sceneById.get(id);
    if (entity === undefined) {
      throw new Error(`Rendered supply-tax entity ${String(id)} is not in the scene.`);
    }
    element.dataset["kpSemanticSalienceLevel"] = entity.target.salience.level;
    element.dataset["kpSemanticTraceRole"] = entity.target.traceRole;
    element.dataset["kpPresence"] = String(entity.presence > 0);
    const emphasis = Math.min(1, entity.focus + entity.bloom * 0.4);
    element.style.setProperty("--kp-supply-tax-focus-progress",
      entity.focus.toFixed(4));
    element.style.setProperty("--kp-supply-tax-attention-percent",
      `${(emphasis * 100).toFixed(2)}%`);
    element.style.setProperty("--kp-supply-tax-focus-wash",
      `${(entity.focus * 11 + entity.bloom * 6).toFixed(2)}%`);
    element.style.setProperty("--kp-supply-tax-bloom-progress",
      entity.bloom.toFixed(4));
    element.style.setProperty("--kp-supply-tax-bloom-fill",
      `${(entity.bloom * 6).toFixed(2)}%`);
    element.style.setProperty("--kp-supply-tax-historical-progress",
      entity.historical.toFixed(4));
    element.style.setProperty("--kp-supply-tax-historical-percent",
      `${(entity.historical * 100).toFixed(2)}%`);
    // Nested semantic labels inherit presence from their rendered parent. If
    // both owned opacity, a single arrival would be unintentionally squared.
    const parentEntity = element.parentElement?.closest(
      "[data-kp-supply-tax-entity]"
    );
    if (parentEntity !== null && parentEntity !== undefined) return;
    element.style.visibility = entity.presence > 0 ? "visible" : "hidden";
    if (entity.presence >= 1) element.style.removeProperty("opacity");
    else element.style.opacity = entity.presence.toFixed(4);
  });
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function interpolatePresence(input: {
  readonly source: KpSupplyTaxSceneEntityV1;
  readonly target: KpSupplyTaxSceneEntityV1;
  readonly progress: number;
  readonly profile: KpSupplyTaxSceneTransitionProfile;
}): number {
  const from = input.source.salience.presence;
  const to = input.target.salience.presence;
  if (input.profile === "scrub") return interpolate(from, to, input.progress);
  if (from === 0 && to === 1) return easeOutCubic(input.progress);
  if (from === 1 && to === 0) return 1 - input.progress ** 3;
  return interpolate(from, to, smoothstep(input.progress));
}

function projectReceptionBloom(input: {
  readonly source: KpSupplyTaxSceneEntityV1;
  readonly target: KpSupplyTaxSceneEntityV1;
  readonly progress: number;
}): number {
  const receivesFocus = input.source.salience.level !== "focus" &&
    input.target.salience.level === "focus" &&
    input.target.salience.presence > 0;
  if (!receivesFocus) return 0;
  // A single attack and recoil reads as reception; oscillation would turn
  // semantic attention into decorative spring motion.
  const peak = 0.36;
  const settled = 0.82;
  if (input.progress <= peak) return smoothstep(input.progress / peak);
  if (input.progress >= settled) return 0;
  return 1 - smoothstep((input.progress - peak) / (settled - peak));
}

function interpolateHistoricalRole(input: {
  readonly source: KpSupplyTaxSceneEntityV1;
  readonly target: KpSupplyTaxSceneEntityV1;
  readonly progress: number;
}): number {
  const sourceHistorical = input.source.traceRole === "historical" ? 1 : 0;
  const targetHistorical = input.target.traceRole === "historical" ? 1 : 0;
  // An arriving or leaving object keeps the style of its visible endpoint;
  // otherwise an absent historical outline would briefly flash as a fill.
  if (input.source.salience.presence === 0) return targetHistorical;
  if (input.target.salience.presence === 0) return sourceHistorical;
  return interpolate(sourceHistorical, targetHistorical, input.progress);
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

function boundedProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Supply-tax scene progress must be between zero and one.");
  }
  return value;
}

function isPresent(
  authority: KpEconomicsSupplyTaxAnimationAsset,
  beat: KpSupplyTaxPedagogicalBeatV1,
  entityId: string
): boolean {
  const semantics = authority.semantics;
  const { model } = semantics;
  if (entityId === semantics.id) return true;
  if (entityId === model.input.demand.id || entityId === model.input.supply.id) {
    return true;
  }
  if (entityId === model.states.untaxed.id ||
      semantics.entities.prices.some(({ id, role }) =>
        id === entityId && role === "untaxed-market")) {
    return true;
  }
  if (entityId === model.input.tax.id) return beat.ordinal >= 2;
  if (entityId === model.input.supply.taxedId ||
      entityId === model.states.taxed.id ||
      entityId === semantics.entities.wedge.id ||
      semantics.entities.prices.some(({ id, role }) =>
        id === entityId && role !== "untaxed-market")) {
    return beat.ordinal >= 3;
  }
  const region = semantics.entities.regions.find(({ id }) => id === entityId);
  if (region === undefined) return true;
  if (region.role === "government-revenue") return beat.ordinal >= 7;
  if (region.role === "deadweight-loss") return beat.ordinal >= 8;
  return beat.ordinal >= 6;
}
