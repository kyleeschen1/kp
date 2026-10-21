import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readAuthorSource } from "./author-check.ts";
import { assessRetainedAuthorTask } from "./assess-authoring-task.ts";

const cases = [
  { task: "calculus-stationary", owner: "calculus.change-propagation", source: "content/authoring/transfer/stationary-change.json", wrong: "content/authoring/transfer/two-reversals.json", builder: "build-calculus-edition.ts", interactive: true },
  { task: "calculus-two-reversals", owner: "calculus.change-propagation", source: "content/authoring/transfer/two-reversals.json", wrong: "content/authoring/transfer/stationary-change.json", builder: "build-calculus-edition.ts", interactive: true },
  { task: "composed-two-unknowns", owner: "equation.algebra-intuition", source: "src/authoring/examples/composed-algebra-intuition-transfer.json", wrong: "src/authoring/examples/composed-algebra-intuition.json", builder: "build-composed-algebra-edition.ts", interactive: true }
] as const;

function cli(script: string, args: string[], input?: string, expectedExit = 0) {
  const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", `scripts/${script}`, ...args], { encoding: "utf8", input, maxBuffer: 1024 * 1024 });
  if (result.error || result.status !== expectedExit) throw new Error(`${script} exited ${result.status}: ${result.error ?? (result.stderr || result.stdout)}`);
  return JSON.parse(result.stdout);
}

/** Real local CLI processes and fixed task rubrics. No model or prose grading. */
export function checkReproducibleAuthoring() {
  return { authority: "local-deterministic-assessment", externalModelCalls: 0, authorTime: "not-measured", comprehension: "not-measured",
    results: cases.map(item => {
      const checked = cli("author-check.ts", ["--task", item.owner, "--request", item.source]);
      const wrong = cli("author-check.ts", ["--task", item.owner, "--request", item.wrong]);
      const invalid = cli("author-check.ts", ["--task", item.owner, "--request", "-"], "{}", 2);
      const assessment = assessRetainedAuthorTask(item.task, readAuthorSource(item.source));
      if (checked.status !== "checked" || wrong.status !== "checked" || invalid.status !== "repair-gap" || assessment.status !== "fulfilled"
        || assessRetainedAuthorTask(item.task, readAuthorSource(item.wrong)).status !== "intent-gap") throw new Error(`Task replay failed: ${item.task}`);
      const editions = (item.interactive ? [false, true] : [false]).map(interactive => {
        const args = ["--source", item.source, ...(interactive ? ["--interactive"] : [])];
        const built = cli(item.builder, args), reproduced = cli(item.builder, [...args, "--check"]);
        if (built.byteEditionId !== reproduced.byteEditionId || !reproduced.checked) throw new Error(`Edition reproduction failed: ${item.task}`);
        return reproduced;
      });
      return { task: item.task, source: item.source, assessment, editions };
    }) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new Error("Run the fixed local workflow without arguments.");
  console.log(JSON.stringify(checkReproducibleAuthoring(), null, 2));
}
