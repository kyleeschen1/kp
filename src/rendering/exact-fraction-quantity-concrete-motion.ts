import type {
  KpExactQuantityConcretePhaseBinding
} from "../animation/exact-fraction-quantity-presentation-plan.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

export interface KpExactFractionQuantityConcreteAtomMotion {
  readonly atomicPartId: string;
  readonly trackId: string;
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
}

export interface KpExactFractionQuantityConcreteMotionFrame {
  readonly kind: "exact-fraction-quantity-concrete-motion-frame";
  readonly renderer: "persistent-svg-atomic-tracks";
  readonly view: KpExactQuantityConcretePhaseBinding["view"];
  readonly invocationId: string;
  readonly tracks: readonly KpExactFractionQuantityConcreteAtomMotion[];
}

export function sampleKpExactFractionQuantityConcreteMotion(
  binding: KpExactQuantityConcretePhaseBinding
): KpExactFractionQuantityConcreteMotionFrame {
  if (binding.execution.renderer !== "persistent-svg-atomic-tracks") {
    throw new Error(
      `Concrete view ${binding.view} lacks a persistent SVG execution path.`
    );
  }
  if (
    binding.execution.trackIds.length !== manifest.atomicPartIds.length
  ) {
    throw new Error(
      `Concrete view ${binding.view} must execute one track per atomic part.`
    );
  }
  const pulse = motionPulse(binding);
  const tracks = manifest.atomicPartIds.map((atomicPartId, ordinal) => {
    const expectedTrackId =
      `motion.${binding.invocationId}.${binding.view}.${atomicPartId}`;
    const trackId = binding.execution.trackIds[ordinal];
    if (trackId !== expectedTrackId) {
      throw new Error(
        `Concrete view ${binding.view} received an uncertified track for ` +
        `${atomicPartId}.`
      );
    }
    const transform = operationTransform({
      operationId: binding.operationId,
      ordinal,
      pulse,
      view: binding.view
    });
    return Object.freeze({
      atomicPartId,
      trackId,
      ...transform
    });
  });
  return Object.freeze({
    kind: "exact-fraction-quantity-concrete-motion-frame",
    renderer: binding.execution.renderer,
    view: binding.view,
    invocationId: binding.invocationId,
    tracks: Object.freeze(tracks)
  });
}

function motionPulse(
  binding: KpExactQuantityConcretePhaseBinding
): number {
  if (
    binding.programPhase?.programKind === "identity-fission" ||
    binding.programPhase?.programKind === "identity-fusion"
  ) {
    // All three concrete projections follow the symbolic identity-transfer
    // coordinate; only their measured displacement differs by view.
    return Math.sin(
      Math.PI * clamp(binding.programPhase.programProgress)
    );
  }
  if (binding.phase === "settle") return 0;
  const progress = binding.phase === "setup"
    ? binding.phaseProgress
    : binding.actionProgress;
  return Math.sin(Math.PI * clamp(progress)) *
    (binding.phase === "setup" ? 0.32 : 1);
}

function operationTransform(input: {
  readonly operationId: KpExactQuantityConcretePhaseBinding["operationId"];
  readonly ordinal: number;
  readonly pulse: number;
  readonly view: KpExactQuantityConcretePhaseBinding["view"];
}): {
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
} {
  const { ordinal, pulse } = input;
  const verticalFactor = input.view === "partitioned-circle" ? 0.5 : 0.2;
  switch (input.operationId) {
    case "kp.core.focus": {
      const active = ordinal <= 1;
      return Object.freeze({
        translateX: 0,
        translateY: active ? -4 * pulse : 0,
        scale: active ? 1 + 0.07 * pulse : 1
      });
    }
    case "kp.core.fan-out": {
      const direction = ordinal === 0 ? -1 : ordinal === 1 ? 1 : 0;
      return Object.freeze({
        translateX: direction * 9 * pulse,
        translateY: -Math.abs(direction) * verticalFactor * 3 * pulse,
        scale: direction === 0 ? 1 : 1 + 0.025 * pulse
      });
    }
    case "kp.core.group": {
      const direction = ordinal < 1 ? 1 : ordinal > 1 && ordinal <= 2 ? -1 : 0;
      return Object.freeze({
        translateX: direction * 6 * pulse,
        translateY: ordinal <= 2 ? -verticalFactor * 3 * pulse : 0,
        scale: ordinal <= 2 ? 1 + 0.035 * pulse : 1
      });
    }
    case "kp.core.merge": {
      const direction = ordinal < 1 ? 1 : ordinal > 1 && ordinal <= 2 ? -1 : 0;
      return Object.freeze({
        translateX: direction * 9 * pulse,
        translateY: ordinal <= 2 ? -verticalFactor * 5 * pulse : 0,
        scale: ordinal <= 2 ? 1 - 0.035 * pulse : 1
      });
    }
    case "kp.core.persist":
      return Object.freeze({
        translateX: 0,
        translateY: ordinal <= 2 ? -4 * pulse : 0,
        scale: ordinal <= 2 ? 1 + 0.055 * pulse : 1
      });
    default:
      throw new Error(
        `Unsupported exact-quantity concrete operation ${input.operationId}.`
      );
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
