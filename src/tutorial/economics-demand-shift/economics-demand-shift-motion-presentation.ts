import type { KpVisualThemeId } from
  "../../animation/semantic-visual-salience.ts";
import type { KpEconomicsDemandShiftFocusTarget } from
  "./economics-demand-shift-checkpoints.ts";
import {
  projectKpEconomicsSalience
} from "./economics-demand-shift-salience-adapter.ts";
import {
  projectKpEconomicsSalienceCssProperties
} from "./economics-demand-shift-salience-style.ts";
import type {
  KpEconomicsLessonMotionProjection
} from "./economics-demand-shift-motion-blocks.ts";

export interface KpEconomicsMotionPresentationOwner {
  readonly root: HTMLElement;
  readonly player: HTMLElement;
  readonly styleOwner: HTMLElement;
  readonly aperture: HTMLElement;
  readonly verificationSurface: HTMLElement;
  readonly motionBridge?: HTMLElement | undefined;
}

export interface KpEconomicsMotionPresentationCommit {
  readonly changedWrites: number;
  readonly attemptedWrites: number;
}

export function commitKpEconomicsMotionPresentation(input: {
  readonly owner: KpEconomicsMotionPresentationOwner;
  readonly projection: KpEconomicsLessonMotionProjection;
  readonly theme: KpVisualThemeId;
  readonly focusTarget: KpEconomicsDemandShiftFocusTarget;
  readonly playbackDirection: "forward" | "rewind";
}): KpEconomicsMotionPresentationCommit {
  let attemptedWrites = 0;
  let changedWrites = 0;
  const writeAttribute = (
    element: HTMLElement,
    name: string,
    value: string
  ): void => {
    attemptedWrites += 1;
    if (element.getAttribute(name) === value) return;
    element.setAttribute(name, value);
    changedWrites += 1;
  };
  const writeProperty = (name: string, value: string): void => {
    attemptedWrites += 1;
    if (input.owner.styleOwner.style.getPropertyValue(name) === value) return;
    input.owner.styleOwner.style.setProperty(name, value);
    changedWrites += 1;
  };
  const { projection } = input;
  const supplyProgress = projection.supplyMovementProgress;
  const localProgress = projection.activeBlockId === "supply-movement"
    ? supplyProgress
    : projection.demandShiftProgress;
  const composition = projection.composition;
  const graphSlot = composition.slots.find(({ id }) => id === "graph-slot")!;
  const verificationSlot = composition.slots.find(
    ({ id }) => id === "verification-slot"
  )!;
  const verificationSurface = composition.surfaces.find(
    ({ id }) => id === "equilibrium-verification"
  )!;
  const salience = projectKpEconomicsSalienceCssProperties({
    theme: input.theme,
    projection: projectKpEconomicsSalience({
      ...projection.scene,
      focusTarget: input.focusTarget
    })
  });

  Object.entries(salience).forEach(([name, value]) =>
    writeProperty(name, value)
  );
  writeProperty(
    "--kp-tutorial-supply-emphasis",
    format(clamp(supplyProgress / 0.18))
  );
  writeProperty(
    "--kp-tutorial-supply-trace",
    format(clamp((supplyProgress - 0.12) / 0.46))
  );
  writeProperty(
    "--kp-tutorial-supply-comparison",
    format(clamp((supplyProgress - 0.58) / 0.42))
  );
  writeProperty("--kp-stage-graph-inline", percent(graphSlot.rect.inline));
  writeProperty("--kp-stage-graph-block", percent(graphSlot.rect.block));
  writeProperty(
    "--kp-stage-graph-inline-size",
    percent(graphSlot.rect.inlineSize)
  );
  writeProperty(
    "--kp-stage-graph-block-size",
    percent(graphSlot.rect.blockSize)
  );
  writeProperty(
    "--kp-stage-verification-inline",
    percent(verificationSlot.rect.inline)
  );
  writeProperty(
    "--kp-stage-verification-block",
    percent(verificationSlot.rect.block)
  );
  writeProperty(
    "--kp-stage-verification-inline-size",
    percent(verificationSlot.rect.inlineSize)
  );
  writeProperty(
    "--kp-stage-verification-block-size",
    percent(verificationSlot.rect.blockSize)
  );
  writeProperty(
    "--kp-stage-aperture-inset",
    percent(1 - composition.aperture.openness)
  );
  writeProperty("--kp-stage-verification-opacity", format(composition.progress));
  writeProperty(
    "--kp-stage-verification-travel",
    percent(
      (verificationSurface.rect.inline - verificationSlot.rect.inline) /
        verificationSlot.rect.inlineSize
    )
  );
  writeProperty(
    "--kp-verification-supply-rule",
    format(projection.verification.groups["supply-rule"])
  );
  writeProperty(
    "--kp-verification-supply-rule-clip",
    percent(1 - projection.verification.groups["supply-rule"])
  );
  writeProperty(
    "--kp-verification-equilibria",
    format(projection.verification.groups.equilibria)
  );
  writeProperty(
    "--kp-verification-equilibria-clip",
    percent(1 - projection.verification.groups.equilibria)
  );
  writeProperty(
    "--kp-verification-changes",
    format(projection.verification.groups.changes)
  );
  writeProperty(
    "--kp-verification-changes-clip",
    percent(1 - projection.verification.groups.changes)
  );

  // The player clock may run a later lesson block while the graph remains at
  // its settled demand state. The economics renderer reads this cumulative
  // projection before it patches its retained SVG nodes.
  writeAttribute(
    input.owner.player,
    "data-kp-economics-graph-progress",
    format(projection.demandShiftProgress)
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-tutorial-demand-progress",
    projection.demandShiftProgress.toFixed(3)
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-tutorial-supply-movement-progress",
    supplyProgress.toFixed(3)
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-tutorial-scene-market",
    projection.scene.market
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-tutorial-scene-presentation",
    projection.scene.presentation
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-tutorial-supply-interpretation",
    supplyInterpretationPhase(supplyProgress)
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-stage-composition-phase",
    composition.phase
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-stage-composition-progress",
    composition.progress.toFixed(3)
  );
  writeAttribute(
    input.owner.root,
    "data-kp-economics-verification-reveal",
    projection.verification.phase
  );
  writeAttribute(
    input.owner.root,
    "data-kp-tutorial-review-motion-block",
    projection.activeBlockId
  );
  writeAttribute(
    input.owner.root,
    "data-kp-tutorial-review-progress",
    localProgress.toFixed(4)
  );
  writeAttribute(
    input.owner.root,
    "data-kp-tutorial-review-playback-direction",
    input.playbackDirection
  );
  writeAttribute(
    input.owner.aperture,
    "data-kp-economics-stage-aperture-edge",
    composition.aperture.edge
  );
  writeAttribute(
    input.owner.aperture,
    "data-kp-economics-stage-aperture-openness",
    composition.aperture.openness.toFixed(3)
  );
  writeAttribute(
    input.owner.verificationSurface,
    "data-kp-economics-stage-surface-lifecycle",
    verificationSurface.lifecycle
  );
  if (input.owner.motionBridge !== undefined) {
    attemptedWrites += 1;
    const progress = format(projection.demandShiftProgress);
    if (input.owner.motionBridge.style.getPropertyValue(
      "--kp-tutorial-motion-bridge-progress"
    ) !== progress) {
      input.owner.motionBridge.style.setProperty(
        "--kp-tutorial-motion-bridge-progress",
        progress
      );
      changedWrites += 1;
    }
  }

  return Object.freeze({ attemptedWrites, changedWrites });
}

function supplyInterpretationPhase(progress: number): string {
  return progress <= 0.001
    ? "ready"
    : progress < 0.58
      ? "tracing"
      : progress < 0.999
        ? "comparing"
        : "verified";
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function format(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function percent(value: number): string {
  return `${(value * 100).toFixed(3)}%`;
}
