import {
  KpTutorialScrollCoordinator,
  type KpTutorialCoordinatedScrollProjection,
  type KpTutorialMotionCorridor,
  type KpTutorialScrollCoordinatorMetrics,
  type KpTutorialScrollCoordinatorOptions
} from "./kp-tutorial-motion.ts";

export interface KpTutorialPageScrollBlockRegistration<
  RegistrationId extends string = string,
  PassageId extends string = string,
  BlockId extends string = string
> {
  readonly id: RegistrationId;
  readonly passageId: PassageId;
  readonly blockId: BlockId;
  readonly anchor: HTMLElement;
  readonly corridor: KpTutorialMotionCorridor;
  readonly snapTolerance?: number | undefined;
}

export interface KpTutorialPageScrollBlockProjection<
  RegistrationId extends string = string,
  PassageId extends string = string,
  BlockId extends string = string
> {
  readonly id: RegistrationId;
  readonly passageId: PassageId;
  readonly blockId: BlockId;
  readonly anchorTop: number;
  readonly travel: number;
  readonly progress: number;
  readonly distanceFromReadingBand: number;
  readonly ownsScroll: boolean;
}

export interface KpTutorialPageScrollProjection<
  RegistrationId extends string = string,
  PassageId extends string = string,
  BlockId extends string = string
> {
  readonly activeRegistrationId: RegistrationId | undefined;
  readonly activePassageId: PassageId | undefined;
  readonly activeBlockId: BlockId | undefined;
  readonly nearViewportRegistrationIds: readonly RegistrationId[];
  readonly nearViewportPassageIds: readonly PassageId[];
  readonly readingBandY: number;
  readonly scrollY: number;
  readonly scrollChanged: boolean;
  readonly blocks: readonly KpTutorialPageScrollBlockProjection<
    RegistrationId,
    PassageId,
    BlockId
  >[];
}

export function projectKpTutorialPageScrollFrame<
  RegistrationId extends string,
  PassageId extends string,
  BlockId extends string
>(input: {
  readonly registrations: readonly KpTutorialPageScrollBlockRegistration<
    RegistrationId,
    PassageId,
    BlockId
  >[];
  readonly projection: KpTutorialCoordinatedScrollProjection<RegistrationId>;
}): KpTutorialPageScrollProjection<RegistrationId, PassageId, BlockId> {
  const registrationsById = new Map(input.registrations.map(
    (registration) => [registration.id, registration] as const
  ));
  if (registrationsById.size !== input.registrations.length) {
    throw new Error("Tutorial page scroll registration ids must be unique.");
  }
  const blocks = Object.freeze(input.projection.blocks.map((block) => {
    const registration = registrationsById.get(block.id);
    if (registration === undefined) {
      throw new Error(`Missing tutorial page scroll registration: ${block.id}`);
    }
    return Object.freeze({
      id: block.id,
      passageId: registration.passageId,
      blockId: registration.blockId,
      anchorTop: block.anchorTop,
      travel: block.travel,
      progress: block.progress,
      distanceFromReadingBand: block.distanceFromReadingBand,
      ownsScroll: block.ownsScroll
    });
  }));
  const activeRegistration = input.projection.activeBlockId === undefined
    ? undefined
    : registrationsById.get(input.projection.activeBlockId);
  if (input.projection.activeBlockId !== undefined &&
      activeRegistration === undefined) {
    throw new Error(
      `Missing active tutorial page scroll registration: ` +
      input.projection.activeBlockId
    );
  }
  const nearViewportRegistrations = input.projection.nearViewportBlockIds.map(
    (id) => {
      const registration = registrationsById.get(id);
      if (registration === undefined) {
        throw new Error(`Missing near-viewport page scroll registration: ${id}`);
      }
      return registration;
    }
  );
  return Object.freeze({
    activeRegistrationId: input.projection.activeBlockId,
    activePassageId: activeRegistration?.passageId,
    activeBlockId: activeRegistration?.blockId,
    nearViewportRegistrationIds: Object.freeze(
      nearViewportRegistrations.map(({ id }) => id)
    ),
    nearViewportPassageIds: Object.freeze(
      [...new Set(nearViewportRegistrations.map(({ passageId }) => passageId))]
    ),
    readingBandY: input.projection.readingBandY,
    scrollY: input.projection.scrollY,
    scrollChanged: input.projection.scrollChanged,
    blocks
  });
}

/**
 * One page-level adapter owns the only underlying scroll listener and rAF.
 * Passage grouping remains data projection, so mounting more stages cannot
 * accidentally create a clock per stage.
 */
export class KpTutorialPageScrollCoordinator<
  RegistrationId extends string,
  PassageId extends string,
  BlockId extends string
> {
  private readonly registrations: () => readonly KpTutorialPageScrollBlockRegistration<
    RegistrationId,
    PassageId,
    BlockId
  >[];
  private readonly onProjection: (
    projection: KpTutorialPageScrollProjection<RegistrationId, PassageId, BlockId>
  ) => void;
  private readonly coordinator: KpTutorialScrollCoordinator<RegistrationId>;
  private registrationSnapshot: readonly KpTutorialPageScrollBlockRegistration<
    RegistrationId,
    PassageId,
    BlockId
  >[] | undefined;

  constructor(
    view: Window,
    registrations: () => readonly KpTutorialPageScrollBlockRegistration<
      RegistrationId,
      PassageId,
      BlockId
    >[],
    onProjection: (
      projection: KpTutorialPageScrollProjection<RegistrationId, PassageId, BlockId>
    ) => void,
    options: KpTutorialScrollCoordinatorOptions = {}
  ) {
    this.registrations = registrations;
    this.onProjection = onProjection;
    this.coordinator = new KpTutorialScrollCoordinator(
      view,
      () => this.currentRegistrations().map((registration) => ({
        id: registration.id,
        anchor: registration.anchor,
        corridor: registration.corridor,
        ...(registration.snapTolerance === undefined
          ? {}
          : { snapTolerance: registration.snapTolerance })
      })),
      this.handleProjection,
      options
    );
  }

  connect(): void {
    this.coordinator.connect();
  }

  disconnect(): void {
    this.coordinator.disconnect();
  }

  readonly scheduleProjection = (): void => {
    this.coordinator.scheduleProjection();
  };

  invalidateGeometry(): void {
    this.registrationSnapshot = undefined;
    this.coordinator.invalidateGeometry();
  }

  cancelPendingProjection(): void {
    this.coordinator.cancelPendingProjection();
  }

  snapshotMetrics(): KpTutorialScrollCoordinatorMetrics {
    return this.coordinator.snapshotMetrics();
  }

  resetMetrics(): void {
    this.coordinator.resetMetrics();
  }

  private readonly handleProjection = (
    projection: KpTutorialCoordinatedScrollProjection<RegistrationId>
  ): void => {
    this.onProjection(projectKpTutorialPageScrollFrame({
      registrations: this.currentRegistrations(),
      projection
    }));
  };

  private currentRegistrations(): readonly KpTutorialPageScrollBlockRegistration<
    RegistrationId,
    PassageId,
    BlockId
  >[] {
    if (this.registrationSnapshot !== undefined) return this.registrationSnapshot;
    const registrations = this.registrations();
    const ids = new Set(registrations.map(({ id }) => id));
    if (ids.size !== registrations.length) {
      throw new Error("Tutorial page scroll registration ids must be unique.");
    }
    this.registrationSnapshot = Object.freeze([...registrations]);
    return this.registrationSnapshot;
  }
}
