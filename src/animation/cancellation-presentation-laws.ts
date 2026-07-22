export interface KpCancellationPresentationLawSource {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
}

export interface KpCancellationPresentationLawSnapshot {
  readonly sources: readonly KpCancellationPresentationLawSource[];
}

export type KpCancellationPresentationLawIssue =
  | "source-set-changed"
  | "unreadable-before-contact"
  | "premature-contact"
  | "incomplete-shared-contact"
  | "unreadable-at-contact"
  | "incomplete-retirement"
  | "rewind-mismatch";

export function checkKpCancellationPresentationLaws(input: {
  readonly beforeContact: KpCancellationPresentationLawSnapshot;
  readonly contact: KpCancellationPresentationLawSnapshot;
  readonly retired: KpCancellationPresentationLawSnapshot;
  readonly rewindContact: KpCancellationPresentationLawSnapshot;
  readonly positionEpsilon?: number | undefined;
  readonly opacityEpsilon?: number | undefined;
}): readonly KpCancellationPresentationLawIssue[] {
  const positionEpsilon = input.positionEpsilon ?? 0.001;
  const opacityEpsilon = input.opacityEpsilon ?? 0.001;
  const issues: KpCancellationPresentationLawIssue[] = [];
  const snapshots = [input.beforeContact, input.contact, input.retired, input.rewindContact];
  const ids = input.beforeContact.sources.map((source) => source.id);
  if (snapshots.some((snapshot) =>
    snapshot.sources.map((source) => source.id).join("\0") !== ids.join("\0")
  )) issues.push("source-set-changed");
  if (input.beforeContact.sources.some((source) => source.opacity < 1 - opacityEpsilon)) {
    issues.push("unreadable-before-contact");
  }
  if (maximumPairDistance(input.beforeContact.sources) <= positionEpsilon) {
    issues.push("premature-contact");
  }
  if (maximumPairDistance(input.contact.sources) > positionEpsilon) {
    issues.push("incomplete-shared-contact");
  }
  if (input.contact.sources.some((source) => source.opacity <= opacityEpsilon)) {
    issues.push("unreadable-at-contact");
  }
  if (input.retired.sources.some((source) => source.opacity > opacityEpsilon)) {
    issues.push("incomplete-retirement");
  }
  if (!sameSnapshot(input.contact, input.rewindContact, positionEpsilon, opacityEpsilon)) {
    issues.push("rewind-mismatch");
  }
  return Object.freeze(issues);
}

function maximumPairDistance(
  sources: readonly KpCancellationPresentationLawSource[]
): number {
  let maximum = 0;
  for (let left = 0; left < sources.length; left += 1) {
    for (let right = left + 1; right < sources.length; right += 1) {
      maximum = Math.max(maximum, Math.hypot(
        sources[left]!.x - sources[right]!.x,
        sources[left]!.y - sources[right]!.y
      ));
    }
  }
  return maximum;
}

function sameSnapshot(
  left: KpCancellationPresentationLawSnapshot,
  right: KpCancellationPresentationLawSnapshot,
  positionEpsilon: number,
  opacityEpsilon: number
): boolean {
  return left.sources.every((source, index) => {
    const candidate = right.sources[index];
    return candidate !== undefined && candidate.id === source.id &&
      Math.abs(candidate.x - source.x) <= positionEpsilon &&
      Math.abs(candidate.y - source.y) <= positionEpsilon &&
      Math.abs(candidate.opacity - source.opacity) <= opacityEpsilon;
  });
}
