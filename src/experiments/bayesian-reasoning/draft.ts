import { BinaryJointModel, createFlaggedTicketSource, ProbabilityRepairGap, type ProbabilityRepairDiagnostic } from "../../../domains/probability/binary-joint-model.ts";
import { compileBinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { createBayesSourceAuthority, createBayesConstructionRequest, compileBayesConstruction } from "./evidence.ts";
import { compileBayesNotation } from "./notation.ts";
import { createBayesScore } from "./score.ts";
import { createBayesTreePlan } from "./tree-frame.ts";
import { readBayesSourceEnvelope } from "./editorial-source.ts";
import { bindBayesEditorial } from "./editorial-binding.ts";

const preparedDrafts = new WeakSet<object>();
const preparedBrand = Symbol("compiled Bayesian author draft");

export function createBayesDraft() {
  const model = createFlaggedTicketSource();
  return { schemaVersion: "kp.bayes-source.v1", model,
    teaching: { firstEventId: model.events[0]!.id, detailLevel: "complete" } };
}

function orderedJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(orderedJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, orderedJson(item)]));
  return value;
}

/** Compile all synchronous projections before a host may prepare live surfaces.
 * Detail changes explanation selection, never the seven lawful semantic stops. */
function compileDraft(json: string) {
  if (json.length > 100_000) throw new ProbabilityRepairGap("probability.source", "$", "Keep the draft under 100,000 characters.");
  const raw: unknown = JSON.parse(json), source = readBayesSourceEnvelope(raw);
  const teaching = source.teaching, detail = teaching.detailLevel;
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
  const editorial = source.schemaVersion === "kp.bayes-source.v2" ? bindBayesEditorial(trace, source.editorial) : null;
  const notation = compileBayesNotation(trace), score = createBayesScore(trace), tree = createBayesTreePlan(trace);
  // Evidence pins describe domain operations. The authored revision also pins
  // explanation detail; whitespace or JSON key order is not a semantic edit.
  const identity = { evidence: authority.revisionId, detailLevel: detail };
  const revisionId = `sha256:${sha256(JSON.stringify(editorial === null ? identity
    : { ...identity, schemaVersion: source.schemaVersion, editorial: editorial.source }))}`;
  const draft = Object.freeze({ [preparedBrand]: true as const, model, trace, authority, construction, notation, score, tree, revisionId, editorial,
    teaching: Object.freeze({ firstEventId: model.events[first].id, detailLevel: detail }),
    // Keep v1 export bytes unchanged; v2 canonicalizes object order, never prose.
    sourceText: JSON.stringify(editorial === null ? raw : orderedJson(source), null, 2) });
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
