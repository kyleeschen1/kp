import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readAuthorSource, runAuthorCheckCli } from "./author-check.ts";
import { assessRetainedAuthorTask } from "./assess-authoring-task.ts";

const tasks = [
  { task: "urn-prior-third", owner: "bayes.binary", source: "content/authoring/r4a-urn-prior.bayes.json" },
  { task: "log-base-three", owner: "equation.logarithm-base", source: "content/authoring/r4a-logarithm-base.json" }
] as const;
const statusOf = (value: unknown) => value && typeof value === "object" && "status" in value ? value.status : undefined;

/** Execute the published local packet, not a model trial or an author-time estimate. */
export async function runAuthoringTaskPacket() {
  const results = [];
  for (const task of tasks) {
    const text = readAuthorSource(task.source);
    const checked = await runAuthorCheckCli(["--task", task.owner, "--request", task.source]);
    const starter = JSON.stringify(await runAuthorCheckCli(["--task", task.owner, "--example"]));
    const starterChecked = await runAuthorCheckCli(["--task", task.owner, "--request", "fixture"], () => starter);
    const rejected = await runAuthorCheckCli(["--task", task.owner, "--request", "fixture"], () => "{}");
    const fulfilled = assessRetainedAuthorTask(task.task, text);
    const untouched = assessRetainedAuthorTask(task.task, starter);
    const checks = {
      selectedCompiles: statusOf(checked) === "checked",
      selectedFulfills: fulfilled.status === "fulfilled",
      starterCompiles: statusOf(starterChecked) === "checked",
      starterFailsChangedIntent: untouched.status === "intent-gap",
      invalidReturnsRepair: statusOf(rejected) === "repair-gap"
    };
    results.push({ ...task, bytes: Buffer.byteLength(text, "utf8"),
      sha256: createHash("sha256").update(text).digest("hex"), sourceFiles: 1,
      checks, assessment: fulfilled, rejectedExample: rejected });
  }
  return { kind: "kp.authoring-task-packet-result.v1", authority: "local-deterministic-assessment",
    status: results.every(result => Object.values(result.checks).every(Boolean)) ? "passed" : "failed",
    externalModelCalls: 0, authorTime: "not-measured", comprehension: "not-measured", results } as const;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new Error("Run the fixed local packet without arguments; it never calls a model or writes source.");
  const result = await runAuthoringTaskPacket();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "passed") process.exitCode = 2;
}
