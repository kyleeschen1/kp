import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { authoredRailExample, authoredRailSourceLimit, compileAuthoredRailPublication } from "../src/tutorial/mechanics-relations/authored-rail-publication.ts";

export const railSelectionPath = ".kp/authoring/rail-selection.json";
export function readRailSource(path: string): string {
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > authoredRailSourceLimit) throw new Error("rail.source-limit: expected a UTF-8 file within 100,000 bytes");
  return readFileSync(path, "utf8");
}

export function selectAuthoredRail(root: string, sourceId: string, text: string) {
  const result = compileAuthoredRailPublication(text, sourceId);
  if (result.status !== "checked") return result;
  const file = resolve(root, railSelectionPath);
  mkdirSync(dirname(file), { recursive: true });
  // Store the selected bytes, not a live path to reread later. A changed or
  // invalid draft cannot silently become the reader's displayed revision.
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify({ schema: "kp.authored-rail-selection.v1", sourceId, text, sourceRevision: result.sourceRevision }));
  renameSync(temporary, file);
  return result;
}

export function loadAuthoredRail(root: string, selected: boolean) {
  const file = resolve(root, railSelectionPath);
  let raw: string | undefined;
  try { raw = selected ? readFileSync(file, "utf8") : undefined; }
  catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    raw = undefined;
  }
  if (raw === undefined) return compileAuthoredRailPublication(readRailSource(resolve(root, authoredRailExample)), authoredRailExample);
  let selection: unknown;
  try { selection = JSON.parse(raw); }
  catch { throw new Error("rail.selection-invalid: stored selection is not JSON; reselect a checked source"); }
  if (!selection || typeof selection !== "object" || !("schema" in selection) || selection.schema !== "kp.authored-rail-selection.v1"
    || !("text" in selection) || typeof selection.text !== "string" || !("sourceId" in selection) || typeof selection.sourceId !== "string"
    || !("sourceRevision" in selection)) throw new Error("rail.selection-invalid: reselect a checked source");
  const result = compileAuthoredRailPublication(selection.text, selection.sourceId);
  if (result.status !== "checked") throw new Error(`rail.selection-invalid: ${result.repair.message}`);
  if (result.sourceRevision !== selection.sourceRevision) throw new Error("rail.selection-revision: reselect the source; stored bytes changed");
  return result;
}
