import type { KpDevReviewCaptureV1 } from "../../protocols/dev-review-v1.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  type KpDevReviewRoundV2
} from "../../protocols/dev-review-v2.ts";
import type {
  KpDevReviewQueryResult
} from "../../protocols/dev-review-operations-v2.ts";
import {
  browserKpDevReviewEnvironmentSource,
  captureKpDevReviewEnvironment
} from "./build-environment.ts";
import {
  KpDevReviewCaptureProviderRegistry,
  type KpDevReviewCaptureProvider
} from "./capture-provider.ts";
import { KpDevReviewClient } from "./client.ts";
import { mountKpDevReviewComposer } from "./review-composer.ts";
import type { KpDevReviewPlacement } from "./review-placement.ts";
import {
  getOrCreateKpDevReviewSessionId,
  type KpDevReviewSessionStorage
} from "./review-session.ts";
import { mountKpDevReviewShell } from "./review-shell.ts";
import type { KpDevReviewPointerGeometry } from "./semantic-target.ts";

declare const __KP_DEV_REVIEW_BUILD__: Readonly<{
  commit: string;
  fingerprint: string;
  dirty: boolean;
}>;

export function mountKpDevReview(input: {
  readonly ownerWindow?: Window;
  readonly provider: KpDevReviewCaptureProvider;
  readonly placement: (viewportWidth: number) => KpDevReviewPlacement;
  readonly beforeCapture?: (() => Promise<void>) | undefined;
  readonly onDispose?: (() => void) | undefined;
}): () => void {
  const ownerWindow = input.ownerWindow ?? window;
  const ownerDocument = ownerWindow.document;
  if (ownerDocument.querySelector("[data-kp-dev-review-shell]") !== null) {
    return () => undefined;
  }

  const registry = new KpDevReviewCaptureProviderRegistry();
  const unregisterProvider = registry.register(input.provider);
  const shell = mountKpDevReviewShell(ownerDocument, {
    placement: input.placement(ownerWindow.innerWidth)
  });
  const syncPlacement = (): void => {
    shell.setPlacement(input.placement(ownerWindow.innerWidth));
  };
  ownerWindow.addEventListener("resize", syncPlacement, { passive: true });

  const client = new KpDevReviewClient();
  let currentUnread = 0;
  const currentRound = client
    .query({ unreadBy: "codex.main" })
    .then(async (state) => {
      currentUnread = state.counts.matching;
      shell.setInboxCount(currentUnread);
      return resolveCurrentRound(client, state);
    })
    .then((round) => {
      shell.setReviewRound(round.label, round.sequence, round.synthetic);
      return round;
    })
    .catch((error: unknown) => {
      shell.reviewRound.value = "Review round unavailable";
      throw error;
    });
  const sessionId = getOrCreateKpDevReviewSessionId({
    buildFingerprint: __KP_DEV_REVIEW_BUILD__.fingerprint,
    storage: safeSessionStorage(ownerWindow)
  });
  let pointer:
    | {
        target: EventTarget | null;
        geometry: KpDevReviewPointerGeometry;
      }
    | undefined;
  const onPointerMove = (event: PointerEvent): void => {
    if (
      event.target === shell.host ||
      (event.target instanceof Node && shell.host.contains(event.target))
    ) {
      return;
    }
    pointer = {
      target: event.target,
      geometry: {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY
      }
    };
  };
  ownerDocument.addEventListener("pointermove", onPointerMove, {
    passive: true
  });

  const composer = mountKpDevReviewComposer({
    shell,
    capture: async () => {
      await input.beforeCapture?.();
      const capturedAtMs = ownerWindow.performance.now();
      const capture = await registry.capture({
        route: new URL(ownerWindow.location.href),
        capturedAtMs,
        eventTarget: pointer?.target ?? null,
        pointer: pointer?.geometry
      });
      if (capture === undefined) {
        throw new Error("No visual review capture provider is ready");
      }
      const result: KpDevReviewCaptureV1 = {
        route: ownerWindow.location.href,
        capturedAt: new Date().toISOString(),
        environment: captureKpDevReviewEnvironment(
          browserKpDevReviewEnvironmentSource(
            ownerWindow,
            ownerWindow.navigator
          ),
          __KP_DEV_REVIEW_BUILD__
        ),
        ...capture.evidence
      };
      return result;
    },
    submit: async ({ comment, capture }) => {
      const round = await currentRound;
      const note = await client.createNote({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        roundId: round.id,
        sessionId,
        comment,
        capture
      });
      currentUnread += 1;
      return { sequence: note.sequence, inboxCount: currentUnread };
    }
  });

  ownerDocument.body.dataset["kpDevReviewReady"] = "true";
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    delete ownerDocument.body.dataset["kpDevReviewReady"];
    ownerDocument.removeEventListener("pointermove", onPointerMove);
    ownerWindow.removeEventListener("resize", syncPlacement);
    ownerWindow.removeEventListener("pagehide", dispose);
    unregisterProvider();
    composer.dispose();
    shell.dispose();
    input.onDispose?.();
  };
  ownerWindow.addEventListener("pagehide", dispose, { once: true });
  return dispose;
}

async function resolveCurrentRound(
  client: KpDevReviewClient,
  state: KpDevReviewQueryResult
): Promise<
  Pick<KpDevReviewRoundV2, "id" | "label" | "sequence" | "synthetic">
> {
  const current = state.rounds.find((round) => round.status === "open");
  if (current !== undefined) return current;
  return client.openRound({
    label: "Current visual review",
    baseline: {
      commit: __KP_DEV_REVIEW_BUILD__.commit,
      fingerprint: __KP_DEV_REVIEW_BUILD__.fingerprint,
      dirty: __KP_DEV_REVIEW_BUILD__.dirty
    }
  });
}

function safeSessionStorage(
  ownerWindow: Window
): KpDevReviewSessionStorage {
  try {
    const storage = ownerWindow.sessionStorage;
    const probe = "kp.dev-review.storage-probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    const values = new Map<string, string>();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      }
    };
  }
}
