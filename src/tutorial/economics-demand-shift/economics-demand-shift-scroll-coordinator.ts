import type {
  KpEconomicsMotionBlockId,
  KpEconomicsMotionCorridor
} from "./economics-demand-shift-motion-blocks.ts";
import {
  projectKpEconomicsMotionCorridor,
  type KpEconomicsMotionCorridorProjection
} from "./economics-demand-shift-scroll-corridor.ts";

export interface KpEconomicsScrollBlockGeometry {
  readonly id: KpEconomicsMotionBlockId;
  readonly anchorTop: number;
  readonly corridor: KpEconomicsMotionCorridor;
}

export interface KpEconomicsScrollBlockProjection
  extends KpEconomicsMotionCorridorProjection {
  readonly id: KpEconomicsMotionBlockId;
  readonly anchorTop: number;
  readonly distanceFromReadingBand: number;
  readonly ownsScroll: boolean;
}

export interface KpEconomicsScrollFrameProjection {
  readonly activeBlockId: KpEconomicsMotionBlockId | undefined;
  readonly readingBandY: number;
  readonly blocks: readonly KpEconomicsScrollBlockProjection[];
}

export interface KpEconomicsScrollBlockRegistration {
  readonly id: KpEconomicsMotionBlockId;
  readonly anchor: HTMLElement;
  readonly corridor: KpEconomicsMotionCorridor;
}

export interface KpEconomicsCoordinatedScrollProjection
  extends KpEconomicsScrollFrameProjection {
  readonly crossingDirection: "forward" | "rewind" | undefined;
}

export function projectKpEconomicsScrollFrame(input: {
  readonly blocks: readonly KpEconomicsScrollBlockGeometry[];
  readonly viewportHeight: number;
}): KpEconomicsScrollFrameProjection {
  const viewportHeight = Number.isFinite(input.viewportHeight) &&
      input.viewportHeight > 0
    ? input.viewportHeight
    : 1;
  const readingBandY = viewportHeight * 0.38;
  const candidates = input.blocks.map((block) => {
    const corridor = projectKpEconomicsMotionCorridor({
      corridor: block.corridor,
      anchorTop: block.anchorTop,
      viewportHeight
    });
    return {
      ...block,
      ...corridor,
      distanceFromReadingBand: Math.abs(block.anchorTop - readingBandY)
    };
  });
  const inCorridor = candidates.filter(({ travel }) => travel > 0 && travel < 1);
  const owner = [...(inCorridor.length > 0 ? inCorridor : candidates)]
    .sort((left, right) =>
      left.distanceFromReadingBand - right.distanceFromReadingBand
    )[0];

  return Object.freeze({
    activeBlockId: owner?.id,
    readingBandY,
    blocks: Object.freeze(candidates.map((candidate) => Object.freeze({
      id: candidate.id,
      anchorTop: candidate.anchorTop,
      travel: candidate.travel,
      progress: candidate.progress,
      distanceFromReadingBand: candidate.distanceFromReadingBand,
      ownsScroll: candidate.id === owner?.id
    })))
  });
}

export class KpEconomicsTutorialScrollCoordinator {
  private readonly view: Window;
  private readonly registrations: () =>
    readonly KpEconomicsScrollBlockRegistration[];
  private readonly onProjection: (
    projection: KpEconomicsCoordinatedScrollProjection
  ) => void;
  private frame: number | undefined;
  private connected = false;
  private previousScrollY: number | undefined;
  private readonly previousTops = new Map<KpEconomicsMotionBlockId, number>();

  constructor(
    view: Window,
    registrations: () =>
      readonly KpEconomicsScrollBlockRegistration[],
    onProjection: (
      projection: KpEconomicsCoordinatedScrollProjection
    ) => void
  ) {
    this.view = view;
    this.registrations = registrations;
    this.onProjection = onProjection;
  }

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.previousScrollY = this.view.scrollY;
    for (const registration of this.registrations()) {
      this.previousTops.set(
        registration.id,
        registration.anchor.getBoundingClientRect().top
      );
    }
    this.view.addEventListener("scroll", this.scheduleProjection, {
      passive: true
    });
    this.view.addEventListener("resize", this.scheduleProjection);
    this.scheduleProjection();
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    this.view.removeEventListener("scroll", this.scheduleProjection);
    this.view.removeEventListener("resize", this.scheduleProjection);
    this.cancelPendingProjection();
    this.previousTops.clear();
  }

  readonly scheduleProjection = (): void => {
    if (!this.connected || this.frame !== undefined) return;
    this.frame = this.view.requestAnimationFrame(() => {
      this.frame = undefined;
      this.project();
    });
  };

  cancelPendingProjection(): void {
    if (this.frame === undefined) return;
    this.view.cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  private project(): void {
    const registrations = this.registrations();
    const geometry = registrations.map(({ id, anchor, corridor }) => ({
      id,
      corridor,
      anchorTop: anchor.getBoundingClientRect().top
    }));
    const projection = projectKpEconomicsScrollFrame({
      blocks: geometry,
      viewportHeight: this.view.innerHeight
    });
    const active = projection.blocks.find(({ ownsScroll }) => ownsScroll);
    const previousTop = active === undefined
      ? undefined
      : this.previousTops.get(active.id);
    const previousScrollY = this.previousScrollY;
    const scrollY = this.view.scrollY;
    let crossingDirection: "forward" | "rewind" | undefined;
    if (active !== undefined && previousTop !== undefined &&
        previousScrollY !== undefined) {
      if (
        scrollY > previousScrollY &&
        previousTop > projection.readingBandY &&
        active.anchorTop <= projection.readingBandY + 2
      ) {
        crossingDirection = "forward";
      } else if (
        scrollY < previousScrollY &&
        previousTop < projection.readingBandY &&
        active.anchorTop >= projection.readingBandY - 2
      ) {
        crossingDirection = "rewind";
      }
    }
    this.previousScrollY = scrollY;
    for (const block of geometry) this.previousTops.set(block.id, block.anchorTop);
    this.onProjection(Object.freeze({ ...projection, crossingDirection }));
  }
}
