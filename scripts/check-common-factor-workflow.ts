import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readAuthorSource, runAuthorCheckCli } from "./author-check.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { checkKpCommonFactorAuthorSource, checkKpCommonFactorDraft } from "../src/authoring/common-factor-author-check.ts";
import { exportKpCommonFactorSource } from "../src/authoring/common-factor-draft.ts";
import { createKpCommonFactorAuthoringSession } from "../src/authoring/common-factor-session.ts";
import { projectCommonFactorReading } from "../src/experiments/common-factor/readings.ts";
import { compileCommonFactorPublication, verifyCommonFactorPublication } from "./build-common-factor-edition.ts";

export async function checkCommonFactorWorkflow() {
  const results = [];
  for (const name of ["primary", "numeric"]) {
    const path = `src/authoring/examples/common-factor-${name}.json`, bytes = readAuthorSource(path);
    const checked = checkKpCommonFactorDraft(bytes);
    assert.equal(checked.status, "compiled");
    assert.deepEqual(await runAuthorCheckCli(["--task", "equation.common-factor", "--request", path], () => bytes),
      reportAuthorCheck("equation.common-factor", checkKpCommonFactorAuthorSource(bytes)));
    const initial = checked.draft;
    const facts = projectCommonFactorReading(initial, "full").facts;
    const wrongFactor = initial.proof.factor.kind === "number" ? String((initial.proof.factor.value + 1) % 10) : facts.addends[0]!;
    const invalid = JSON.stringify({ ...initial.source, states: [initial.source.states[0],
      { ...initial.source.states[1], latex: `${wrongFactor}(${facts.addends.join("+")})` }] });
    let prepared = 0, disposed = 0;
    let active: { dispose(): void } | undefined;
    // This exercises the real atomic revision owner with a nonvisual surface.
    // Actual DOM preparation and gestures remain the scoped browser command's job.
    const session = createKpCommonFactorAuthoringSession({ initial,
      prepare: async () => { prepared++; return { dispose() { disposed++; } }; },
      commit: surface => { active?.dispose(); active = surface; } });
    try {
      const rejected = await session.apply(invalid);
      assert.equal(rejected.status, "repair-gap");
      assert.equal(session.current(), initial);
      assert.equal(prepared, 0);
      const edit = JSON.stringify({ ...initial.source, editorial: { ...initial.source.editorial, title: initial.source.editorial.title + " — revised" } });
      assert.equal((await session.apply(edit)).status, "applied");
      const current = session.current(), exported = exportKpCommonFactorSource(current);
      assert.notEqual(current.revisionId, initial.revisionId);
      assert.equal(current.proof.revisionId, initial.proof.revisionId);
      const publication = compileCommonFactorPublication(exported, path);
      verifyCommonFactorPublication(publication, exported, path);
      assert.equal(publication.payload.revisionId, current.revisionId);
      results.push({ source: path, sourceBytes: Buffer.byteLength(bytes), exportedBytes: Buffer.byteLength(exported),
        status: "passed", scriptedInvalidAttempts: 1, scriptedRepairTurns: 1,
        repair: rejected.status === "repair-gap" ? rejected.diagnostic.code : null,
        initialRevision: initial.revisionId, editedRevision: current.revisionId,
        runtimeOwner: current.presentation.owner, composition: current.presentation.composition,
        publication: "verified-static-artifact-not-deployed" });
    } finally { session.dispose(); active?.dispose(); }
    assert.equal(prepared, disposed);
  }
  return { kind: "common-factor-workflow-evidence", provenance: "deterministic-scripted-fixtures-not-live-LLM", browserVerification: "npm run visual:common-factor-authoring", results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  console.log(JSON.stringify(await checkCommonFactorWorkflow(), null, 2));
