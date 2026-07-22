export interface KpReaderUrlStateCodec<TState> {
  readonly parameters: readonly string[];
  readonly read: (parameters: URLSearchParams) => TState;
  readonly write: (parameters: URLSearchParams, state: TState) => void;
}

type KpReaderUrlCodecState<TCodec> =
  TCodec extends KpReaderUrlStateCodec<infer TState> ? TState : never;

interface KpReaderUrlStateCodecShape {
  readonly parameters: readonly string[];
  readonly read: (parameters: URLSearchParams) => unknown;
  readonly write: (parameters: URLSearchParams, state: never) => void;
}

export function defineKpReaderUrlStateCodec<
  const TParameters extends readonly string[],
  TState
>(codec: KpReaderUrlStateCodec<TState> & {
  readonly parameters: TParameters;
}): KpReaderUrlStateCodec<TState> & { readonly parameters: TParameters } {
  if (codec.parameters.length === 0) {
    throw new Error("Reader URL codec must own at least one parameter.");
  }
  if (new Set(codec.parameters).size !== codec.parameters.length) {
    throw new Error("Reader URL codec parameters must be unique.");
  }
  return codec;
}

export function composeKpReaderUrlStateCodecs<
  const TCodecs extends Readonly<Record<string, KpReaderUrlStateCodecShape>>
>(codecs: TCodecs) {
  const entries = Object.entries(codecs) as Array<[
    keyof TCodecs,
    TCodecs[keyof TCodecs]
  ]>;
  const owners = new Map<string, PropertyKey>();
  for (const [key, codec] of entries) {
    for (const parameter of codec.parameters) {
      const owner = owners.get(parameter);
      if (owner !== undefined) {
        throw new Error(`Reader URL parameter ${parameter} is owned by both ${String(owner)} and ${String(key)}.`);
      }
      owners.set(parameter, key);
    }
  }

  type State = { readonly [K in keyof TCodecs]: KpReaderUrlCodecState<TCodecs[K]> };
  return {
    parameters: [...owners.keys()] as readonly string[],
    read(input: string | URL): State {
      const parameters = new URL(input).searchParams;
      return Object.fromEntries(entries.map(([key, codec]) => [
        key,
        codec.read(parameters)
      ])) as State;
    },
    write(baseUrl: string | URL, state: State): string {
      const url = new URL(baseUrl);
      for (const parameter of owners.keys()) url.searchParams.delete(parameter);
      for (const [key, codec] of entries) {
        codec.write(url.searchParams, state[key] as never);
      }
      url.searchParams.sort();
      return url.toString();
    }
  } as const;
}
