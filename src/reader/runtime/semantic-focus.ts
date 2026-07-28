export type KpReaderFocusSource = "story" | "url" | "pointer" | "keyboard";

export interface KpReaderFocusSnapshot {
  readonly activeSource?: KpReaderFocusSource | undefined;
  readonly objectRefs: readonly string[];
  readonly revision: number;
}

export type KpReaderFocusListener = (snapshot: KpReaderFocusSnapshot) => void;

export interface KpReaderSemanticFocusService {
  getSnapshot(): KpReaderFocusSnapshot;
  set(source: KpReaderFocusSource, objectRefs: readonly string[]): void;
  clear(source: KpReaderFocusSource): void;
  subscribe(listener: KpReaderFocusListener): () => void;
  dispose(): void;
}

const precedence: readonly KpReaderFocusSource[] = [
  "keyboard",
  "pointer",
  "url",
  "story"
];

export function createKpReaderSemanticFocusService(
  allowedObjectRefs: readonly string[]
): KpReaderSemanticFocusService {
  const allowed = new Set(allowedObjectRefs);
  const layers = new Map<KpReaderFocusSource, readonly string[]>();
  const listeners = new Set<KpReaderFocusListener>();
  let disposed = false;
  let revision = 0;
  let snapshot: KpReaderFocusSnapshot = { objectRefs: [], revision };
  const requireActive = (): void => {
    if (disposed) throw new Error("reader semantic focus service is disposed");
  };
  const publishIfChanged = (): void => {
    const activeSource = precedence.find((source) => (layers.get(source)?.length ?? 0) > 0);
    const objectRefs = activeSource === undefined
      ? []
      : [...layers.get(activeSource)!];
    if (
      snapshot.activeSource === activeSource &&
      equalRefs(snapshot.objectRefs, objectRefs)
    ) {
      return;
    }
    revision += 1;
    snapshot = activeSource === undefined
      ? { objectRefs, revision }
      : { activeSource, objectRefs, revision };
    listeners.forEach((listener) => listener(snapshot));
  };
  return {
    getSnapshot() {
      return snapshot;
    },
    set(source, objectRefs) {
      requireActive();
      const refs = [...new Set(objectRefs.map((ref) => ref.trim()))];
      for (const ref of refs) {
        if (ref === "" || !allowed.has(ref)) throw new Error(`unknown semantic focus ref ${ref}`);
      }
      if (refs.length === 0) layers.delete(source);
      else layers.set(source, refs);
      publishIfChanged();
    },
    clear(source) {
      requireActive();
      if (!layers.has(source)) return;
      layers.delete(source);
      publishIfChanged();
    },
    subscribe(listener) {
      requireActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      layers.clear();
      listeners.clear();
    }
  };
}

function equalRefs(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((ref, index) => ref === right[index]);
}
