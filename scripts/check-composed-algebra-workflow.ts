import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readAuthorSource, runAuthorCheckCli } from "./author-check.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { checkKpComposedAlgebraAuthorSource } from "../src/authoring/composed-algebra-author-check.ts";
import { checkKpComposedAlgebraDraft, exportKpComposedAlgebraSource, createKpComposedAlgebraAuthoringSession } from "../src/authoring/composed-algebra-session.ts";
import { projectComposedAlgebraReading } from "../src/experiments/composed-algebra/readings.ts";
import { projectComposedAlgebraPrompts, captureComposedAlgebraPosition, resolveComposedAlgebraPosition } from "../src/experiments/composed-algebra/practice.ts";
import { compileComposedAlgebraPublication, verifyComposedAlgebraPublication } from "./build-composed-algebra-edition.ts";

export async function checkComposedAlgebraWorkflow() {
  const results = [];
  for (const name of ["primary", "product"]) {
    const path = `src/authoring/examples/composed-algebra-${name}.json`, bytes = readAuthorSource(path);
    const checked = checkKpComposedAlgebraDraft(bytes);
    assert.equal(checked.status, "compiled");
    assert.deepEqual(await runAuthorCheckCli(["--task", "equation.composed-algebra", "--request", path], () => bytes),
      reportAuthorCheck("equation.composed-algebra", checkKpComposedAlgebraAuthorSource(bytes)));
    const initial = checked.draft, source = initial.checked.source;
    let preparations = 0, disposals = 0;
    let active: { dispose(): void } | undefined;
    // Transaction proof uses a disposable nonvisual surface. Real native Apply
    // and interaction are exercised separately by the stable browser command.
    const session = createKpComposedAlgebraAuthoringSession({ initial,
      prepare: async () => { ++preparations; return { dispose() { ++disposals; } }; },
      commit: surface => { active?.dispose(); active = surface; } });
    try {
      const result = initial.checked.chain.steps[1].result.value;
      const wrongResult = source.states[2].latex.replace(String(result), String(result + 1));
      const invalid = JSON.stringify({ ...source, states: source.states.map((state, i) => i === 2 ? { ...state, latex: wrongResult } : state) });
      const rejected = await session.apply(invalid);
      assert.equal(rejected.status, "repair-gap"); assert.equal(session.current(), initial); assert.equal(preparations, 0);
      if (rejected.status !== "repair-gap" || rejected.diagnostic.code !== "invalid-evaluation")
        throw new Error("The scripted invalid attempt must preserve the expression shape and fail arithmetic.");
      const edit = JSON.stringify({ ...source, editorial: { ...source.editorial, title: `${source.editorial.title} — revised` } });
      assert.equal((await session.apply(edit)).status, "applied");
      const current = session.current(), exported = exportKpComposedAlgebraSource(current);
      assert.notEqual(current.revisionId, initial.revisionId);
      assert.equal(current.checked.chain.revisionId, initial.checked.chain.revisionId);
      const full = projectComposedAlgebraReading(current, "full"), compact = projectComposedAlgebraReading(current, "compact");
      assert.deepEqual(full.facts, compact.facts);
      for (const prompt of projectComposedAlgebraPrompts(current)) assert.equal(prompt.revisionId, current.revisionId);
      const position = captureComposedAlgebraPosition(current, .63);
      assert.equal(resolveComposedAlgebraPosition(current, position), .63);
      const publication = compileComposedAlgebraPublication(exported, path);
      verifyComposedAlgebraPublication(publication, exported, path);
      assert.equal(publication.payload.revisionId, current.revisionId);
      results.push({ source: path, sourceBytes: Buffer.byteLength(bytes), exportedBytes: Buffer.byteLength(exported),
        status: "passed", scriptedInvalidAttempts: 1, scriptedRepairTurns: 1,
        repair: rejected.status === "repair-gap" ? rejected.diagnostic.code : null,
        initialRevision: initial.revisionId, editedRevision: current.revisionId,
        runtimeOwner: current.owner, canonicalReferences: current.steps.map(step => step.canonicalReference),
        checkpointCount: current.checkpointProgress.length, publication: "verified-static-artifact-not-deployed" });
    } finally { session.dispose(); active?.dispose(); }
    assert.equal(preparations, disposals);
  }
  return { kind: "composed-algebra-workflow-evidence", provenance: "deterministic-scripted-fixtures-not-live-LLM",
    externalModelCalls: 0, authorTime: "not-measured", comprehension: "not-measured",
    marginalSourceBytes: results[1]!.sourceBytes - results[0]!.sourceBytes,
    browserVerification: "npm run visual:composed-algebra", results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  console.log(JSON.stringify(await checkComposedAlgebraWorkflow(), null, 2));
