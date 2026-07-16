export const kpEpistemicStatuses = [
  "valid",
  "hypothesis",
  "unverified",
  "misconception",
  "invalid",
  "counterexample"
] as const;

export type KpEpistemicStatus = typeof kpEpistemicStatuses[number];

export interface KpEpistemicSubjectRef {
  readonly kind: "state" | "transition";
  readonly id: string;
}

export type KpEpistemicDisclosureTrigger =
  | { readonly kind: "immediate" }
  | { readonly kind: "progress"; readonly at: number }
  | { readonly kind: "checkpoint"; readonly checkpointId: string }
  | { readonly kind: "on-request" };

export interface KpEpistemicDisclosurePolicy {
  readonly trigger: KpEpistemicDisclosureTrigger;
  readonly announce: boolean;
}

export interface KpEpistemicAnnotation {
  readonly kind: "epistemic-annotation";
  readonly subject: KpEpistemicSubjectRef;
  readonly status: KpEpistemicStatus;
  readonly rationale: string;
  readonly evidenceIds: readonly string[];
  readonly disclosure: KpEpistemicDisclosurePolicy;
}

export interface KpEpistemicDisclosureSample {
  readonly subject: KpEpistemicSubjectRef;
  readonly disclosed: boolean;
  readonly status?: KpEpistemicStatus | undefined;
  readonly rationale?: string | undefined;
  readonly announce: boolean;
}

export function createKpEpistemicAnnotation(input: {
  readonly subject: KpEpistemicSubjectRef;
  readonly status: KpEpistemicStatus;
  readonly rationale: string;
  readonly evidenceIds?: readonly string[] | undefined;
  readonly disclosure: KpEpistemicDisclosurePolicy;
}): KpEpistemicAnnotation {
  assertNonEmpty(input.subject.id, "Epistemic subject id");
  assertNonEmpty(input.rationale, "Epistemic rationale");
  assertDisclosureTrigger(input.disclosure.trigger);
  return {
    kind: "epistemic-annotation",
    subject: { ...input.subject },
    status: input.status,
    rationale: input.rationale,
    evidenceIds: [...(input.evidenceIds ?? [])],
    disclosure: {
      trigger: { ...input.disclosure.trigger },
      announce: input.disclosure.announce
    }
  };
}

export function sampleKpEpistemicDisclosure(input: {
  readonly annotation: KpEpistemicAnnotation;
  readonly progress: number;
  readonly elapsedCheckpointIds?: readonly string[] | undefined;
  readonly requested?: boolean | undefined;
}): KpEpistemicDisclosureSample {
  const disclosed = disclosureTriggered(
    input.annotation.disclosure.trigger,
    clampProgress(input.progress),
    input.elapsedCheckpointIds ?? [],
    input.requested ?? false
  );
  return {
    subject: { ...input.annotation.subject },
    disclosed,
    ...(disclosed
      ? {
          status: input.annotation.status,
          rationale: input.annotation.rationale
        }
      : {}),
    announce: disclosed && input.annotation.disclosure.announce
  };
}

function disclosureTriggered(
  trigger: KpEpistemicDisclosureTrigger,
  progress: number,
  elapsedCheckpointIds: readonly string[],
  requested: boolean
): boolean {
  switch (trigger.kind) {
    case "immediate":
      return true;
    case "progress":
      return progress >= trigger.at;
    case "checkpoint":
      return elapsedCheckpointIds.includes(trigger.checkpointId);
    case "on-request":
      return requested;
  }
}

function assertDisclosureTrigger(trigger: KpEpistemicDisclosureTrigger): void {
  if (trigger.kind === "progress" && (!Number.isFinite(trigger.at) || trigger.at < 0 || trigger.at > 1)) {
    throw new Error("Epistemic disclosure progress must be between 0 and 1.");
  }
  if (trigger.kind === "checkpoint") {
    assertNonEmpty(trigger.checkpointId, "Epistemic disclosure checkpoint id");
  }
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Epistemic disclosure progress must be finite.");
  return Math.max(0, Math.min(1, value));
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
