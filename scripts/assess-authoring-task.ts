import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readAuthorSource } from "./author-check.ts";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { compileKpEquationSeriesLogarithmBaseText } from "../src/authoring/equation-series-logarithm-base-draft.ts";

export type RetainedAuthorTask = "urn-prior-third" | "log-base-three";
type Assessment = { readonly task: RetainedAuthorTask; readonly authority: "task-assessment-only";
  readonly editorialQuality: "not-assessed" } & (
  | { readonly status: "repair-gap"; readonly compilation: "rejected" }
  | { readonly status: "intent-gap"; readonly compilation: "accepted"; readonly unmet: readonly string[] }
  | { readonly status: "fulfilled"; readonly compilation: "accepted" }
);

/** Two executable task rubrics, not a prose grader or another semantic verifier.
 * Compare compiler-owned values; matching the requested posterior alone would
 * accidentally accept a different probability problem. */
export function assessRetainedAuthorTask(task: RetainedAuthorTask, json: string): Assessment {
  const base = { task, authority: "task-assessment-only", editorialQuality: "not-assessed" } as const;
  const unmet: string[] = [];
  if (task === "urn-prior-third") {
    const result = checkBayesDraft(json);
    if (result.status !== "compiled") return { ...base, status: "repair-gap", compilation: "rejected" };
    const draft = result.draft;
    if (draft.model.events.map(event => event.id).join(",") !== "urn-a,red") unmet.push("Use the selected urn-a and red event identities.");
    const masses = draft.model.outcomes.map(outcome => `${outcome.mass.numerator}/${outcome.mass.denominator}`);
    if (masses.join(",") !== "1/12,1/4,1/2,1/6") unmet.push("Represent prior 1/3 and likelihoods 1/4 and 3/4, equivalently by their four exact joint masses.");
    if (draft.teaching.firstEventId !== "red" || draft.teaching.detailLevel !== "key-steps")
      unmet.push("Use red-first key-steps teaching.");
  } else {
    const result = compileKpEquationSeriesLogarithmBaseText(json);
    if (result.status !== "compiled") return { ...base, status: "repair-gap", compilation: "rejected" };
    const { base: logarithmBase, argument } = result.semantic.source;
    if (logarithmBase.kind !== "number" || logarithmBase.value !== 3 || argument.kind !== "number" || argument.value !== 9)
      unmet.push("Express the supported change of base for log base 3 of 9.");
  }
  return unmet.length ? { ...base, status: "intent-gap", compilation: "accepted", unmet }
    : { ...base, status: "fulfilled", compilation: "accepted" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [flag, task, mode, path, ...extra] = process.argv.slice(2);
  if (flag !== "--task" || (task !== "urn-prior-third" && task !== "log-base-three") || mode !== "--request" || !path || extra.length)
    throw new Error("Use --task urn-prior-third|log-base-three --request path|-.");
  const result = assessRetainedAuthorTask(task, readAuthorSource(path));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "fulfilled") process.exitCode = 2;
}
