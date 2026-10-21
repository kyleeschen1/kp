import { readKpCommonFactorSource } from "./common-factor-source.ts";
import primarySource from "./examples/common-factor-primary.json" with { type: "json" };

export function createKpCommonFactorExample() {
  return readKpCommonFactorSource(primarySource);
}
