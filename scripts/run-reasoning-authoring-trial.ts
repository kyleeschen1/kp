import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sha256 } from "../src/kernel/sha256.ts";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { createCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-evidence.ts";
import { checkReasoningText } from "./author-reasoning.ts";

export interface TrialDrafts { equationJson: string; codeJson: string }
const equationTitle = "See both products";
const codeTitle = "One threshold, preserved behavior";

/** Compilation and task success are separate: a valid unchanged draft is not
 * a successful response to a requested edit. */
export function assessReasoningTrial(drafts: TrialDrafts) {
  const equation = checkReasoningText("equation", drafts.equationJson);
  const code = checkReasoningText("code", drafts.codeJson);
  const matches = (json: string, title: string) => { try { return JSON.parse(json).title === title; } catch { return false; } };
  const passed = equation.status === "compiled" && equation.checkpointCount === 3 && matches(drafts.equationJson, equationTitle)
    && code.status === "compiled" && code.checkpointCount === 7 && matches(drafts.codeJson, codeTitle);
  return { passed, equation, code };
}

export function injectReasoningTrialFaults(drafts: TrialDrafts): TrialDrafts {
  const equation = JSON.parse(drafts.equationJson), code = JSON.parse(drafts.codeJson);
  equation.parent.targetStateId = "fraction-solve.state.constant-quotient";
  code.stageIds.reverse();
  return { equationJson: JSON.stringify(equation), codeJson: JSON.stringify(code) };
}

function run(model: string) {
  const root = resolve("tmp/codex/reasoning-authoring-trial");
  mkdirSync(root, { recursive: true });
  // A successful child exit without a new response must fail, never read an
  // earlier run's file and mislabel replayed bytes as fresh model evidence.
  const output = mkdtempSync(resolve(root, "run-"));
  const schemaPath = resolve(output, "response.schema.json");
  writeFileSync(schemaPath, JSON.stringify({ type: "object", additionalProperties: false,
    properties: { equationJson: { type: "string" }, codeJson: { type: "string" } }, required: ["equationJson", "codeJson"] }));
  const attempts: { phase: string; elapsedMs: number; promptHash: string; responseHash: string; drafts: TrialDrafts }[] = [];
  const invoke = (phase: string, prompt: string): TrialDrafts => {
    const responsePath = resolve(output, `${phase}.json`), start = performance.now();
    const child = spawnSync("codex", ["exec", "--ephemeral", "--ignore-user-config", "--skip-git-repo-check",
      "--sandbox", "read-only", "--color", "never", "-c", 'model_reasoning_effort="low"',
      "--model", model, "--output-schema", schemaPath, "--output-last-message", responsePath, "-"],
    { cwd: output, input: prompt, encoding: "utf8", timeout: 120_000, maxBuffer: 10 * 1024 * 1024 });
    if (child.error || child.status !== 0) throw new Error(`Live model unavailable or failed: ${child.error?.message ?? child.stderr.slice(-2000)}`);
    const raw = readFileSync(responsePath, "utf8"), drafts = JSON.parse(raw) as TrialDrafts;
    if (!drafts || typeof drafts.equationJson !== "string" || typeof drafts.codeJson !== "string") throw new Error("Live model returned an invalid response envelope.");
    attempts.push({ phase, elapsedMs: Math.round(performance.now() - start), promptHash: sha256(prompt), responseHash: sha256(raw), drafts });
    return drafts;
  };
  const rules = "Do not use tools, inspect files or execute code. Return only the response schema with two JSON source strings. Author prose and existing semantic pins only. Never author proof, geometry, timing, renderer or fallback. Preserve required assumptions. Prose is editorial, not proved.";
  const task = `Equation: title '${equationTitle}'; retain exactly distribute then normalize, target fraction-solve.state.normalized. Describe distribution then normalization, not evaluating the constant. Code: title '${codeTitle}'; clarify that the helper preserves the three declared threshold cases, not arbitrary equivalence. Keep every canonical source/stage pin.`;
  const starters = { equationJson: JSON.stringify(createKpReasoningSource()), codeJson: JSON.stringify(createCodeReasoningSource()) };
  const first = invoke("first", `${rules}\n${task}\nPacket:\n${readFileSync("docs/project/authoring/reusable-reasoning-packet.md", "utf8")}\nStarters:\n${JSON.stringify(starters)}`);
  const firstAssessment = assessReasoningTrial(first);
  // Successful generations receive labelled fault injection, not a fabricated
  // claim that the model made these mistakes. Failed generations get their own diagnostics.
  const repairInputKind = firstAssessment.passed ? "injected-binding-faults" : "model-first-output";
  const repairInput = firstAssessment.passed ? injectReasoningTrialFaults(first) : first;
  const diagnostics = assessReasoningTrial(repairInput);
  const repaired = invoke("repair", `${rules}\n${task}\nRepair this draft using actual checker feedback. Preserve unrelated source fields.\n${JSON.stringify({ repairInputKind, drafts: repairInput, diagnostics })}`);
  const repairedAssessment = assessReasoningTrial(repaired);
  const report = { kind: "actual-live-two-round-trial", model, repetitions: 1, repairInputKind,
    attempts, firstAssessment, repairInput, diagnostics, repairedAssessment,
    passed: firstAssessment.passed && repairedAssessment.passed,
    limits: ["One bounded batch per round, not a model success-rate estimate.", "Compiler acceptance does not prove editorial quality.",
      "No learner-comprehension claim; no arbitrary transformation generation.", "No fallback artifact is selected on rejection."] };
  writeFileSync(resolve(output, "latest-report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [flag, model, ...extra] = process.argv.slice(2);
  if (flag !== "--model" || !model || extra.length) throw new Error("Use --model with the existing approved model; this trial makes exactly two bounded calls.");
  run(model);
}
