export const kpReaderEquationDerivationModes = [
  "balanced-operation-v1",
  "certified-transfer-v1"
] as const;

export type KpReaderEquationDerivationMode =
  typeof kpReaderEquationDerivationModes[number];

export const kpReaderEquationIdentityModes = [
  "hold-until-settled-v1",
  "omit-transient-v1"
] as const;

export type KpReaderEquationIdentityMode =
  typeof kpReaderEquationIdentityModes[number];

export interface KpReaderEquationPresentationAxes {
  readonly derivation: KpReaderEquationDerivationMode;
  readonly identity: KpReaderEquationIdentityMode;
}

/**
 * Presentation axes may project a certified trace, but never author algebra,
 * correspondence, geometry, or timing. Keeping this runtime choice separate
 * from asset recipe metadata prevents a URL or provider from changing truth.
 */
export function defineKpReaderEquationPresentationAxes<
  const TAxes extends KpReaderEquationPresentationAxes
>(axes: TAxes): Readonly<TAxes> {
  assertMember("derivation", axes.derivation, kpReaderEquationDerivationModes);
  assertMember("identity", axes.identity, kpReaderEquationIdentityModes);
  return Object.freeze({ ...axes });
}

function assertMember<const TValue extends string>(
  axis: string,
  value: string,
  allowed: readonly TValue[]
): asserts value is TValue {
  if (!allowed.includes(value as TValue)) {
    throw new Error(`Unknown reader equation ${axis} mode ${value}.`);
  }
}
