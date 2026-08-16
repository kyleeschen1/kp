export type KpVerificationTier = "inner" | "boundary" | "promotion" | "release";

export interface KpVerificationCommand {
  readonly command: string;
  readonly tier: KpVerificationTier;
  readonly purpose: string;
}

export const canonicalVerificationCommands = Object.freeze([
  Object.freeze({
    command: "verify:equation:inner",
    tier: "inner",
    purpose: "Fast equation discovery checks for the current implementation seam."
  }),
  Object.freeze({
    command: "verify:equation:boundary",
    tier: "boundary",
    purpose: "Equation contracts across authoring, compilation, and rendering boundaries."
  }),
  Object.freeze({
    command: "verify:equation:promotion",
    tier: "promotion",
    purpose: "Promotion evidence after an exemplar has passed human review."
  }),
  Object.freeze({
    command: "verify:equation:release",
    tier: "release",
    purpose: "The broad equation release matrix."
  }),
  Object.freeze({
    command: "health:pre-expansion",
    tier: "boundary",
    purpose: "Repository health before adding a new asset family."
  }),
  Object.freeze({
    command: "health:pre-expansion:release",
    tier: "release",
    purpose: "Full pre-expansion release, browser, build, bundle, and workspace gate."
  })
] satisfies readonly KpVerificationCommand[]);

export const verificationCommandAliases = Object.freeze([
  Object.freeze({
    command: "verify:equation",
    target: "verify:equation:inner"
  })
] as const);

