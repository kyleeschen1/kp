export interface KpCounterOrbitCancellationTiming {
  readonly meetStart: number;
  readonly contactAt: number;
  readonly retirementEnd: number;
}

/**
 * Contact is a semantic ordering boundary: inverse terms remain readable until
 * they share a center, then retire together. Both equation paint paths consume
 * this authority so a renderer cannot silently fade material before contact.
 */
export const kpCounterOrbitCancellationTiming = Object.freeze({
  meetStart: 0.42,
  contactAt: 0.68,
  retirementEnd: 0.78
} satisfies KpCounterOrbitCancellationTiming);
