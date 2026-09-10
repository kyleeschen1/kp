import { normalizeKpScalarSumProductEndpoint } from "./common-factor-normalizer.ts";
import { KpCommonFactorRepair } from "./common-factor-source.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { readKpComposedAlgebraSourceV2, type KpComposedAlgebraSourceV2 } from "./composed-algebra-source-v2.ts";

export function normalizeKpComposedAlgebraEndpointsV2(value: KpComposedAlgebraSourceV2) {
  const source = readKpComposedAlgebraSourceV2(value);
  const normalize = (index: number) => {
    try { return normalizeKpScalarSumProductEndpoint(source.states[index]!, source.symbols, `$.states[${index}].latex`); }
    catch (error) {
      if (error instanceof KpCommonFactorRepair) throw new KpComposedAlgebraRepair(error.code, error.path, error.message);
      throw error;
    }
  };
  const prefix = [normalize(0), normalize(1), normalize(2), normalize(3)] as const;
  return source.states.length === 4 ? Object.freeze(prefix) : Object.freeze([...prefix, normalize(4)] as const);
}
