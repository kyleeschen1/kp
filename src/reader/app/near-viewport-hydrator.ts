export type KpReaderHydrationStatus =
  | "idle"
  | "loading"
  | "hydrated"
  | "failed"
  | "disposed";

export interface KpReaderHydrationMount {
  dispose(): void;
}

export interface KpReaderHydrationCandidate {
  readonly blockId: string;
  hydrate(): Promise<KpReaderHydrationMount>;
  setStaticVisible(visible: boolean): void;
}

export interface KpReaderHydrationSnapshot {
  readonly blockId: string;
  readonly status: KpReaderHydrationStatus;
  readonly nearViewport: boolean;
  readonly attempt: number;
  readonly error?: string | undefined;
}

export interface KpReaderNearViewportHydrator {
  register(candidate: KpReaderHydrationCandidate): void;
  setNearViewport(blockId: string, nearViewport: boolean): void;
  getSnapshot(blockId: string): KpReaderHydrationSnapshot;
  dispose(): void;
}

interface CandidateState {
  readonly candidate: KpReaderHydrationCandidate;
  snapshot: KpReaderHydrationSnapshot;
  mount?: KpReaderHydrationMount | undefined;
  generation: number;
}

export function createKpReaderNearViewportHydrator(): KpReaderNearViewportHydrator {
  const candidates = new Map<string, CandidateState>();
  let disposed = false;

  return {
    register(candidate) {
      requireActive(disposed);
      if (candidate.blockId.trim() === "") throw new Error("hydration block id must not be empty");
      if (candidates.has(candidate.blockId)) {
        throw new Error(`hydration block ${candidate.blockId} is already registered`);
      }
      candidate.setStaticVisible(true);
      candidates.set(candidate.blockId, {
        candidate,
        snapshot: {
          blockId: candidate.blockId,
          status: "idle",
          nearViewport: false,
          attempt: 0
        },
        generation: 0
      });
    },
    setNearViewport(blockId, nearViewport) {
      requireActive(disposed);
      const state = requireCandidate(candidates, blockId);
      state.snapshot = { ...state.snapshot, nearViewport };
      if (!nearViewport || state.snapshot.status === "loading" || state.snapshot.status === "hydrated") {
        return;
      }
      startHydration(state, candidates);
    },
    getSnapshot(blockId) {
      return { ...requireCandidate(candidates, blockId).snapshot };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const state of candidates.values()) {
        state.generation += 1;
        state.mount?.dispose();
        state.candidate.setStaticVisible(true);
        state.snapshot = { ...state.snapshot, status: "disposed" };
      }
      candidates.clear();
    }
  };
}

function startHydration(
  state: CandidateState,
  candidates: ReadonlyMap<string, CandidateState>
): void {
  state.generation += 1;
  const generation = state.generation;
  state.snapshot = {
    blockId: state.snapshot.blockId,
    status: "loading",
    nearViewport: state.snapshot.nearViewport,
    attempt: state.snapshot.attempt + 1
  };
  // Static output remains the visible fallback until the asynchronous mount is complete.
  void state.candidate.hydrate().then((mount) => {
    if (state.generation !== generation || !candidates.has(state.snapshot.blockId)) {
      mount.dispose();
      return;
    }
    state.mount = mount;
    state.snapshot = { ...state.snapshot, status: "hydrated" };
    state.candidate.setStaticVisible(false);
  }).catch((error: unknown) => {
    if (state.generation !== generation || !candidates.has(state.snapshot.blockId)) return;
    state.candidate.setStaticVisible(true);
    state.snapshot = {
      ...state.snapshot,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  });
}

function requireCandidate(
  candidates: ReadonlyMap<string, CandidateState>,
  blockId: string
): CandidateState {
  const state = candidates.get(blockId);
  if (state === undefined) throw new Error(`unknown hydration block ${blockId}`);
  return state;
}

function requireActive(disposed: boolean): void {
  if (disposed) throw new Error("near-viewport hydrator is disposed");
}
