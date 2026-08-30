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

export type KpSupplyTaxNavigationMotion = "forward" | "rewind" | "settle";

export function resolveKpSupplyTaxNavigationMotion(input: {
  readonly from: KpSupplyTaxPedagogicalBeatV1;
  readonly to: KpSupplyTaxPedagogicalBeatV1;
}): KpSupplyTaxNavigationMotion {
  if (input.from.ordinal === 2 && input.to.ordinal === 3) return "forward";
  if (input.from.ordinal === 3 && input.to.ordinal === 2) return "rewind";
  return "settle";
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
  input.root.dataset["kpSupplyTaxSceneBeat"] = input.scene.beatSlug;
  input.root.dataset["kpSupplyTaxSceneFrame"] = input.scene.settledFrame;
  const sceneById = new Map(input.scene.entities.map((entity) =>
    [entity.entityId, entity] as const));
  input.root.querySelectorAll<HTMLElement | SVGElement>(
    "[data-kp-supply-tax-entity]"
  ).forEach((element) => {
    const id = element.dataset["kpSupplyTaxEntity"];
    const entity = id === undefined ? undefined : sceneById.get(id);
    if (entity === undefined) {
      throw new Error(`Rendered supply-tax entity ${String(id)} is not in the scene.`);
    }
    element.dataset["kpSemanticSalienceLevel"] = entity.salience.level;
    element.dataset["kpSemanticTraceRole"] = entity.traceRole;
    element.dataset["kpPresence"] = String(entity.salience.presence > 0);
    // Presence is categorical at semantic snaps; focus paint never changes
    // layout or makes required contextual information translucent.
    element.style.visibility = entity.salience.presence > 0
      ? "visible"
      : "hidden";
    if (entity.salience.presence > 0) element.style.removeProperty("opacity");
  });
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
