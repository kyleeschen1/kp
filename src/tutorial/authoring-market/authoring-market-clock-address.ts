import { createKpSemanticProgress } from "../../semantic-state/semantic-progress.ts";
import { createKpInTransitionSemanticStateCompositionAddress, createKpSettledSemanticStateCompositionAddress } from "../../semantic-state/state-family-composition-address.ts";
import type { createKpSemanticStateComposedMarketPacket } from "../typed-linear-supply-demand/semantic-state-composed-market.ts";

export const kpAuthoringMarketClockResolution = 1_000_000;

export class KpAuthoringMarketClockError extends Error {
  readonly code = "kp.authoring.invalid-clock-address";
  constructor(message: string) { super(message); this.name = "KpAuthoringMarketClockError"; }
}

/** Match the canonical figure's nearest-millionth policy, not a new clock. */
export function quantizeKpAuthoringMarketProgress(progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new KpAuthoringMarketClockError("Reader progress must be finite and within [0, 1].");
  }
  return createKpSemanticProgress(BigInt(Math.round(progress * kpAuthoringMarketClockResolution)),
    BigInt(kpAuthoringMarketClockResolution));
}

export function projectKpAuthoringMarketClockAddress(input: {
  readonly packet: ReturnType<typeof createKpSemanticStateComposedMarketPacket>;
  readonly member: "demand" | "tax";
  readonly progress: number;
}) {
  const progress = quantizeKpAuthoringMarketProgress(input.progress);
  const { packet } = input;
  const timeline = packet.compositionHandles.root.children.timeline.children;
  if (input.member !== "demand" && input.member !== "tax") {
    throw new KpAuthoringMarketClockError("Choose an authored demand or tax member.");
  }
  const target = input.member === "demand"
    ? timeline["demand-shift"].children["raise-demand"]
    : timeline["tax-policy"].children["add-tax"];
  const applied = packet.chain.applications.find(item => item.memberId === target.id);
  if (applied === undefined) throw new KpAuthoringMarketClockError("The clock member has no applied endpoint authority.");
  const handles = packet.compositionHandles;
  // Quantized endpoint neighborhoods resolve settled history directly. The
  // adapter neither replays earlier members nor manufactures sample snapshots.
  const endpointOffset = progress.numerator === 0n ? 0
    : progress.numerator === progress.denominator ? 1 : undefined;
  const address = endpointOffset === undefined
    ? createKpInTransitionSemanticStateCompositionAddress({ handles, target, progress })
    : createKpSettledSemanticStateCompositionAddress({ handles,
      boundary: handles.boundaries[applied.stepIndex + endpointOffset]! });
  return Object.freeze({ address, progress });
}
