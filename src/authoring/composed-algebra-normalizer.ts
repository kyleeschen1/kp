import { normalizeKpScalarSumProductEndpoint } from "./common-factor-normalizer.ts";
import { KpCommonFactorRepair } from "./common-factor-source.ts";
import { KpComposedAlgebraRepair, readKpComposedAlgebraSource, type KpComposedAlgebraSource } from "./composed-algebra-source.ts";

export function normalizeKpComposedAlgebraEndpoints(value: KpComposedAlgebraSource) {
  const source = readKpComposedAlgebraSource(value);
  const normalize = (index: 0 | 1 | 2) => {
    try { return normalizeKpScalarSumProductEndpoint(source.states[index], source.symbols, `$.states[${index}].latex`); }
    catch (error) {
      if (error instanceof KpCommonFactorRepair) throw new KpComposedAlgebraRepair(error.code, error.path, error.message);
      throw error;
    }
  };
  return Object.freeze([normalize(0), normalize(1), normalize(2)] as const);
}
