export type KpEconomicsVerificationGroupId =
  | "supply-rule"
  | "equilibria"
  | "changes";

export interface KpEconomicsVerificationGroup {
  readonly id: KpEconomicsVerificationGroupId;
  readonly label: string;
  readonly targetIds: readonly string[];
  readonly latex: readonly string[];
  readonly reveal: {
    readonly start: number;
    readonly end: number;
  };
}

export interface KpEconomicsVerificationRevealProjection {
  readonly phase: "hidden" | KpEconomicsVerificationGroupId | "verified";
  readonly groups: Readonly<Record<KpEconomicsVerificationGroupId, number>>;
}

export const kpEconomicsVerificationGroups: readonly KpEconomicsVerificationGroup[] =
  Object.freeze([
    group({
      id: "supply-rule",
      label: "Same supply curve",
      targetIds: ["supply-line"],
      latex: [String.raw`P = 2 + Q`],
      reveal: { start: 0.58, end: 0.7 }
    }),
    group({
      id: "equilibria",
      label: "Two equilibria",
      targetIds: ["initial-equilibrium", "settled-equilibrium"],
      latex: [
        String.raw`E_0 = (6.00,\,8.00)`,
        String.raw`E_1 = (8.00,\,10.00)`
      ],
      reveal: { start: 0.7, end: 0.88 }
    }),
    group({
      id: "changes",
      label: "Exact changes",
      targetIds: ["quantity-guides", "price-guides"],
      latex: [String.raw`\Delta Q = +2.00`, String.raw`\Delta P = +2.00`],
      reveal: { start: 0.86, end: 1 }
    })
  ]);

export function projectKpEconomicsVerificationReveal(
  supplyMovementProgress: number
): KpEconomicsVerificationRevealProjection {
  const progress = Number.isFinite(supplyMovementProgress)
    ? Math.max(0, Math.min(1, supplyMovementProgress))
    : 0;
  const groups = Object.freeze(Object.fromEntries(
    kpEconomicsVerificationGroups.map(({ id, reveal }) => [
      id,
      revealProgress(progress, reveal.start, reveal.end)
    ])
  ) as unknown as Record<KpEconomicsVerificationGroupId, number>);
  const phase = progress >= 1
    ? "verified"
    : [...kpEconomicsVerificationGroups].reverse().find(
        ({ id }) => groups[id] > 0
      )?.id ?? "hidden";

  return Object.freeze({ phase, groups });
}

function revealProgress(progress: number, start: number, end: number): number {
  const linear = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return linear * linear * (3 - 2 * linear);
}

function group(
  input: KpEconomicsVerificationGroup
): KpEconomicsVerificationGroup {
  return Object.freeze({
    ...input,
    targetIds: Object.freeze([...input.targetIds]),
    latex: Object.freeze([...input.latex]),
    reveal: Object.freeze({ ...input.reveal })
  });
}
