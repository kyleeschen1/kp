import type {
  EquationAnimationCatalogEntry,
  EquationAnimationId
} from "../editor/equation-animation-catalog.ts";
import {
  createEquationMotionPlan,
  type EquationMotionPlan
} from "../rendering/equation-motion-plan.ts";
import {
  createEquationMotionPlayer,
  type EquationMotionPlayer
} from "../rendering/equation-motion-player.ts";
import {
  createEquationMotionSampler,
  type EquationMotionFrame
} from "../rendering/equation-motion-sampler.ts";
import {
  findKpEquationAnimationSelection,
  kpEquationAnimationManifest,
  listKpEquationAnimationSelections,
  type KpEquationAnimationSelection
} from "./equation-animation-manifest.ts";

export {
  findKpEquationAnimationSelection,
  kpEquationAnimationManifest,
  listKpEquationAnimationSelections,
  type KpEquationAnimationSelection
};

export type { EquationMotionFrame, EquationMotionPlan };
export type {
  KpAnimationMotionPlan,
  KpAnimationProgressPlayer,
  KpAnimationRenderer,
  KpAnimationSampler,
  KpAnimationStepOptions,
  KpSampledAnimationFrame
} from "../animation/kernel.ts";
export type {
  SemanticObjectRef,
  SemanticTransformationRef
} from "../semantic/animation.ts";

export interface KpEquationAnimationSession {
  readonly animation: EquationAnimationCatalogEntry;
  readonly plan: EquationMotionPlan;
  readonly transitionIndex: number;
  readonly player: EquationMotionPlayer;
  setProgress(progress: number): EquationMotionFrame;
  getProgress(): number;
  getFrame(progress?: number): EquationMotionFrame;
  getTokenMetadata(tokenOrMotionId: string): KpEquationMotionTokenMetadata | undefined;
}

export interface KpEquationAnimationSessionOptions {
  readonly transitionIndex?: number;
  readonly render?: ((frame: EquationMotionFrame) => void) | undefined;
}

export interface KpEquationMotionTokenMetadata {
  readonly tokenId: string;
  readonly label: string;
  readonly lifecycle: EquationMotionPlan["tokens"][number]["lifecycle"];
  readonly visualLifecycle: EquationMotionPlan["tokens"][number]["visualLifecycle"];
  readonly correspondenceRelation: EquationMotionPlan["tokens"][number]["correspondenceRelation"];
  readonly sourceMotionId?: string | undefined;
  readonly targetMotionId?: string | undefined;
  readonly sourceLatex?: string | undefined;
  readonly targetLatex?: string | undefined;
}

export interface KpMotionHoverHandlers {
  readonly enter?: ((metadata: KpEquationMotionTokenMetadata, event: Event) => void) | undefined;
  readonly leave?: ((metadata: KpEquationMotionTokenMetadata, event: Event) => void) | undefined;
}

export async function loadKpEquationAnimation(
  id: EquationAnimationId | string
): Promise<EquationAnimationCatalogEntry> {
  const catalog = await import("../editor/equation-animation-catalog.ts");

  return catalog.findEquationAnimationCatalogEntry(id);
}

export async function createKpEquationAnimationSession(
  id: EquationAnimationId | string,
  options: KpEquationAnimationSessionOptions = {}
): Promise<KpEquationAnimationSession> {
  const animation = await loadKpEquationAnimation(id);

  return createKpEquationAnimationSessionFromEntry(animation, options);
}

export function createKpEquationAnimationSessionFromEntry(
  animation: EquationAnimationCatalogEntry,
  options: KpEquationAnimationSessionOptions = {}
): KpEquationAnimationSession {
  const transitionIndex = options.transitionIndex ?? 0;
  const transition = animation.transitions[transitionIndex];

  if (transition === undefined) {
    throw new Error(
      `Animation ${animation.id} does not have transition ${transitionIndex}.`
    );
  }

  const plan = createEquationMotionPlan(transition);
  const sampler = createEquationMotionSampler(plan);
  const player = createEquationMotionPlayer(plan, {
    render: options.render ?? (() => undefined)
  });

  return {
    animation,
    plan,
    transitionIndex,
    player,
    setProgress(progress) {
      const frame = sampler.sample(progress);

      player.setProgress(frame.progress);

      return frame;
    },
    getProgress() {
      return player.getProgress();
    },
    getFrame(progress = player.getProgress()) {
      return sampler.sample(progress);
    },
    getTokenMetadata(tokenOrMotionId) {
      return findKpEquationMotionTokenMetadata(plan, tokenOrMotionId);
    }
  };
}

export function findKpEquationMotionTokenMetadata(
  plan: EquationMotionPlan,
  tokenOrMotionId: string
): KpEquationMotionTokenMetadata | undefined {
  const token = plan.tokens.find(
    (candidate) =>
      candidate.id === tokenOrMotionId ||
      candidate.sourceMotionId === tokenOrMotionId ||
      candidate.targetMotionId === tokenOrMotionId
  );

  if (token === undefined) {
    return undefined;
  }

  return {
    tokenId: token.id,
    label: token.label,
    lifecycle: token.lifecycle,
    visualLifecycle: token.visualLifecycle,
    correspondenceRelation: token.correspondenceRelation,
    ...(token.sourceMotionId === undefined
      ? {}
      : { sourceMotionId: token.sourceMotionId }),
    ...(token.targetMotionId === undefined
      ? {}
      : { targetMotionId: token.targetMotionId }),
    ...(token.sourceLatex === undefined ? {} : { sourceLatex: token.sourceLatex }),
    ...(token.targetLatex === undefined ? {} : { targetLatex: token.targetLatex })
  };
}

export function bindKpEquationMotionHover(
  root: ParentNode & EventTarget,
  session: Pick<KpEquationAnimationSession, "getTokenMetadata">,
  handlers: KpMotionHoverHandlers
): () => void {
  const handleEnter = (event: Event): void => {
    const motionId = motionIdFromEvent(event);
    const metadata =
      motionId === undefined ? undefined : session.getTokenMetadata(motionId);

    if (metadata !== undefined) {
      handlers.enter?.(metadata, event);
    }
  };
  const handleLeave = (event: Event): void => {
    const motionId = motionIdFromEvent(event);
    const metadata =
      motionId === undefined ? undefined : session.getTokenMetadata(motionId);

    if (metadata !== undefined) {
      handlers.leave?.(metadata, event);
    }
  };

  root.addEventListener("pointerover", handleEnter);
  root.addEventListener("pointerout", handleLeave);

  return () => {
    root.removeEventListener("pointerover", handleEnter);
    root.removeEventListener("pointerout", handleLeave);
  };
}

function motionIdFromEvent(event: Event): string | undefined {
  if (!(event.target instanceof Element)) {
    return undefined;
  }

  return event.target.closest<HTMLElement>("[data-kp-motion-id]")?.dataset[
    "kpMotionId"
  ];
}
