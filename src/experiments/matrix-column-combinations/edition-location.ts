/** An edition position is meaningful only for its exact checked source. Do not
 * silently restore another revision or accept registry selection in this host. */
export function editionPosition(url: URL, revision: string) {
  const keys = [...url.searchParams.keys()];
  if (keys.some(key => key !== "column" && key !== "embedded") || new Set(keys).size !== keys.length) {
    throw new Error("This edition accepts only one result column selection.");
  }
  const column = url.searchParams.get("column") ?? "0";
  if (column !== "0" && column !== "1") throw new Error("Choose result column 0 or 1.");
  if (!url.hash) return { column: Number(column), progress: 0 };
  const pin = new URLSearchParams(url.hash.slice(1));
  if ([...pin.keys()].length !== 2 || pin.getAll("revision").length !== 1 || pin.getAll("p").length !== 1 || pin.get("revision") !== revision) {
    throw new Error("The saved position does not identify this source revision.");
  }
  const text = pin.get("p")!, progress = Number(text);
  if (!text.trim() || !Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Animation progress must be between 0 and 1.");
  return { column: Number(column), progress };
}

export function editionHash(revision: string, progress: number) {
  if (!/^sha256:[a-f0-9]{64}$/.test(revision)) throw new Error("Expected a checked source revision.");
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Animation progress must be between 0 and 1.");
  return `#${new URLSearchParams({ revision, p: String(progress) })}`;
}
