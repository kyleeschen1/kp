// Domain callers keep their established vocabulary while arithmetic ownership
// lives beside the provider protocol, so providers never depend on a KP pack.
export {
  addExactRationals as addKpRationals,
  createExactRational as createKpRational,
  divideExactRationals as divideKpRationals,
  equalExactRationals as equalKpRationals,
  isZeroExactRational as isZeroKpRational,
  multiplyExactRationals as multiplyKpRationals,
  negateExactRational as negateKpRational,
  subtractExactRationals as subtractKpRationals,
  type NormalizedExactRational as KpNormalizedRational
} from "../../protocols/public-api.ts";
