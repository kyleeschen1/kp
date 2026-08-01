export interface KpBoundedIntegerQueryParameter {
  readonly queryKey: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly defaultValue: number;
}

export function readKpBoundedIntegerQueryParameter(input: {
  readonly search: string;
  readonly parameter: KpBoundedIntegerQueryParameter;
}): number {
  return normalizeKpBoundedIntegerQueryParameter({
    value: new URLSearchParams(input.search).get(input.parameter.queryKey),
    parameter: input.parameter
  });
}

export function normalizeKpBoundedIntegerQueryParameter(input: {
  readonly value: string | number | null | undefined;
  readonly parameter: KpBoundedIntegerQueryParameter;
}): number {
  const parsed = typeof input.value === "number"
    ? input.value
    : Number(input.value);
  return Number.isInteger(parsed) &&
    parsed >= input.parameter.minimum &&
    parsed <= input.parameter.maximum
    ? parsed
    : input.parameter.defaultValue;
}

export function writeKpBoundedIntegerQueryParameter(input: {
  readonly search: string;
  readonly parameter: KpBoundedIntegerQueryParameter;
  readonly value: number;
}): string {
  const params = new URLSearchParams(input.search);
  const value = normalizeKpBoundedIntegerQueryParameter({
    value: input.value,
    parameter: input.parameter
  });
  if (value === input.parameter.defaultValue) {
    params.delete(input.parameter.queryKey);
  } else {
    params.set(input.parameter.queryKey, String(value));
  }
  const search = params.toString();
  return search.length === 0 ? "" : `?${search}`;
}
