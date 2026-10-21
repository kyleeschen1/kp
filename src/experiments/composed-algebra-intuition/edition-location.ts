type LocationResult = { readonly status: "ready"; readonly step: number }
  | { readonly status: "repair-gap"; readonly message: string };

/** Location may select a position, never a source. A pin is required whenever a
 * position is supplied so copying links between editions cannot change meaning. */
export function readAlgebraEditionLocation(hash: string, revision: string, last: number): LocationResult {
  const gap = (message: string): LocationResult => ({ status: "repair-gap", message });
  if (!hash || hash === "#") return { status: "ready", step: 0 };
  const fields = new URLSearchParams(hash.replace(/^#/, ""));
  if ([...fields.keys()].some(key => key !== "step" && key !== "revision") ||
    fields.getAll("step").length !== 1 || fields.getAll("revision").length !== 1)
    return gap("Use one step and one source revision in the playback link.");
  if (fields.get("revision") !== revision) return gap("Open the matching source edition. This link belongs to another revision.");
  const raw = fields.get("step")!;
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(raw)) return gap("Playback step must be a finite nonnegative decimal.");
  const step = Number(raw);
  if (!Number.isFinite(step) || step > last) return gap(`Playback step must be between 0 and ${last}.`);
  return { status: "ready", step };
}

export function algebraEditionHash(revision: string, step: number): string {
  if (!Number.isFinite(step) || step < 0) throw new Error("Cannot encode an invalid algebra playback position.");
  return `#${new URLSearchParams({ revision, step: String(step) })}`;
}
