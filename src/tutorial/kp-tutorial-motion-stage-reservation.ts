export const kpTutorialMotionStageReservationClass =
  "kp-tutorial-motion-stage-reservation";
export const kpTutorialMotionStageBlockSizeProperty =
  "--kp-tutorial-motion-stage-block-size";

export interface KpTutorialMotionStageSession {
  pause(): void;
  dispose(): void;
}

export type KpTutorialMotionStageReservationState =
  | "dehydrated"
  | "hydrated"
  | "disposed";

/**
 * Static and live surfaces remain siblings in one reserved grid cell. The
 * host controls lifecycle only; renderers retain all semantic and paint truth.
 */
export class KpTutorialMotionStageReservationHost {
  private readonly root: HTMLElement;
  private readonly staticSurface: HTMLElement;
  private readonly liveSurface: HTMLElement;
  private session: KpTutorialMotionStageSession | undefined;
  private state: KpTutorialMotionStageReservationState = "dehydrated";

  constructor(input: {
    readonly root: HTMLElement;
    readonly staticSurface: HTMLElement;
    readonly liveSurface: HTMLElement;
    readonly reservedBlockSize: number;
  }) {
    if (input.root === input.staticSurface ||
        input.root === input.liveSurface ||
        input.staticSurface === input.liveSurface) {
      throw new Error("Tutorial stage reservation surfaces must be distinct.");
    }
    if (!Number.isFinite(input.reservedBlockSize) || input.reservedBlockSize <= 0) {
      throw new Error("Tutorial stage reserved block size must be positive.");
    }
    this.root = input.root;
    this.staticSurface = input.staticSurface;
    this.liveSurface = input.liveSurface;
    this.root.classList.add(kpTutorialMotionStageReservationClass);
    this.root.style.setProperty(
      kpTutorialMotionStageBlockSizeProperty,
      `${input.reservedBlockSize}px`
    );
    this.root.dataset["kpTutorialMotionStageRuntime"] = "dehydrated";
    this.staticSurface.dataset["kpTutorialStaticStage"] = "";
    this.liveSurface.dataset["kpTutorialLiveStage"] = "";
    this.staticSurface.hidden = false;
    this.staticSurface.setAttribute("aria-hidden", "false");
    this.liveSurface.hidden = true;
    this.liveSurface.setAttribute("aria-hidden", "true");
  }

  snapshot(): KpTutorialMotionStageReservationState {
    return this.state;
  }

  hydrate(
    mount: (surface: HTMLElement) => KpTutorialMotionStageSession
  ): KpTutorialMotionStageSession {
    this.assertPresent();
    if (this.session !== undefined) return this.session;
    let session: KpTutorialMotionStageSession;
    try {
      session = mount(this.liveSurface);
      assertSession(session);
    } catch (error) {
      this.liveSurface.replaceChildren();
      this.liveSurface.hidden = true;
      this.liveSurface.setAttribute("aria-hidden", "true");
      throw error;
    }
    this.session = session;
    // Reveal mounted paint before hiding the static surface so there is no blank frame.
    this.liveSurface.hidden = false;
    this.liveSurface.setAttribute("aria-hidden", "false");
    this.staticSurface.hidden = true;
    this.staticSurface.setAttribute("aria-hidden", "true");
    this.state = "hydrated";
    this.root.dataset["kpTutorialMotionStageRuntime"] = "hydrated";
    return session;
  }

  dehydrate(): void {
    this.assertPresent();
    if (this.session === undefined) return;
    const session = this.session;
    this.session = undefined;
    // Restore static paint before hiding or disposing live paint.
    this.staticSurface.hidden = false;
    this.staticSurface.setAttribute("aria-hidden", "false");
    this.liveSurface.hidden = true;
    this.liveSurface.setAttribute("aria-hidden", "true");
    this.state = "dehydrated";
    this.root.dataset["kpTutorialMotionStageRuntime"] = "dehydrated";
    let failure: unknown;
    try {
      session.pause();
    } catch (error) {
      failure = error;
    }
    try {
      session.dispose();
    } catch (error) {
      failure ??= error;
    }
    this.liveSurface.replaceChildren();
    if (failure !== undefined) throw failure;
  }

  dispose(): void {
    if (this.state === "disposed") return;
    let failure: unknown;
    try {
      this.dehydrate();
    } catch (error) {
      failure = error;
    } finally {
      this.state = "disposed";
      this.root.dataset["kpTutorialMotionStageRuntime"] = "disposed";
      this.root.style.removeProperty(kpTutorialMotionStageBlockSizeProperty);
      this.root.classList.remove(kpTutorialMotionStageReservationClass);
      delete this.staticSurface.dataset["kpTutorialStaticStage"];
      delete this.liveSurface.dataset["kpTutorialLiveStage"];
    }
    if (failure !== undefined) throw failure;
  }

  private assertPresent(): void {
    if (this.state === "disposed") {
      throw new Error("Disposed tutorial stage reservation cannot be reused.");
    }
  }
}

function assertSession(
  session: KpTutorialMotionStageSession
): asserts session is KpTutorialMotionStageSession {
  if (session === null || typeof session !== "object" ||
      typeof session.pause !== "function" ||
      typeof session.dispose !== "function") {
    throw new Error("Tutorial stage mount must return a pausable disposable session.");
  }
}
