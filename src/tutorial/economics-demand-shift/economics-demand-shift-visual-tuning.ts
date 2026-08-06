const contextOpacityQueryKey = "context";
const mutedBlueQueryKey = "mutedBlue";
const mutedRedQueryKey = "mutedRed";
const proseLineHeightQueryKey = "leading";
const textWidthQueryKey = "measure";
const proseWeightQueryKey = "weight";

export const kpEconomicsContextOpacityMinimum = 0.1;
export const kpEconomicsContextOpacityMaximum = 1;
export const kpEconomicsContextOpacityStep = 0.05;
export const kpEconomicsContextOpacityDefault = 1;

export const kpEconomicsProseLineHeightMinimum = 1.4;
export const kpEconomicsProseLineHeightMaximum = 2.2;
export const kpEconomicsProseLineHeightStep = 0.02;
export const kpEconomicsProseLineHeightDefault = 1.78;

export const kpEconomicsTextWidthMinimumRem = 16;
export const kpEconomicsTextWidthMaximumRem = 30;
export const kpEconomicsTextWidthStepRem = 0.5;
export const kpEconomicsTextWidthDefaultRem = 24;

export const kpEconomicsProseWeightMinimum = 300;
export const kpEconomicsProseWeightMaximum = 600;
export const kpEconomicsProseWeightStep = 100;
export const kpEconomicsProseWeightDefault = 400;

export function normalizeKpEconomicsContextOpacity(value: number): number {
  return normalizeSteppedValue({
    value,
    minimum: kpEconomicsContextOpacityMinimum,
    maximum: kpEconomicsContextOpacityMaximum,
    step: kpEconomicsContextOpacityStep,
    fallback: kpEconomicsContextOpacityDefault
  });
}

export function readKpEconomicsContextOpacity(search: string): number {
  return readNumber({
    search,
    key: contextOpacityQueryKey,
    normalize: normalizeKpEconomicsContextOpacity,
    fallback: kpEconomicsContextOpacityDefault
  });
}

export function writeKpEconomicsContextOpacity(input: {
  readonly search: string;
  readonly opacity: number;
}): string {
  return writeNumber({
    search: input.search,
    key: contextOpacityQueryKey,
    value: normalizeKpEconomicsContextOpacity(input.opacity),
    fallback: kpEconomicsContextOpacityDefault,
    serialize: (value) => value.toFixed(2)
  });
}

export function readKpEconomicsMutedBlue(search: string): boolean {
  return new URLSearchParams(search).get(mutedBlueQueryKey) === "1";
}

export function writeKpEconomicsMutedBlue(input: {
  readonly search: string;
  readonly muted: boolean;
}): string {
  return writeBoolean({
    search: input.search,
    key: mutedBlueQueryKey,
    value: input.muted
  });
}

export function readKpEconomicsMutedRed(search: string): boolean {
  return new URLSearchParams(search).get(mutedRedQueryKey) === "1";
}

export function writeKpEconomicsMutedRed(input: {
  readonly search: string;
  readonly muted: boolean;
}): string {
  return writeBoolean({
    search: input.search,
    key: mutedRedQueryKey,
    value: input.muted
  });
}

export function normalizeKpEconomicsProseLineHeight(value: number): number {
  return normalizeSteppedValue({
    value,
    minimum: kpEconomicsProseLineHeightMinimum,
    maximum: kpEconomicsProseLineHeightMaximum,
    step: kpEconomicsProseLineHeightStep,
    fallback: kpEconomicsProseLineHeightDefault
  });
}

export function readKpEconomicsProseLineHeight(search: string): number {
  return readNumber({
    search,
    key: proseLineHeightQueryKey,
    normalize: normalizeKpEconomicsProseLineHeight,
    fallback: kpEconomicsProseLineHeightDefault
  });
}

export function writeKpEconomicsProseLineHeight(input: {
  readonly search: string;
  readonly lineHeight: number;
}): string {
  return writeNumber({
    search: input.search,
    key: proseLineHeightQueryKey,
    value: normalizeKpEconomicsProseLineHeight(input.lineHeight),
    fallback: kpEconomicsProseLineHeightDefault,
    serialize: (value) => value.toFixed(2)
  });
}

export function normalizeKpEconomicsTextWidthRem(value: number): number {
  return normalizeSteppedValue({
    value,
    minimum: kpEconomicsTextWidthMinimumRem,
    maximum: kpEconomicsTextWidthMaximumRem,
    step: kpEconomicsTextWidthStepRem,
    fallback: kpEconomicsTextWidthDefaultRem
  });
}

export function readKpEconomicsTextWidthRem(search: string): number {
  return readNumber({
    search,
    key: textWidthQueryKey,
    normalize: normalizeKpEconomicsTextWidthRem,
    fallback: kpEconomicsTextWidthDefaultRem
  });
}

export function writeKpEconomicsTextWidthRem(input: {
  readonly search: string;
  readonly widthRem: number;
}): string {
  return writeNumber({
    search: input.search,
    key: textWidthQueryKey,
    value: normalizeKpEconomicsTextWidthRem(input.widthRem),
    fallback: kpEconomicsTextWidthDefaultRem,
    serialize: serializeHalfStep
  });
}

export function normalizeKpEconomicsProseWeight(value: number): number {
  return normalizeSteppedValue({
    value,
    minimum: kpEconomicsProseWeightMinimum,
    maximum: kpEconomicsProseWeightMaximum,
    step: kpEconomicsProseWeightStep,
    fallback: kpEconomicsProseWeightDefault
  });
}

export function readKpEconomicsProseWeight(search: string): number {
  return readNumber({
    search,
    key: proseWeightQueryKey,
    normalize: normalizeKpEconomicsProseWeight,
    fallback: kpEconomicsProseWeightDefault
  });
}

export function writeKpEconomicsProseWeight(input: {
  readonly search: string;
  readonly weight: number;
}): string {
  return writeNumber({
    search: input.search,
    key: proseWeightQueryKey,
    value: normalizeKpEconomicsProseWeight(input.weight),
    fallback: kpEconomicsProseWeightDefault,
    serialize: String
  });
}

function readNumber(input: {
  readonly search: string;
  readonly key: string;
  readonly normalize: (value: number) => number;
  readonly fallback: number;
}): number {
  const value = new URLSearchParams(input.search).get(input.key);
  return value === null || value.trim() === ""
    ? input.fallback
    : input.normalize(Number(value));
}

function writeNumber(input: {
  readonly search: string;
  readonly key: string;
  readonly value: number;
  readonly fallback: number;
  readonly serialize: (value: number) => string;
}): string {
  const parameters = new URLSearchParams(input.search);
  if (input.value === input.fallback) parameters.delete(input.key);
  else parameters.set(input.key, input.serialize(input.value));
  return serializeSearch(parameters);
}

function writeBoolean(input: {
  readonly search: string;
  readonly key: string;
  readonly value: boolean;
}): string {
  const parameters = new URLSearchParams(input.search);
  if (input.value) parameters.set(input.key, "1");
  else parameters.delete(input.key);
  return serializeSearch(parameters);
}

function normalizeSteppedValue(input: {
  readonly value: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  readonly fallback: number;
}): number {
  if (!Number.isFinite(input.value)) return input.fallback;
  const stepped = Math.round(input.value / input.step) * input.step;
  return Math.max(
    input.minimum,
    Math.min(input.maximum, Number(stepped.toFixed(4)))
  );
}

function serializeHalfStep(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function serializeSearch(parameters: URLSearchParams): string {
  const serialized = parameters.toString();
  return serialized === "" ? "" : `?${serialized}`;
}
