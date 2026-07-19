export type KpConceptRoomCorrespondenceSurface = "prose" | "symbolic" | "balance";
export type KpConceptRoomFocusChannel = "hover" | "keyboard" | "pinned";

export interface KpConceptRoomCorrespondenceTarget {
  readonly id: string;
  readonly semanticId: string;
  readonly surface: KpConceptRoomCorrespondenceSurface;
}

export interface KpConceptRoomCorrespondenceIndex {
  readonly schemaVersion: "kp.concept-correspondence.v1";
  readonly targets: readonly KpConceptRoomCorrespondenceTarget[];
}

export interface KpConceptRoomFocusTarget extends KpConceptRoomCorrespondenceTarget {
  readonly channels: readonly KpConceptRoomFocusChannel[];
}

export interface KpConceptRoomFocusProjection {
  readonly activeSemanticIds: readonly string[];
  readonly targets: readonly KpConceptRoomFocusTarget[];
}

export function createConceptRoomCorrespondenceIndex(
  targets: readonly KpConceptRoomCorrespondenceTarget[]
): KpConceptRoomCorrespondenceIndex {
  const ids = new Set<string>();
  for (const target of targets) {
    requireIdentity(target.id, "target");
    requireIdentity(target.semanticId, "semantic");
    if (ids.has(target.id)) throw new Error(`Duplicate correspondence target ${target.id}.`);
    ids.add(target.id);
  }
  return deepFreeze({
    schemaVersion: "kp.concept-correspondence.v1" as const,
    targets: targets.map((target) => ({ ...target }))
  });
}

export function projectConceptRoomFocus(
  index: KpConceptRoomCorrespondenceIndex,
  input: {
    readonly hoveredSemanticId?: string;
    readonly keyboardSemanticId?: string;
    readonly pinnedSemanticIds?: readonly string[];
  }
): KpConceptRoomFocusProjection {
  const channels = new Map<string, KpConceptRoomFocusChannel[]>();
  addChannel(channels, input.hoveredSemanticId, "hover");
  addChannel(channels, input.keyboardSemanticId, "keyboard");
  for (const semanticId of input.pinnedSemanticIds ?? []) addChannel(channels, semanticId, "pinned");
  const activeSemanticIds = [...channels.keys()].sort();
  const targets = index.targets
    .filter((target) => channels.has(target.semanticId))
    .map((target) => ({ ...target, channels: [...channels.get(target.semanticId)!] }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return deepFreeze({ activeSemanticIds, targets });
}

export function correspondenceTargetsFor(
  index: KpConceptRoomCorrespondenceIndex,
  semanticId: string
): readonly KpConceptRoomCorrespondenceTarget[] {
  return index.targets.filter((target) => target.semanticId === semanticId);
}

function addChannel(
  channels: Map<string, KpConceptRoomFocusChannel[]>,
  semanticId: string | undefined,
  channel: KpConceptRoomFocusChannel
): void {
  if (semanticId === undefined) return;
  requireIdentity(semanticId, "semantic");
  const existing = channels.get(semanticId) ?? [];
  if (!existing.includes(channel)) existing.push(channel);
  channels.set(semanticId, existing);
}

function requireIdentity(value: string, kind: string): void {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(value)) {
    throw new TypeError(`Invalid ${kind} identity ${value}.`);
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
