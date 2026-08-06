import type {
  KpResolvedSemanticSalience,
  KpSalienceIdentityFamily,
  KpSalienceLevel,
  KpSalienceSignal,
  KpSemanticVisualRole
} from "../../animation/semantic-visual-salience.ts";
import { resolveKpSemanticSalience } from
  "../../animation/semantic-visual-salience.ts";
import type {
  KpEconomicsDemandShiftFocusTarget
} from "./economics-demand-shift-checkpoints.ts";
import type {
  KpEconomicsPresentationState,
  KpEconomicsSemanticMarketState
} from "./economics-demand-shift-motion-blocks.ts";

export const kpEconomicsSalienceObjectDefinitions = Object.freeze([
  object("market.page", "page", "neutral", "normal"),
  object("market.grid", "structure", "neutral", "dim"),
  object("market.axes", "structure", "neutral", "normal"),
  object("market.supply", "data-series", "blue", "normal"),
  object("market.demand.current", "data-series", "red", "normal"),
  object("market.demand.initial", "data-series", "red", "ghost"),
  object("market.equilibrium.current", "focus", "cyan", "normal"),
  object("market.equilibrium.initial", "focus", "cyan", "ghost"),
  object("market.guides", "relation", "neutral", "context"),
  object("market.equations", "ink", "neutral", "normal")
]);

export type KpEconomicsSalienceObjectId =
  typeof kpEconomicsSalienceObjectDefinitions[number]["id"];

export interface KpEconomicsSalienceObjectProjection {
  readonly id: KpEconomicsSalienceObjectId;
  readonly role: KpSemanticVisualRole;
  readonly salience: KpResolvedSemanticSalience;
}

export interface KpEconomicsSalienceProjection {
  readonly market: KpEconomicsSemanticMarketState;
  readonly presentation: KpEconomicsPresentationState;
  readonly focusTarget: KpEconomicsDemandShiftFocusTarget;
  readonly objects: Readonly<Record<
    KpEconomicsSalienceObjectId,
    KpEconomicsSalienceObjectProjection
  >>;
}

const focusObjects = Object.freeze({
  market: ["market.equilibrium.current"],
  equilibrium: ["market.equilibrium.current"],
  demand: ["market.demand.current"],
  supply: ["market.supply"],
  equations: ["market.equations"]
} satisfies Record<
  KpEconomicsDemandShiftFocusTarget,
  readonly KpEconomicsSalienceObjectId[]
>);

export function projectKpEconomicsSalience(input: {
  readonly market: KpEconomicsSemanticMarketState;
  readonly presentation: KpEconomicsPresentationState;
  readonly focusTarget: KpEconomicsDemandShiftFocusTarget;
}): KpEconomicsSalienceProjection {
  const focused = new Set<KpEconomicsSalienceObjectId>(
    focusObjects[input.focusTarget]
  );
  const objects = Object.fromEntries(kpEconomicsSalienceObjectDefinitions.map(
    (definition) => {
      const presence = objectPresence(definition.id, input);
      const signals: KpSalienceSignal[] = [];
      if (focused.has(definition.id)) signals.push("focused");
      else if (definition.baseLevel === "ghost") signals.push("ghost");
      else if (definition.baseLevel === "normal" && definition.role !== "page") {
        // Deliberately quiet structures such as the grid retain their authored
        // dim baseline; "contextual" is the ordinary non-focus handoff state.
        signals.push("contextual");
      }
      return [definition.id, Object.freeze({
        id: definition.id,
        role: definition.role,
        salience: resolveKpSemanticSalience({
          baseLevel: definition.baseLevel,
          identityFamily: definition.identityFamily,
          presence,
          signals
        })
      })];
    }
  )) as Record<KpEconomicsSalienceObjectId, KpEconomicsSalienceObjectProjection>;
  return Object.freeze({ ...input, objects: Object.freeze(objects) });
}

function object<Id extends string>(
  id: Id,
  role: KpSemanticVisualRole,
  identityFamily: KpSalienceIdentityFamily,
  baseLevel: KpSalienceLevel
) {
  return Object.freeze({ id, role, identityFamily, baseLevel });
}

function objectPresence(
  id: KpEconomicsSalienceObjectId,
  input: Pick<KpEconomicsSalienceProjection, "market" | "presentation">
): number {
  if (id === "market.demand.initial" || id === "market.equilibrium.initial") {
    return input.market === "initial" ? 0 : 1;
  }
  if (id === "market.equations") {
    return input.presentation === "comparison-verified" ? 1 : 0;
  }
  return 1;
}
