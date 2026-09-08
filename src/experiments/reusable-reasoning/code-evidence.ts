import instruction from "../../tutorial/kinetic-figure-typescript-focus-card/typescript-instruction.generated.json" with { type: "json" };
import { createKpTypeScriptFreeShippingRuntimeProjection } from "../../public-web/typescript-free-shipping-runtime.ts";
import { createKpTypeScriptRefactorBehaviorCertificate } from "../../semantic/typescript-refactor-behavior-proof.ts";
import { createKpTypeScriptRefactorOperationSet } from "../../semantic/typescript-refactor-operations.ts";
import { sha256 } from "../../kernel/sha256.ts";

export class KpCodeReasoningRepairGap extends Error {
  readonly code = "kp.reasoning.code-binding";
  readonly path: string;
  readonly expected: string;
  constructor(path: string, expected: string) { super(`${path}: ${expected}`); this.path = path; this.expected = expected; }
}

export function createCodeReasoningSource() {
  return { title: "One decision, two callers", statement: "The two callers can share a named threshold decision.",
    explanation: "Name the helper, move the decision, then replace each caller. Check behavior at the declared threshold cases.",
    sourceRevisionId: "free-shipping.before.v1", targetRevisionId: "free-shipping.after.v1",
    stageIds: instruction.score.beats.map(beat => beat.stageId) };
}

/** Code owns syntax, correspondence and bounded proof; equation evidence is never imported. */
export function bindCodeReasoningEvidence(value: unknown = createCodeReasoningSource()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new KpCodeReasoningRepairGap("$", "Provide a bounded code reasoning source.");
  const input = value as Record<string, unknown>, expected = createCodeReasoningSource();
  for (const key of Object.keys(input)) if (!(key in expected)) throw new KpCodeReasoningRepairGap(`$.${key}`, "Author prose and existing source/stage pins, not semantic or renderer authority.");
  for (const key of ["title", "statement", "explanation"] as const) {
    if (typeof input[key] !== "string" || input[key].trim().length === 0 || input[key].length > 4000) {
      throw new KpCodeReasoningRepairGap(`$.${key}`, "Provide nonempty bounded editorial prose.");
    }
  }
  for (const key of ["sourceRevisionId", "targetRevisionId", "stageIds"] as const) {
    if (JSON.stringify(input[key]) !== JSON.stringify(expected[key])) throw new KpCodeReasoningRepairGap(`$.${key}`, "Retain exact canonical source revisions and ordered pedagogical stages; new code transformations need language-owned evidence.");
  }
  const source = Object.freeze({ ...expected, title: input["title"] as string,
    statement: input["statement"] as string, explanation: input["explanation"] as string,
    stageIds: Object.freeze([...expected.stageIds]) });
  const runtime = createKpTypeScriptFreeShippingRuntimeProjection();
  const operations = createKpTypeScriptRefactorOperationSet(runtime.semantics);
  const certificate = createKpTypeScriptRefactorBehaviorCertificate(runtime.semantics);
  if (certificate.status !== "passed") throw new KpCodeReasoningRepairGap("$.evidence", "Declared behavior cases must pass.");
  const steps = instruction.score.beats.map((beat, index) => {
    const stage = runtime.score.stages[index];
    if (!stage || stage.id !== beat.stageId || stage.checkpointMs / runtime.score.durationMs !== beat.timelineProgress
      || stage.transformationIds.some(id => !operations.transformations.some(operation => operation.id === id))) {
      throw new KpCodeReasoningRepairGap(`$.stageIds[${index}]`, "Article beats must agree with the language score and transformation set.");
    }
    return Object.freeze({ ...beat, transformationIds: stage.transformationIds,
      html: instruction.phraseHtml[beat.id as keyof typeof instruction.phraseHtml] });
  });
  const revisionId = `sha256:${sha256(JSON.stringify({ source, semantics: runtime.semantics, steps, certificate }))}`;
  const context = Object.freeze({ revisionId, sourceId: "lesson.reasoning.typescript-extract-helper",
    parentId: "claim.typescript.shared-decision", reasonId: "reason.typescript.extract-helper",
    editorialStatus: "editorial" as const,
    // Intermediate stages are presentation checkpoints, not seven independently
    // compiled programs or a proof of equivalence for arbitrary TypeScript.
    checkpointKind: "pedagogical-stage" as const,
    sources: runtime.semantics.revisions,
    assumptions: Object.freeze(["Only the exact canonical TypeScript sources are supported.",
      "Behavioral evidence covers the three declared threshold cases, not arbitrary programs or inputs."]),
    certificate, operations: operations.transformations, lineage: operations.lineage,
    steps: Object.freeze(steps) });
  return Object.freeze({ source, revisionId, context, runtime });
}

export type KpCodeReasoningEvidence = ReturnType<typeof bindCodeReasoningEvidence>;

export function captureCodeReasoningReturn(evidence: KpCodeReasoningEvidence, progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new KpCodeReasoningRepairGap("$.return.progress", "Return within the canonical code timeline.");
  const stage = [...evidence.context.steps].reverse().find(step => step.timelineProgress <= progress)!;
  return Object.freeze({ sourceId: evidence.context.sourceId, revisionId: evidence.revisionId,
    parentId: evidence.context.parentId, stageId: stage.stageId, progress });
}

export function restoreCodeReasoningReturn(evidence: KpCodeReasoningEvidence, value: unknown) {
  const candidate = value as ReturnType<typeof captureCodeReasoningReturn> | null;
  if (!candidate || typeof candidate !== "object") throw new KpCodeReasoningRepairGap("$.return", "Provide a revision-pinned code return address.");
  const expected = captureCodeReasoningReturn(evidence, candidate.progress);
  for (const key of ["sourceId", "revisionId", "parentId", "stageId"] as const) {
    if (candidate[key] !== expected[key]) throw new KpCodeReasoningRepairGap(`$.return.${key}`, "Restore this exact source revision and semantic stage.");
  }
  return expected;
}
