import { check } from "../../authoring/matrix-columns/compile.ts";
import { columnExampleFromProduct } from "./model.ts";
import { columnPageHtml } from "./view.ts";
import { mountColumnReader } from "./reader.ts";
import { editionHash, editionPosition } from "./edition-location.ts";

const root = document.querySelector<HTMLElement>("#comb-player")!;
let dispose: (() => void) | undefined;
try {
  const checked = check(document.querySelector("[data-matrix-source]")?.textContent ?? "");
  if (checked.status !== "compiled") throw new Error(`${checked.diagnostic.code} at ${checked.diagnostic.path}: ${checked.diagnostic.expected}`);
  const { source, product, revision } = checked.draft;
  if (document.querySelector("[data-matrix-revision]")?.getAttribute("data-matrix-revision") !== revision) throw new Error("The embedded source does not match this edition revision.");
  dispose = mountColumnReader(root, async url => {
    const { column, progress } = editionPosition(url, revision);
    const scene = columnExampleFromProduct(product, column, source.reading);
    return { scene, introduction: source.reading.introduction,
      html: columnPageHtml(scene, { selection: "", hash: editionHash(revision, progress) }) };
  }, { read: url => editionPosition(url, revision).progress, hash: progress => editionHash(revision, progress) });
} catch (error) {
  root.setAttribute("role", "alert"); root.dataset["gap"] = "true";
  root.textContent = `The interactive edition could not be prepared: ${error instanceof Error ? error.message : String(error)}. The complete reading remains below.`;
}
import.meta.hot?.dispose(() => dispose?.());
