import type { KpReaderArtifactRef } from "../document/public-api.ts";
import type { KpReaderSessionSnapshot } from "../runtime/public-api.ts";
import type {
  KpReaderRendererAdapter,
  KpReaderRendererController,
  KpReaderRendererRequest
} from "./adapter-contract.ts";

export interface KpReaderMountedAdapter<TFrame> {
  readonly blockId: string;
  readonly adapterId: string;
  render(frame: TFrame, session: KpReaderSessionSnapshot): void;
  refresh(): void;
  dispose(): void;
  readonly disposed: boolean;
}

export interface KpReaderAdapterRegistry<THost, TFrame> {
  register(adapter: KpReaderRendererAdapter<THost, TFrame>): void;
  has(adapterId: string): boolean;
  mount(input: {
    readonly adapterId: string;
    readonly host: THost;
    readonly blockId: string;
    readonly asset: KpReaderArtifactRef<"animation-asset">;
    readonly session: KpReaderSessionSnapshot;
  }): KpReaderMountedAdapter<TFrame>;
  disposeAll(): void;
  readonly mountedBlockIds: readonly string[];
}

export function createKpReaderAdapterRegistry<THost, TFrame>(): KpReaderAdapterRegistry<THost, TFrame> {
  const adapters = new Map<string, KpReaderRendererAdapter<THost, TFrame>>();
  const mounts = new Map<string, KpReaderMountedAdapter<TFrame>>();

  return {
    register(adapter) {
      if (adapter.id.trim() === "") throw new Error("reader adapter id must not be empty");
      if (adapters.has(adapter.id)) throw new Error(`reader adapter ${adapter.id} is already registered`);
      adapters.set(adapter.id, adapter);
    },
    has(adapterId) {
      return adapters.has(adapterId);
    },
    mount(input) {
      const adapter = adapters.get(input.adapterId);
      if (adapter === undefined) throw new Error(`unknown reader adapter ${input.adapterId}`);
      if (mounts.has(input.blockId)) throw new Error(`reader block ${input.blockId} is already mounted`);
      const controller = adapter.mount({
        host: input.host,
        blockId: input.blockId,
        asset: input.asset,
        session: input.session
      });
      const mounted = mountedAdapter(input, controller, () => mounts.delete(input.blockId));
      mounts.set(input.blockId, mounted);
      return mounted;
    },
    disposeAll() {
      // Reverse mount order mirrors nested resource acquisition and avoids parent-first teardown.
      [...mounts.values()].reverse().forEach((mounted) => mounted.dispose());
    },
    get mountedBlockIds() {
      return [...mounts.keys()];
    }
  };
}

function mountedAdapter<TFrame>(
  input: {
    readonly adapterId: string;
    readonly blockId: string;
    readonly asset: KpReaderArtifactRef<"animation-asset">;
  },
  controller: KpReaderRendererController<TFrame>,
  onDispose: () => void
): KpReaderMountedAdapter<TFrame> {
  let isDisposed = false;
  const requireActive = (): void => {
    if (isDisposed) throw new Error(`reader block ${input.blockId} is disposed`);
  };
  return {
    blockId: input.blockId,
    adapterId: input.adapterId,
    render(frame, session) {
      requireActive();
      const request: KpReaderRendererRequest<TFrame> = {
        blockId: input.blockId,
        asset: input.asset,
        session,
        frame
      };
      controller.render(request);
    },
    refresh() {
      requireActive();
      controller.refresh();
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      controller.dispose();
      onDispose();
    },
    get disposed() {
      return isDisposed;
    }
  };
}
