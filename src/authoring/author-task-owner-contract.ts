import type { SupportedAuthorTask } from "./supported-author-tasks.ts";

type OwnerOutcome = { readonly status: "compiled" | "compiled-artifact" | "existing-artifact" | "semantic-plan-only" | "repair-gap" | "repair-required" };
/** Discovery completeness is framework-neutral; filesystem loading is not. */
export type KpAuthorTaskOwners = { readonly [Task in SupportedAuthorTask]: {
  readonly example: () => unknown | Promise<unknown>;
  readonly check: (json: string) => OwnerOutcome | Promise<OwnerOutcome>;
} };
