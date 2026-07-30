import {
  createKpReaderFrameScheduler,
  type KpReaderFrameClock,
  type KpReaderFrameScheduler,
  type KpReaderFrameSchedulerState,
  type KpReaderLayoutInvalidationReason
} from "../reader/runtime/frame-scheduler.ts";
import type {
  KpReaderClockSource
} from "../reader/runtime/playback-clock.ts";
import type {
  KpPlaceValueAdditionOutlineAnchor
} from "../semantic/place-value-addition-fold-plan.ts";
import {
  createKpPlaceValueAdditionNavigationSession,
  type KpPlaceValueAdditionNavigationSession
} from "./place-value-addition-navigation.ts";
import {
  createKpPlaceValueAdditionResponsiveSurface,
  type KpPlaceValueAdditionResponsiveSurface
} from "./place-value-addition-responsive-surface.ts";
import type {
  KpPlaceValueAdditionRuntimeFrame,
  KpPlaceValueRuntimeView
} from "./place-value-addition-runtime.ts";

export const kpPlaceValueAdditionRuntimeControllerPolicy = Object.freeze({
  schemaVersion: "kp.place-value-addition-runtime-controller-policy.v1" as const,
  schedulerAuthority: "reader-frame-scheduler" as const,
  frameCacheKey: "exact-progress+view+viewport" as const,
  hiddenWork: "retain-latest-without-sample-or-paint" as const,
  rendererLifecycle: "shared-place-value-runtime-session" as const,
  webglLeaseCount: 0 as const
});

type KpPlaceValueAdditionControllerStatus =
  | "idle"
  | "mounted"
  | "suspended"
  | "disposed";

interface KpPlaceValueAdditionRenderRequest {
  readonly progress: number;
  readonly source: KpReaderClockSource;
  readonly selectedView: KpPlaceValueRuntimeView;
  readonly viewportWidth: number;
  readonly checkpointId?:
    KpPlaceValueAdditionOutlineAnchor["id"] | undefined;
}

interface KpPlaceValueAdditionPlannedFrame {
  readonly request: KpPlaceValueAdditionRenderRequest;
  readonly frame: KpPlaceValueAdditionRuntimeFrame;
  readonly reused: boolean;
  readonly sampleDelta: number;
}

export interface KpPlaceValueAdditionRuntimeControllerState {
  readonly schemaVersion: "kp.place-value-addition-runtime-controller-state.v1";
  readonly status: KpPlaceValueAdditionControllerStatus;
  readonly mountCount: number;
  readonly requestCount: number;
  readonly sampleCount: number;
  readonly applyCount: number;
  readonly coalescedRequestCount: number;
  readonly repeatedFrameReuseCount: number;
  readonly hiddenRequestCount: number;
  readonly nativeScenePreparationCount: number;
  readonly nativeScenePreparationDurationMs: number;
  readonly maximumPlanDurationMs: number;
  readonly maximumApplyDurationMs: number;
  readonly rendererSessionActiveCount: 0 | 1;
  readonly webglLeaseCount: 0;
  readonly lastAppliedProgress: number | undefined;
  readonly lastAppliedView: KpPlaceValueRuntimeView | undefined;
  readonly scheduler: KpReaderFrameSchedulerState | undefined;
}

export interface KpPlaceValueAdditionRuntimeController {
  readonly schemaVersion: "kp.place-value-addition-runtime-controller.v1";
  readonly root: HTMLElement | undefined;
  readonly surface: KpPlaceValueAdditionResponsiveSurface | undefined;
  mount(host: HTMLElement): KpPlaceValueAdditionResponsiveSurface;
  requestProgress(input: {
    readonly progress: number;
    readonly source: KpReaderClockSource;
  }): void;
  renderProgressNow(input: {
    readonly progress: number;
    readonly source: KpReaderClockSource;
  }): void;
  seekOutline(anchorId: KpPlaceValueAdditionOutlineAnchor["id"]): void;
  setView(view: KpPlaceValueRuntimeView): void;
  setViewportWidth(viewportWidth: number): void;
  invalidate(reason: KpReaderLayoutInvalidationReason): void;
  setSuspended(suspended: boolean): void;
  inspect(): KpPlaceValueAdditionRuntimeControllerState;
  dispose(): void;
}

/**
 * Host adjunct for the existing reader runtime. It owns neither a clock nor a
 * renderer category: it only batches host requests through the shared reader
 * frame scheduler and releases the one responsive surface it mounted.
 */
export function createKpPlaceValueAdditionRuntimeController(input: {
  readonly document: Document;
  readonly viewportWidth: number;
  readonly selectedView?: KpPlaceValueRuntimeView | undefined;
  readonly frameClock?: KpReaderFrameClock | undefined;
  readonly now?: (() => number) | undefined;
}): KpPlaceValueAdditionRuntimeController {
  let desired = freezeRequest({
    progress: 0,
    source: "initial",
    selectedView: input.selectedView ?? "written",
    viewportWidth: requireViewportWidth(input.viewportWidth)
  });
  let status: KpPlaceValueAdditionControllerStatus = "idle";
  let navigation: KpPlaceValueAdditionNavigationSession | undefined;
  let surface: KpPlaceValueAdditionResponsiveSurface | undefined;
  let scheduler:
    KpReaderFrameScheduler<
      KpPlaceValueAdditionRenderRequest
    > | undefined;
  let lastAppliedRequest: KpPlaceValueAdditionRenderRequest | undefined;
  let mountCount = 0;
  let requestCount = 0;
  let sampleCount = 0;
  let applyCount = 0;
  let coalescedRequestCount = 0;
  let repeatedFrameReuseCount = 0;
  let hiddenRequestCount = 0;
  let nativeScenePreparationCount = 0;
  let nativeScenePreparationDurationMs = 0;
  let maximumPlanDurationMs = 0;
  let maximumApplyDurationMs = 0;
  let rendererSessionActiveCount: 0 | 1 = 0;
  const now = input.now ??
    (() => input.document.defaultView?.performance.now() ?? Date.now());

  const requireMounted = (): {
    readonly navigation: KpPlaceValueAdditionNavigationSession;
    readonly surface: KpPlaceValueAdditionResponsiveSurface;
    readonly scheduler:
      KpReaderFrameScheduler<KpPlaceValueAdditionRenderRequest>;
  } => {
    if (
      navigation === undefined ||
      surface === undefined ||
      scheduler === undefined ||
      (status !== "mounted" && status !== "suspended")
    ) {
      throw new Error(
        status === "disposed"
          ? "Place-value runtime controller is disposed."
          : "Place-value runtime controller must be mounted first."
      );
    }
    return { navigation, surface, scheduler };
  };

  const queue = (
    next: KpPlaceValueAdditionRenderRequest,
    immediate: boolean
  ): void => {
    const mounted = requireMounted();
    const schedulerState = mounted.scheduler.inspect();
    requestCount += 1;
    if (schedulerState.suspended) {
      hiddenRequestCount += 1;
    } else if (schedulerState.pending) {
      coalescedRequestCount += 1;
    }
    desired = freezeRequest(next);
    if (immediate) mounted.scheduler.renderNow(desired);
    else mounted.scheduler.render(desired);
    syncTelemetry();
  };

  const sampleRequest = (
    request: KpPlaceValueAdditionRenderRequest
  ): KpPlaceValueAdditionPlannedFrame => {
    const mounted = requireMounted();
    if (sameVisualRequest(request, lastAppliedRequest)) {
      return Object.freeze({
        request,
        frame: mounted.navigation.frame,
        reused: true,
        sampleDelta: 0
      });
    }
    const sequenceBefore = mounted.navigation.frame.clock.sequence;
    if (
      mounted.navigation.frame.responsive.mode !==
      responsiveMode(request.viewportWidth)
    ) {
      mounted.navigation.setViewportWidth(request.viewportWidth);
    }
    if (
      mounted.navigation.frame.responsive.selectedView !==
      request.selectedView
    ) {
      mounted.navigation.setView(request.selectedView);
    }
    const frame = request.checkpointId === undefined
      ? mounted.navigation.sampleProgress({
          progress: request.progress,
          source: request.source
        })
      : mounted.navigation.seekOutline(request.checkpointId);
    return Object.freeze({
      request,
      frame,
      reused: false,
      sampleDelta: frame.clock.sequence - sequenceBefore
    });
  };

  const syncTelemetry = (): void => {
    const root = surface?.root;
    if (root === undefined) return;
    root.dataset["kpPlaceValueRuntimeControllerStatus"] = status;
    root.dataset["kpPlaceValueSchedulerAuthority"] =
      kpPlaceValueAdditionRuntimeControllerPolicy.schedulerAuthority;
    root.dataset["kpPlaceValueFrameCacheKey"] =
      kpPlaceValueAdditionRuntimeControllerPolicy.frameCacheKey;
    root.dataset["kpPlaceValueRequestCount"] = String(requestCount);
    root.dataset["kpPlaceValueSampleCount"] = String(sampleCount);
    root.dataset["kpPlaceValueApplyCount"] = String(applyCount);
    root.dataset["kpPlaceValueCoalescedRequestCount"] =
      String(coalescedRequestCount);
    root.dataset["kpPlaceValueRepeatedFrameReuseCount"] =
      String(repeatedFrameReuseCount);
    root.dataset["kpPlaceValueHiddenRequestCount"] =
      String(hiddenRequestCount);
    root.dataset["kpPlaceValueNativeScenePreparationCount"] =
      String(nativeScenePreparationCount);
    root.dataset["kpPlaceValueNativeScenePreparationDurationMs"] =
      String(nativeScenePreparationDurationMs);
    root.dataset["kpPlaceValueMaximumPlanDurationMs"] =
      String(maximumPlanDurationMs);
    root.dataset["kpPlaceValueMaximumApplyDurationMs"] =
      String(maximumApplyDurationMs);
    root.dataset["kpPlaceValueRendererSessionActiveCount"] =
      String(rendererSessionActiveCount);
    root.dataset["kpPlaceValueWebglLeaseCount"] =
      String(kpPlaceValueAdditionRuntimeControllerPolicy.webglLeaseCount);
  };

  const controller: KpPlaceValueAdditionRuntimeController = {
    schemaVersion: "kp.place-value-addition-runtime-controller.v1",
    get root() {
      return surface?.root;
    },
    get surface() {
      return surface;
    },
    mount(host) {
      if (status === "disposed") {
        throw new Error("Place-value runtime controller is disposed.");
      }
      if (status !== "idle") {
        throw new Error("Place-value runtime controller is already mounted.");
      }
      if (host.ownerDocument !== input.document) {
        throw new Error(
          "Place-value runtime controller host must share its document."
        );
      }
      navigation = createKpPlaceValueAdditionNavigationSession({
        viewportWidth: desired.viewportWidth,
        selectedView: desired.selectedView
      });
      surface = createKpPlaceValueAdditionResponsiveSurface({
        document: input.document,
        navigation,
        onOutlineRequest: (anchorId) => controller.seekOutline(anchorId),
        onViewRequest: (view) => controller.setView(view)
      });
      host.append(surface.root);
      const preparationStartedAt = now();
      surface.shared.prepareNativeScenes();
      nativeScenePreparationCount += 1;
      nativeScenePreparationDurationMs =
        now() - preparationStartedAt;
      lastAppliedRequest = desired;
      mountCount += 1;
      sampleCount += 1;
      applyCount += 1;
      rendererSessionActiveCount = 1;
      status = "mounted";
      scheduler = createKpReaderFrameScheduler({
        ...(input.frameClock === undefined
          ? {}
          : { frameClock: input.frameClock }),
        readLayout: () => Object.freeze({
          viewportWidth: desired.viewportWidth
        }),
        planLayout: (layout) => layout,
        planFrame: ({ input: request }) => {
          const startedAt = now();
          const planned = sampleRequest(request);
          maximumPlanDurationMs = Math.max(
            maximumPlanDurationMs,
            now() - startedAt
          );
          return planned;
        },
        writeFrame: (planned) => {
          sampleCount += planned.sampleDelta;
          if (planned.reused) {
            repeatedFrameReuseCount += 1;
          } else {
            const startedAt = now();
            surface?.apply(planned.frame);
            maximumApplyDurationMs = Math.max(
              maximumApplyDurationMs,
              now() - startedAt
            );
            applyCount += 1;
          }
          lastAppliedRequest = planned.request;
          syncTelemetry();
        }
      });
      syncTelemetry();
      return surface;
    },
    requestProgress(request) {
      queue({
        ...desired,
        progress: requireProgress(request.progress),
        source: request.source,
        checkpointId: undefined
      }, false);
    },
    renderProgressNow(request) {
      queue({
        ...desired,
        progress: requireProgress(request.progress),
        source: request.source,
        checkpointId: undefined
      }, true);
    },
    seekOutline(anchorId) {
      const mounted = requireMounted();
      const anchor = mounted.navigation.outlineAnchors.find(
        (candidate) => candidate.id === anchorId
      );
      if (anchor === undefined) {
        throw new Error(`Unknown place-value outline anchor ${anchorId}.`);
      }
      queue({
        ...desired,
        progress: anchor.progressPermille / 1_000,
        source: "controls",
        checkpointId: anchor.id
      }, false);
    },
    setView(view) {
      if (view !== "written" && view !== "base-ten") {
        throw new Error(`Unknown place-value view ${String(view)}.`);
      }
      queue({
        ...desired,
        source: "controls",
        selectedView: view
      }, false);
    },
    setViewportWidth(viewportWidth) {
      const mounted = requireMounted();
      desired = freezeRequest({
        ...desired,
        viewportWidth: requireViewportWidth(viewportWidth)
      });
      mounted.scheduler.invalidate("resize");
      queue(desired, false);
    },
    invalidate(reason) {
      const mounted = requireMounted();
      mounted.scheduler.invalidate(reason);
      syncTelemetry();
    },
    setSuspended(suspended) {
      const mounted = requireMounted();
      mounted.scheduler.setSuspended(suspended);
      status = suspended ? "suspended" : "mounted";
      syncTelemetry();
    },
    inspect() {
      return Object.freeze({
        schemaVersion:
          "kp.place-value-addition-runtime-controller-state.v1" as const,
        status,
        mountCount,
        requestCount,
        sampleCount,
        applyCount,
        coalescedRequestCount,
        repeatedFrameReuseCount,
        hiddenRequestCount,
        nativeScenePreparationCount,
        nativeScenePreparationDurationMs,
        maximumPlanDurationMs,
        maximumApplyDurationMs,
        rendererSessionActiveCount,
        webglLeaseCount:
          kpPlaceValueAdditionRuntimeControllerPolicy.webglLeaseCount,
        lastAppliedProgress: lastAppliedRequest?.progress,
        lastAppliedView: lastAppliedRequest?.selectedView,
        scheduler: scheduler?.inspect()
      });
    },
    dispose() {
      if (status === "disposed") return;
      scheduler?.dispose();
      rendererSessionActiveCount = 0;
      status = "disposed";
      syncTelemetry();
      surface?.dispose();
      navigation = undefined;
      surface = undefined;
      lastAppliedRequest = undefined;
    }
  };
  return Object.freeze(controller);
}

function freezeRequest(
  request: KpPlaceValueAdditionRenderRequest
): KpPlaceValueAdditionRenderRequest {
  return Object.freeze({ ...request });
}

function sameVisualRequest(
  left: KpPlaceValueAdditionRenderRequest,
  right: KpPlaceValueAdditionRenderRequest | undefined
): boolean {
  return right !== undefined &&
    left.progress === right.progress &&
    left.selectedView === right.selectedView &&
    left.viewportWidth === right.viewportWidth;
}

function responsiveMode(
  viewportWidth: number
): KpPlaceValueAdditionRuntimeFrame["responsive"]["mode"] {
  return viewportWidth >= 881 ? "wide-both" : "phone-selected";
}

function requireProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(
      "Place-value controller progress must be finite and normalized."
    );
  }
  return value;
}

function requireViewportWidth(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      "Place-value controller viewport width must be finite and positive."
    );
  }
  return value;
}
