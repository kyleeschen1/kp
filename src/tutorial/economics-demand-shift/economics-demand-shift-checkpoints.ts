export const kpEconomicsDemandShiftCheckpoints = Object.freeze([
  checkpoint("orient-market", "Read the market", "context", 0),
  checkpoint("initial-equilibrium", "Initial equilibrium", "initial-equilibrium", 0),
  checkpoint("identify-change", "What changes", "demand-change", 0),
  checkpoint("predict", "Make a prediction", "prediction", 0),
  checkpoint("ready-to-shift", "Follow the shift", "follow-shift", 0),
  checkpoint("handoff", "Equilibrium handoff", "follow-shift", 0.72),
  checkpoint("settled", "New equilibrium", "new-equilibrium", 1),
  checkpoint("compare-equilibria", "Shift or movement?", "shift-versus-movement", 1),
  checkpoint("equation-check", "Check the equations", "equation-check", 1),
  checkpoint("scope", "Read the model boundary", "scope", 1),
  checkpoint("synthesis", "Explain the result", "synthesis", 1),
  checkpoint("explore", "Explore another demand shift", "explore", 1)
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
  const PassageId extends string
>(
  id: Id,
  label: string,
  passageId: PassageId,
  progress: number
) {
  return Object.freeze({ id, label, passageId, progress });
}
