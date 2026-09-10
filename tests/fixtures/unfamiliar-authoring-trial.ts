import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkKpComposedAlgebraDraft } from "../../src/authoring/composed-algebra-session.ts";

const directory = new URL("../../docs/project/threads/2026-09-10-authoring-trial/", import.meta.url);
// Freeze selected attempts explicitly. Never silently pick the latest file or
// skip a case that stopped compiling; failed attempts remain separate evidence.
export const unfamiliarAuthoringCases = ["case-01.attempt-2.json", "case-02.attempt-1.json",
  "case-03.attempt-1.json", "case-04.attempt-1.json", "case-05.attempt-1.json"].map(name => {
  const path = fileURLToPath(new URL(name, directory)), text = readFileSync(path, "utf8");
  const checked = checkKpComposedAlgebraDraft(text);
  if (checked.status !== "compiled") throw new Error(`Selected trial source no longer compiles: ${name}`);
  return { name, path, text, source: checked.draft.checked.source, draft: checked.draft };
});
export const unfamiliarAuthoringRejections = ["probe-factorization", "probe-evaluation", "probe-unsupported"]
  .map(name => ({ name, text: readFileSync(new URL(`${name}.attempt-1.json`, directory), "utf8") }));
