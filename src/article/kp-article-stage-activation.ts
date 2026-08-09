import type { KpArticleStageManifest } from "./kp-article-stage-manifest.ts";

export type KpArticleStageActivationReason = "direct-address" | "near-viewport";
export type KpArticleStageActivationState = "idle" | "loading" | "ready" | "failed";

export interface KpArticleStageActivation {
  readonly stageId: string;
  readonly reason: KpArticleStageActivationReason;
  readonly state: Exclude<KpArticleStageActivationState, "idle">;
  readonly error?: unknown;
}

export interface KpArticleStageActivationController<Session> {
  readonly activateStage: (
    stageId: string,
    reason: KpArticleStageActivationReason
  ) => Promise<Session>;
  readonly activateAddress: (address: string) => Promise<Session | undefined>;
  readonly state: (stageId: string) => KpArticleStageActivationState;
  readonly session: (stageId: string) => Session | undefined;
}

export function createKpArticleStageActivationController<Session>(input: {
  readonly manifests: readonly KpArticleStageManifest[];
  readonly load: (
    manifest: KpArticleStageManifest,
    reason: KpArticleStageActivationReason
  ) => Promise<Session>;
  readonly onChange?: (activation: KpArticleStageActivation) => void;
}): KpArticleStageActivationController<Session> {
  const manifests = new Map(input.manifests.map((manifest) => [manifest.stageId, manifest]));
  const pending = new Map<string, Promise<Session>>();
  const sessions = new Map<string, Session>();
  const failures = new Set<string>();

  const activateStage = async (
    stageId: string,
    reason: KpArticleStageActivationReason
  ): Promise<Session> => {
    const manifest = manifests.get(stageId);
    if (manifest === undefined) throw new Error(`Unknown KP article stage ${stageId}.`);
    const ready = sessions.get(stageId);
    if (ready !== undefined) return ready;
    const existing = pending.get(stageId);
    if (existing !== undefined) return existing;
    failures.delete(stageId);
    input.onChange?.(Object.freeze({ stageId, reason, state: "loading" }));
    const request = input.load(manifest, reason).then(
      (session) => {
        pending.delete(stageId);
        sessions.set(stageId, session);
        input.onChange?.(Object.freeze({ stageId, reason, state: "ready" }));
        return session;
      },
      (error: unknown) => {
        pending.delete(stageId);
        failures.add(stageId);
        input.onChange?.(Object.freeze({ stageId, reason, state: "failed", error }));
        throw error;
      }
    );
    pending.set(stageId, request);
    return request;
  };

  return Object.freeze({
    activateStage,
    activateAddress: async (address: string) => {
      const stageId = stageIdFromAddress(address, manifests);
      return stageId === undefined ? undefined : activateStage(stageId, "direct-address");
    },
    state: (stageId: string): KpArticleStageActivationState => {
      if (sessions.has(stageId)) return "ready";
      if (pending.has(stageId)) return "loading";
      if (failures.has(stageId)) return "failed";
      return "idle";
    },
    session: (stageId: string) => sessions.get(stageId)
  });
}

function stageIdFromAddress(
  address: string,
  manifests: ReadonlyMap<string, KpArticleStageManifest>
): string | undefined {
  const fragment = address.startsWith("#") ? address.slice(1) : address;
  const semantic = fragment.startsWith("kp-ref:") ? fragment.slice("kp-ref:".length) : fragment;
  const candidate = semantic.split("/", 1)[0]!;
  return manifests.has(candidate) ? candidate : undefined;
}
