import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export interface KpEconomicsDemandShiftDeckScene {
  readonly id: string;
  readonly passageId: string;
  readonly label: string;
  readonly target: {
    readonly blockId: KpEconomicsMotionBlockId;
    readonly progress: number;
  };
}

export const kpEconomicsDemandShiftDeckScenes:
readonly KpEconomicsDemandShiftDeckScene[] = Object.freeze([
  scene("orient", "graph-at-rest", "Orient to the graph", "demand-shift", 0),
  scene(
    "equilibrium",
    "initial-equilibrium",
    "Find the initial equilibrium",
    "demand-shift",
    0
  ),
  scene(
    "shift-demand",
    "follow-shift",
    "Shift demand",
    "demand-shift",
    1
  ),
  scene(
    "interpret-equilibrium",
    "new-equilibrium",
    "Interpret the new equilibrium",
    "demand-shift",
    1
  ),
  scene(
    "trace-supply",
    "shift-versus-movement",
    "Trace unchanged supply",
    "supply-movement",
    1
  ),
  scene(
    "conclude",
    "movement-along-supply",
    "Distinguish a shift from movement",
    "supply-movement",
    1
  )
]);

export function readKpEconomicsDemandShiftDeckSceneIndex(
  search: string
): number {
  const requested = new URLSearchParams(search).get("scene");
  if (requested === null) return 0;
  const byId = kpEconomicsDemandShiftDeckScenes.findIndex(
    ({ id }) => id === requested
  );
  if (byId >= 0) return byId;
  const byOrdinal = Number(requested) - 1;
  return Number.isInteger(byOrdinal) && byOrdinal >= 0 &&
      byOrdinal < kpEconomicsDemandShiftDeckScenes.length
    ? byOrdinal
    : 0;
}

export function writeKpEconomicsDemandShiftDeckScene(input: {
  readonly search: string;
  readonly sceneIndex: number;
}): string {
  const bounded = Math.max(0, Math.min(
    kpEconomicsDemandShiftDeckScenes.length - 1,
    Math.trunc(input.sceneIndex)
  ));
  const parameters = new URLSearchParams(input.search);
  parameters.set("view", "deck");
  parameters.set("scene", kpEconomicsDemandShiftDeckScenes[bounded]!.id);
  parameters.delete("layout");
  parameters.delete("enhancement");
  return `?${parameters.toString()}`;
}

export function projectKpEconomicsDeckMotionScalar(
  scene: KpEconomicsDemandShiftDeckScene
): number {
  return scene.target.blockId === "demand-shift"
    ? scene.target.progress
    : 1 + scene.target.progress;
}

function scene(
  id: string,
  passageId: string,
  label: string,
  blockId: KpEconomicsMotionBlockId,
  progress: number
): KpEconomicsDemandShiftDeckScene {
  return Object.freeze({
    id,
    passageId,
    label,
    target: Object.freeze({ blockId, progress })
  });
}
