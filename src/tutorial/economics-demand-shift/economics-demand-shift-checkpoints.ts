export type KpEconomicsDemandShiftFocusProfile =
  | "market"
  | "equilibrium"
  | "demand"
  | "transition"
  | "comparison"
  | "equations"
  | "boundary"
  | "synthesis"
  | "exploration";

export type KpEconomicsDemandShiftFocusTarget =
  | "market"
  | "equilibrium"
  | "demand"
  | "supply"
  | "equations";

const focusTargetProjection = Object.freeze({
  // Curve anchors avoid making every connector terminate at the intersection,
  // which would collapse distinct demand, supply, and equilibrium meanings.
  market: {
    targetSelector: "[data-kp-economics-equilibrium-point]",
    spotlightRadius: 150,
    targetAnchor: 0.5
  },
  equilibrium: {
    targetSelector: "[data-kp-economics-equilibrium-point]",
    spotlightRadius: 72,
    targetAnchor: 0.5
  },
  demand: {
    targetSelector: "[data-kp-economics-demand-line]",
    spotlightRadius: 105,
    targetAnchor: 0.22
  },
  supply: {
    targetSelector: "[data-kp-economics-supply-line]",
    spotlightRadius: 105,
    targetAnchor: 0.92
  },
  equations: {
    targetSelector: "[data-kp-economics-equation-role=\"equilibrium\"]",
    spotlightRadius: 130,
    targetAnchor: 0.5
  }
} satisfies Record<KpEconomicsDemandShiftFocusTarget, {
  readonly targetSelector: string;
  readonly spotlightRadius: number;
  readonly targetAnchor: number;
}>);

export const kpEconomicsDemandShiftCheckpoints = Object.freeze([
  checkpoint("orient-market", "Read the market", "context", 0, "market", "market"),
  checkpoint("initial-equilibrium", "Initial equilibrium", "initial-equilibrium", 0, "equilibrium", "equilibrium"),
  checkpoint("identify-change", "What changes", "demand-change", 0, "demand", "demand"),
  checkpoint("predict", "Make a prediction", "prediction", 0, "equilibrium", "equilibrium"),
  checkpoint("ready-to-shift", "Follow the shift", "follow-shift", 0, "transition", "demand"),
  checkpoint("handoff", "Equilibrium handoff", "follow-shift", 0.72, "transition", "equilibrium"),
  checkpoint("settled", "New equilibrium", "new-equilibrium", 1, "equilibrium", "equilibrium"),
  checkpoint("compare-equilibria", "Shift or movement?", "shift-versus-movement", 1, "comparison", "supply"),
  checkpoint("equation-check", "Check the equations", "equation-check", 1, "equations", "equations"),
  checkpoint("scope", "Read the model boundary", "scope", 1, "boundary", "equilibrium"),
  checkpoint("synthesis", "Explain the result", "synthesis", 1, "synthesis", "supply"),
  checkpoint("explore", "Explore another demand shift", "explore", 1, "exploration", "demand")
]);

export type KpEconomicsDemandShiftCheckpoint =
  typeof kpEconomicsDemandShiftCheckpoints[number];
export type KpEconomicsDemandShiftCheckpointId =
  KpEconomicsDemandShiftCheckpoint["id"];
export type KpEconomicsDemandShiftPassageId =
  KpEconomicsDemandShiftCheckpoint["passageId"];

export function findKpEconomicsDemandShiftCheckpointIndex(
  id: string | undefined
): number {
  const index = kpEconomicsDemandShiftCheckpoints.findIndex(
    (checkpoint) => checkpoint.id === id
  );
  return index < 0 ? 0 : index;
}

export function stepKpEconomicsDemandShiftCheckpoint(input: {
  readonly currentIndex: number;
  readonly direction: -1 | 1;
}): number {
  return Math.max(
    0,
    Math.min(
      kpEconomicsDemandShiftCheckpoints.length - 1,
      input.currentIndex + input.direction
    )
  );
}

export function selectKpEconomicsReadingBandPassage(input: {
  readonly currentPassageId: string;
  readonly readingBandY: number;
  readonly passageTops: Readonly<Record<string, number>>;
  readonly hysteresisPx?: number | undefined;
}): string {
  const entries = Object.entries(input.passageTops);
  if (entries.length === 0) return input.currentPassageId;
  const distance = ([, top]: readonly [string, number]) =>
    Math.abs(top - input.readingBandY);
  const candidate = entries.reduce((best, entry) =>
    distance(entry) < distance(best) ? entry : best
  );
  const current = entries.find(([id]) => id === input.currentPassageId);
  if (current === undefined) return candidate[0];
  const hysteresis = input.hysteresisPx ?? 48;
  return distance(candidate) + hysteresis < distance(current)
    ? candidate[0]
    : current[0];
}

function checkpoint<
  const Id extends string,
  const PassageId extends string,
  const Profile extends KpEconomicsDemandShiftFocusProfile,
  const Target extends KpEconomicsDemandShiftFocusTarget
>(
  id: Id,
  label: string,
  passageId: PassageId,
  progress: number,
  profile: Profile,
  target: Target
) {
  return Object.freeze({
    id,
    label,
    passageId,
    progress,
    attention: Object.freeze({
      profile,
      target,
      ...focusTargetProjection[target]
    })
  });
}
