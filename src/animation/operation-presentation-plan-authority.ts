declare const kpVerifiedOperationPresentationPlanIdAuthority: unique symbol;

/**
 * Only the total presentation-plan validator can mint an operation authority
 * id. Keeping this nominal token in a leaf module lets renderer contracts use
 * the proof without importing the full presentation-plan union.
 */
export type KpVerifiedOperationPresentationPlanId = string & {
  readonly [kpVerifiedOperationPresentationPlanIdAuthority]: true;
};
