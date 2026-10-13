// Arithmetic-only public entrypoint: browser consumers must not initialize
// unrelated protocol schemas merely to use neutral exact values.
export {
  addExactRationals, createExactRational, divideExactRationals, equalExactRationals,
  isZeroExactRational, multiplyExactRationals, negateExactRational, subtractExactRationals,
  type NormalizedExactRational
} from './exact-rational.ts';
