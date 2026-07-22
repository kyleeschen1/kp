import {
  defineKpReaderFrameScheduler,
  type KpReaderFrameSchedulerOptions,
  type KpReaderLayoutInvalidationReason
} from "../runtime/public-api.ts";
import type { KpReaderRendererAdapter } from "./adapter-contract.ts";
import type { KpReaderRendererRequest } from "./adapter-contract.ts";
import type { KpReaderArtifactRef } from "../document/public-api.ts";
import type { KpReaderSessionSnapshot } from "../runtime/public-api.ts";

export interface KpReaderRendererMountContext {
  readonly blockId: string;
  readonly asset: KpReaderArtifactRef<"animation-asset">;
  readonly initialSession: KpReaderSessionSnapshot;
}

export interface KpReaderScheduledRendererAdapterOptions<
  THost,
  TInput,
  TLayout,
  TLayoutPlan,
  TFrame
> {
  readonly id: string;
  readonly readLayout: (
    host: THost,
    mount: KpReaderRendererMountContext,
    request: {
      readonly revision: number;
      readonly reasons: readonly KpReaderLayoutInvalidationReason[];
    }
  ) => TLayout;
  readonly planLayout: (
    host: THost,
    mount: KpReaderRendererMountContext,
    layout: TLayout
  ) => TLayoutPlan;
  readonly planFrame: (
    host: THost,
    request: {
      readonly input: TInput;
      readonly rendererRequest: KpReaderRendererRequest<TInput>;
      readonly layout: TLayout;
      readonly layoutPlan: TLayoutPlan;
    }
  ) => TFrame;
  readonly writeFrame: (
    host: THost,
    frame: TFrame,
    request: KpReaderRendererRequest<TInput>
  ) => void;
  readonly frameClock?: KpReaderFrameSchedulerOptions<
    TInput,
    TLayout,
    TLayoutPlan,
    TFrame
  >["frameClock"];
}

/**
 * Pins only the semantic frame input. Host, measurement, plan, and write types
 * remain inferred so concrete renderers do not need parallel type declarations.
 */
export function defineKpReaderScheduledRendererAdapter<TInput>() {
  return <THost, TLayout, TLayoutPlan, TFrame>(
    options: KpReaderScheduledRendererAdapterOptions<
      THost,
      TInput,
      TLayout,
      TLayoutPlan,
      TFrame
    >
  ): KpReaderRendererAdapter<THost, TInput> => ({
    id: options.id,
    mount({ host, blockId, asset, session }) {
      const mount = { blockId, asset, initialSession: session };
      // The adapter owns scheduling so composition roots cannot bypass the
      // read-plan-write ordering or leak scheduler disposal.
      const scheduler = defineKpReaderFrameScheduler<
        KpReaderRendererRequest<TInput>
      >()({
        readLayout: (request) => options.readLayout(host, mount, request),
        planLayout: (layout) => options.planLayout(host, mount, layout),
        planFrame: ({ input: rendererRequest, layout, layoutPlan }) => ({
          rendererRequest,
          frame: options.planFrame(host, {
            input: rendererRequest.frame,
            rendererRequest,
            layout,
            layoutPlan
          })
        }),
        writeFrame: ({ rendererRequest, frame }) =>
          options.writeFrame(host, frame, rendererRequest),
        ...(options.frameClock === undefined ? {} : { frameClock: options.frameClock })
      });
      return {
        render: (request) => scheduler.render(request),
        renderNow: (request) => scheduler.renderNow(request),
        refresh: (reason = "content") => scheduler.invalidate(reason),
        inspect: () => scheduler.inspect(),
        dispose: () => scheduler.dispose()
      };
    }
  });
}
