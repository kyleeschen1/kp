import type { KpReaderArtifactRef } from "../document/public-api.ts";
import type { KpReaderSessionSnapshot } from "../runtime/public-api.ts";
import type {
  KpReaderFrameSchedulerState,
  KpReaderLayoutInvalidationReason
} from "../runtime/public-api.ts";

export interface KpReaderRendererRequest<TFrame> {
  readonly blockId: string;
  readonly asset: KpReaderArtifactRef<"animation-asset">;
  readonly session: KpReaderSessionSnapshot;
  readonly frame: TFrame;
}

export interface KpReaderRendererController<TFrame> {
  render(request: KpReaderRendererRequest<TFrame>): void;
  renderNow?(request: KpReaderRendererRequest<TFrame>): void;
  refresh(reason?: KpReaderLayoutInvalidationReason): void;
  inspect?(): KpReaderFrameSchedulerState;
  dispose(): void;
}

export interface KpReaderRendererAdapter<THost, TFrame> {
  readonly id: string;
  mount(input: {
    readonly host: THost;
    readonly blockId: string;
    readonly asset: KpReaderArtifactRef<"animation-asset">;
    readonly session: KpReaderSessionSnapshot;
  }): KpReaderRendererController<TFrame>;
}
