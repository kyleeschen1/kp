export type KpGraph2DRuntimeSessionStatus = "mounted" | "disposed";

export interface KpGraph2DRuntimeSession<Content extends object, Frame, Viewport> {
  readonly content: Content;
  readonly status: KpGraph2DRuntimeSessionStatus;
  apply(input: {
    readonly frame: Frame;
    readonly viewport: Viewport;
  }): void;
  dispose(): void;
}

export type KpGraph2DRuntimeSessionFactory<
  Content extends object,
  Frame,
  Viewport,
  Session extends KpGraph2DRuntimeSession<Content, Frame, Viewport>
> = (input: {
  readonly content: Content;
  readonly frame: Frame;
  readonly viewport: Viewport;
}) => Session;

export interface KpGraph2DRuntimeSessionApplyResult<Session> {
  readonly session: Session;
  readonly created: boolean;
}

export class KpGraph2DRuntimeSessionLifecycle<
  Owner extends object,
  Content extends object,
  Frame,
  Viewport,
  Session extends KpGraph2DRuntimeSession<Content, Frame, Viewport>
> {
  readonly #sessions = new WeakMap<Owner, Session>();
  readonly #createSession: KpGraph2DRuntimeSessionFactory<
    Content,
    Frame,
    Viewport,
    Session
  >;

  constructor(
    createSession: KpGraph2DRuntimeSessionFactory<
      Content,
      Frame,
      Viewport,
      Session
    >
  ) {
    this.#createSession = createSession;
  }

  apply(input: {
    readonly owner: Owner;
    readonly content: Content;
    readonly frame: Frame;
    readonly viewport: Viewport;
  }): KpGraph2DRuntimeSessionApplyResult<Session> {
    const extant = this.#sessions.get(input.owner);
    if (extant?.status === "mounted" && extant.content === input.content) {
      extant.apply({ frame: input.frame, viewport: input.viewport });
      return Object.freeze({ session: extant, created: false });
    }

    if (extant !== undefined) {
      // Delete first so a failing domain disposer cannot leave a stale owner entry.
      this.#sessions.delete(input.owner);
      extant.dispose();
    }

    // Factories own initial-frame application; applying again here would double-paint.
    const session = this.#createSession({
      content: input.content,
      frame: input.frame,
      viewport: input.viewport
    });
    if (session.status !== "mounted" || session.content !== input.content) {
      session.dispose();
      throw new Error(
        "Graph2D runtime factories must return a mounted session for the requested content."
      );
    }
    this.#sessions.set(input.owner, session);
    return Object.freeze({ session, created: true });
  }

  dispose(owner: Owner): void {
    const extant = this.#sessions.get(owner);
    if (extant === undefined) return;

    this.#sessions.delete(owner);
    extant.dispose();
  }
}
