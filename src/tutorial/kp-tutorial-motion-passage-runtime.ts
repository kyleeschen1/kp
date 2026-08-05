import type {
  KpTutorialMotionPassageLifecyclePlan
} from "./kp-tutorial-motion-passage-lifecycle.ts";
import {
  KpTutorialMotionStageReservationHost,
  type KpTutorialMotionStageSession
} from "./kp-tutorial-motion-stage-reservation.ts";

export interface KpTutorialMotionPassageCapability<
  CapabilityId extends string = string,
  PassageId extends string = string
> {
  readonly id: CapabilityId;
  mount(input: {
    readonly passageId: PassageId;
    readonly surface: HTMLElement;
  }): KpTutorialMotionStageSession;
}

export interface KpTutorialMotionPassageRuntimeRegistration<
  PassageId extends string = string,
  CapabilityId extends string = string
> {
  readonly passageId: PassageId;
  readonly capabilityId: CapabilityId;
  readonly host: KpTutorialMotionStageReservationHost;
}

/** Concurrent passages share one module promise but never share sessions. */
export class KpTutorialMotionCapabilityCache<
  CapabilityId extends string,
  PassageId extends string
> {
  private readonly loader: (
    capabilityId: CapabilityId
  ) => Promise<KpTutorialMotionPassageCapability<CapabilityId, PassageId>>;
  private readonly capabilities = new Map<
    CapabilityId,
    Promise<KpTutorialMotionPassageCapability<CapabilityId, PassageId>>
  >();

  constructor(loader: (
    capabilityId: CapabilityId
  ) => Promise<KpTutorialMotionPassageCapability<CapabilityId, PassageId>>) {
    this.loader = loader;
  }

  load(
    capabilityId: CapabilityId
  ): Promise<KpTutorialMotionPassageCapability<CapabilityId, PassageId>> {
    const cached = this.capabilities.get(capabilityId);
    if (cached !== undefined) return cached;
    const pending = Promise.resolve()
      .then(() => this.loader(capabilityId))
      .then((capability) => {
        if (capability.id !== capabilityId) {
          throw new Error(
            `Tutorial capability loader returned ${capability.id} for ${capabilityId}.`
          );
        }
        return capability;
      })
      .catch((error: unknown) => {
        this.capabilities.delete(capabilityId);
        throw error;
      });
    this.capabilities.set(capabilityId, pending);
    return pending;
  }
}

export class KpTutorialMotionPassageRuntimeCoordinator<
  PassageId extends string,
  CapabilityId extends string
> {
  private readonly registrations: ReadonlyMap<
    PassageId,
    KpTutorialMotionPassageRuntimeRegistration<PassageId, CapabilityId>
  >;
  private readonly capabilities: KpTutorialMotionCapabilityCache<
    CapabilityId,
    PassageId
  >;
  private revision = 0;
  private disposed = false;

  constructor(input: {
    readonly registrations: readonly KpTutorialMotionPassageRuntimeRegistration<
      PassageId,
      CapabilityId
    >[];
    readonly loadCapability: (
      capabilityId: CapabilityId
    ) => Promise<KpTutorialMotionPassageCapability<CapabilityId, PassageId>>;
  }) {
    const registrations = new Map(input.registrations.map((registration) => [
      registration.passageId,
      registration
    ]));
    if (registrations.size !== input.registrations.length) {
      throw new Error("Tutorial passage runtime registrations must be unique.");
    }
    this.registrations = registrations;
    this.capabilities = new KpTutorialMotionCapabilityCache(input.loadCapability);
  }

  async apply(
    plan: KpTutorialMotionPassageLifecyclePlan<PassageId, CapabilityId>
  ): Promise<void> {
    if (this.disposed) {
      throw new Error("Disposed tutorial passage runtime cannot be reused.");
    }
    const revision = ++this.revision;
    const projections = new Map(plan.passages.map((projection) => [
      projection.id,
      projection
    ]));
    if (projections.size !== plan.passages.length) {
      throw new Error("Tutorial passage lifecycle plan ids must be unique.");
    }
    if (projections.size !== this.registrations.size ||
        [...projections.keys()].some((id) => !this.registrations.has(id))) {
      throw new Error(
        "Tutorial passage lifecycle plan must cover every runtime registration."
      );
    }
    const hydratedCapabilities = new Set<CapabilityId>();
    const hydrationTasks: Promise<void>[] = [];
    for (const [passageId, registration] of this.registrations) {
      const projection = projections.get(passageId);
      if (projection === undefined) {
        throw new Error(`Missing tutorial passage lifecycle projection: ${passageId}`);
      }
      if (projection.capabilityId !== registration.capabilityId) {
        throw new Error(`Tutorial passage capability changed for ${passageId}.`);
      }
      if (projection.runtime === "disposed") {
        registration.host.dispose();
        continue;
      }
      if (projection.runtime === "dehydrated") {
        registration.host.dehydrate();
        continue;
      }
      hydratedCapabilities.add(registration.capabilityId);
      if (projection.motion !== "active") {
        registration.host.setMotionActive(false);
      }
      hydrationTasks.push(this.hydratePassage({
        revision,
        registration,
        semanticProgress: projection.semanticProgress,
        motionActive: projection.motion === "active"
      }));
    }
    assertSameSet(
      hydratedCapabilities,
      new Set(plan.requiredCapabilityIds),
      "Tutorial lifecycle capability requirements do not match hydrated passages."
    );
    await Promise.all(hydrationTasks);
    if (revision !== this.revision || this.disposed) return;
    const active = plan.activeMotionPassageId === undefined
      ? undefined
      : this.registrations.get(plan.activeMotionPassageId);
    active?.host.setMotionActive(true);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.revision += 1;
    let failure: unknown;
    for (const { host } of this.registrations.values()) {
      try { host.dispose(); } catch (error) { failure ??= error; }
    }
    if (failure !== undefined) throw failure;
  }

  private async hydratePassage(input: {
    readonly revision: number;
    readonly registration: KpTutorialMotionPassageRuntimeRegistration<
      PassageId,
      CapabilityId
    >;
    readonly semanticProgress: number;
    readonly motionActive: boolean;
  }): Promise<void> {
    const capability = await this.capabilities.load(input.registration.capabilityId);
    if (input.revision !== this.revision || this.disposed) return;
    input.registration.host.hydrate((surface) => capability.mount({
      passageId: input.registration.passageId,
      surface
    }));
    input.registration.host.applySemanticProgress(input.semanticProgress);
    if (!input.motionActive) input.registration.host.setMotionActive(false);
  }
}

function assertSameSet<Value>(
  left: ReadonlySet<Value>,
  right: ReadonlySet<Value>,
  message: string
): void {
  if (left.size !== right.size || [...left].some((value) => !right.has(value))) {
    throw new Error(message);
  }
}
