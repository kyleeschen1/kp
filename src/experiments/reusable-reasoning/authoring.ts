import type { KpAnimationAsset } from "../../animation/asset.ts";
import { bindKpReasoningEvidence } from "./evidence.ts";
import { createKpReasoningSource, KpReasoningRepairGap } from "./source.ts";
import { projectReasoningReading } from "./readings.ts";
import { projectReasoningPrompts } from "./prompts.ts";
import { extractKpReasoningContext } from "./extraction.ts";

export function compileReasoningDraft(value: unknown, animation: KpAnimationAsset) {
  const evidence = bindKpReasoningEvidence(value);
  return Object.freeze({ evidence, context: extractKpReasoningContext(evidence),
    full: projectReasoningReading(evidence, "full"), compact: projectReasoningReading(evidence, "compact"),
    prompts: projectReasoningPrompts(evidence, animation) });
}

export function createReasoningAuthoringSession(animation: KpAnimationAsset) {
  let current = compileReasoningDraft(createKpReasoningSource(), animation);
  return {
    getCurrent: () => current,
    apply(json: string) {
      try {
        if (json.length > 100_000) throw new KpReasoningRepairGap("kp.reasoning.draft-size", "$", "Keep this bounded example under 100,000 characters.");
        const candidate = compileReasoningDraft(JSON.parse(json), animation);
        // Publish only after every projection binds. Failed drafts cannot mix
        // a new caption with old ink, or a new answer with an old revision.
        current = candidate;
        return { status: "applied" as const, current };
      } catch (error) {
        if (!(error instanceof KpReasoningRepairGap) && !(error instanceof SyntaxError)) throw error;
        return { status: "repair-gap" as const, current, diagnostic: error instanceof KpReasoningRepairGap
          ? { code: error.code, path: error.path, expected: error.expected }
          : { code: "kp.reasoning.json", path: "$", expected: "Provide valid JSON before applying the draft." } };
      }
    }
  };
}
