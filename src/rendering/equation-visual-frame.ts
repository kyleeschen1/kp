export interface KpEquationVisualRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpEquationVisualOwnerPose {
  readonly ownerId: string;
  readonly currentBounds: KpEquationVisualRect;
  readonly materialOpacity: number;
  readonly sourceNativeOpacity: number;
  readonly targetNativeOpacity: number;
  readonly focusStrength: number;
}

export interface KpEquationVisualFrame<
  TOwner extends KpEquationVisualOwnerPose = KpEquationVisualOwnerPose
> {
  readonly id: string;
  readonly progress: number;
  readonly easedProgress: number;
  readonly direction: "forward" | "rewind";
  readonly owners: readonly TOwner[];
}

export function assertKpEquationVisualFrame(
  frame: KpEquationVisualFrame
): void {
  if (frame.id === "" || !unit(frame.progress) || !unit(frame.easedProgress)) {
    throw new Error("Equation visual frame has an invalid identity or progress.");
  }
  const ownerIds = new Set<string>();
  for (const owner of frame.owners) {
    if (ownerIds.has(owner.ownerId)) {
      throw new Error(`Equation visual frame repeats owner ${owner.ownerId}.`);
    }
    ownerIds.add(owner.ownerId);
    const { currentBounds } = owner;
    if (
      ![currentBounds.left, currentBounds.top, currentBounds.width, currentBounds.height]
        .every(Number.isFinite) ||
      currentBounds.width <= 0 || currentBounds.height <= 0 ||
      !unit(owner.materialOpacity) ||
      !unit(owner.sourceNativeOpacity) ||
      !unit(owner.targetNativeOpacity) ||
      !unit(owner.focusStrength)
    ) {
      throw new Error(`Equation visual owner ${owner.ownerId} has an invalid pose.`);
    }
  }
}

function unit(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}
