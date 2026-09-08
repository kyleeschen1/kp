import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import type { PreparedBayesDraft } from "./draft.ts";
import { pinBayesPosition, resolveBayesPosition, type BayesPosition, type BayesDisclosure } from "./extraction.ts";

export type BayesLocation = { readonly schemaVersion: "kp.bayes-location.v1"; readonly position: BayesPosition } & (
  { readonly view: "parent"; readonly returnTo?: never } | { readonly view: "reason"; readonly returnTo: BayesPosition });

export function captureBayesLocation(draft: PreparedBayesDraft, step: number, disclosure: BayesDisclosure): BayesLocation {
  const base = { schemaVersion: "kp.bayes-location.v1" as const, position: pinBayesPosition(draft, step) };
  return Object.freeze(disclosure.view === "parent" ? { ...base, view: "parent" as const }
    : { ...base, view: "reason" as const, returnTo: resolveBayesPosition(draft, disclosure.extraction.returnTo) });
}
export function validateBayesLocation(draft: PreparedBayesDraft, value: unknown): BayesLocation {
  if (!value || typeof value !== "object") return invalid();
  const candidate = value as Partial<BayesLocation>;
  if (candidate.schemaVersion !== "kp.bayes-location.v1") return invalid();
  const position = resolveBayesPosition(draft, candidate.position);
  if (candidate.view === "parent" && !Object.hasOwn(candidate, "returnTo"))
    return Object.freeze({ schemaVersion: candidate.schemaVersion, position, view: "parent" });
  if (candidate.view === "reason") return Object.freeze({ schemaVersion: candidate.schemaVersion, position,
    view: "reason", returnTo: resolveBayesPosition(draft, candidate.returnTo) });
  return invalid();
}
export function encodeBayesLocation(value: BayesLocation): string {
  return `#${new URLSearchParams({ bayes: JSON.stringify(value) })}`;
}
export function readBayesLocation(hash: string): unknown {
  if (!hash) return undefined;
  if (hash.length > 16_000) return invalid();
  const params = new URLSearchParams(hash.slice(1)), json = params.get("bayes");
  if (json === null || json.length > 10_000 || params.getAll("bayes").length !== 1) return invalid();
  try { return JSON.parse(json); } catch { return invalid(); }
}
function invalid(): never {
  throw new ProbabilityRepairGap("probability.reference", "$.location", "Use a bounded Bayesian address with a valid view and revision-pinned return context.");
}
