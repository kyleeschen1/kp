import { BinaryJointModel, createFlaggedTicketSource, ProbabilityRepairGap, type ProbabilityRepairDiagnostic } from "../../../domains/probability/binary-joint-model.ts";
import { compileBinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { createBayesSourceAuthority, createBayesConstructionRequest, compileBayesConstruction } from "./evidence.ts";
import { compileBayesNotation } from "./notation.ts";
import { createBayesScore } from "./score.ts";
import { createBayesTreePlan } from "./tree-frame.ts";

const preparedDrafts = new WeakSet<object>();
const preparedBrand = Symbol("compiled Bayesian author draft");

export function createBayesDraft() {
  const model = createFlaggedTicketSource();
  return { schemaVersion: "kp.bayes-source.v1", model,
    teaching: { firstEventId: model.events[0]!.id, detailLevel: "complete" } };
}

function object(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ProbabilityRepairGap("probability.source", path, "Provide an object.");
  const record = value as Record<string, unknown>;
  const extra = Object.keys(record).find(key => !keys.includes(key));
  if (extra) throw new ProbabilityRepairGap("probability.source", `${path}.${extra}`,
    "Unsupported author field or operation. Author exact probability and teaching choices, not geometry, timing, or proof claims.");
  if (keys.some(key => !Object.hasOwn(record, key)))
    throw new ProbabilityRepairGap("probability.source", path, `Provide exactly: ${keys.join(", ")}.`);
  return record;
}

/** Compile all synchronous projections before a host may prepare live surfaces.
 * Detail changes explanation selection, never the seven lawful semantic stops. */
function compileDraft(json: string) {
  if (json.length > 100_000) throw new ProbabilityRepairGap("probability.source", "$", "Keep the draft under 100,000 characters.");
  const source = object(JSON.parse(json), ["schemaVersion", "model", "teaching"], "$");
  if (source["schemaVersion"] !== "kp.bayes-source.v1")
    throw new ProbabilityRepairGap("probability.source", "$.schemaVersion", "Use kp.bayes-source.v1.");
  const teaching = object(source["teaching"], ["firstEventId", "detailLevel"], "$.teaching");
  const detail = teaching["detailLevel"];
  if (detail !== "complete" && detail !== "key-steps")
    throw new ProbabilityRepairGap("probability.source", "$.teaching.detailLevel", "Choose complete or key-steps; neither omits probability operations.");
  let model: BinaryJointModel;
  try { model = BinaryJointModel.from(source["model"]); }
  catch (error) {
    if (error instanceof ProbabilityRepairGap) throw new ProbabilityRepairGap(error.diagnostic.code,
      `$.model${error.diagnostic.path.slice(1)}`, error.diagnostic.expected);
    throw error;
  }
  const first = model.events.findIndex(event => event.id === teaching["firstEventId"]);
  if (first !== 0 && first !== 1) throw new ProbabilityRepairGap("probability.reference", "$.teaching.firstEventId", "Choose one of the model's two event IDs.");
  const trace = compileBinaryProbabilityTrace(model, first), authority = createBayesSourceAuthority(trace);
  const request = createBayesConstructionRequest(authority, detail), construction = compileBayesConstruction(authority, request);
  const notation = compileBayesNotation(trace), score = createBayesScore(trace), tree = createBayesTreePlan(trace);
  // Evidence pins describe domain operations. The authored revision also pins
  // explanation detail; whitespace or JSON key order is not a semantic edit.
  const revisionId = `sha256:${sha256(JSON.stringify({ evidence: authority.revisionId, detailLevel: detail }))}`;
  const draft = Object.freeze({ [preparedBrand]: true as const, model, trace, authority, construction, notation, score, tree, revisionId,
    teaching: Object.freeze({ firstEventId: model.events[first].id, detailLevel: detail }),
    sourceText: JSON.stringify(source, null, 2) });
  preparedDrafts.add(draft);
  return draft;
}
export type PreparedBayesDraft = ReturnType<typeof compileDraft>;
export function requirePreparedBayesDraft(draft: PreparedBayesDraft): void {
  if (!preparedDrafts.has(draft)) throw new ProbabilityRepairGap("probability.reference", "$.draft", "Compile the source; serialized or copied projection fields do not establish revision authority.");
}
export type BayesDraftCheck = { readonly status: "compiled"; readonly draft: PreparedBayesDraft }
  | { readonly status: "repair-gap"; readonly diagnostic: ProbabilityRepairDiagnostic };
export function checkBayesDraft(json: string): BayesDraftCheck {
  try { return { status: "compiled" as const, draft: compileDraft(json) }; }
  catch (error) {
    if (error instanceof ProbabilityRepairGap) return { status: "repair-gap" as const, diagnostic: error.diagnostic };
    if (error instanceof SyntaxError) return { status: "repair-gap" as const,
      diagnostic: { code: "probability.source" as const, path: "$", expected: "Provide valid JSON." } };
    throw error;
  }
}
