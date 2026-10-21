export interface ChangeLocation { readonly step: number; readonly x: number; readonly h: number }
type LocationResult = { readonly status: "restored"; readonly location: ChangeLocation }
  | { readonly status: "repair-gap"; readonly code: "revision" | "location"; readonly message: string };
const limits = { step: [0, 4], x: [-2, 2], h: [-.5, .5] } as const;
const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/** URL fields are untrusted input. Reject a malformed location as a whole rather
 * than mixing silently repaired controls with another source's playhead. */
export function readChangeLocation(hash: string, source: {
  readonly revision: string; readonly x: number; readonly h: number; readonly allowLegacy: boolean;
}): LocationResult {
  const gap = (message: string): LocationResult => ({ status: "repair-gap", code: "location", message });
  if (hash.length > 1024 || /%(?![a-f\d]{2})/i.test(hash)) return gap("Malformed playback link.");
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  for (const key of params.keys()) {
    if (!["revision", "step", "x", "h"].includes(key)) return gap(`Unknown playback field: ${key}.`);
    if (params.getAll(key).length !== 1) return gap(`Repeated playback field: ${key}.`);
  }
  const revision = params.get("revision");
  if (revision === null ? !source.allowLegacy : revision !== source.revision)
    return { status: "repair-gap", code: "revision", message: "This link belongs to a different source." };
  const location = { step: 0, x: source.x, h: source.h };
  for (const key of ["step", "x", "h"] as const) {
    const raw = params.get(key);
    if (raw === null) continue;
    const value = Number(raw), [low, high] = limits[key];
    if (!decimal.test(raw) || !Number.isFinite(value) || value < low || value > high)
      return gap(`Playback ${key} must be a decimal number from ${low} to ${high}.`);
    location[key] = value;
  }
  return { status: "restored", location };
}

export function writeChangeLocation(revision: string, location: ChangeLocation): string {
  if (!/^sha256:[a-f\d]{64}$/.test(revision)) throw new Error("Invalid playback source revision.");
  const hash = `#${new URLSearchParams({ revision, step: String(location.step), x: String(location.x), h: String(location.h) })}`;
  const checked = readChangeLocation(hash, { revision, x: 0, h: 0, allowLegacy: false });
  if (checked.status !== "restored") throw new Error(checked.message);
  return hash;
}
