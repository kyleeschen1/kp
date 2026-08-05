export const kpTutorialMotionBridgeDistancePresets = Object.freeze([
  "short",
  "standard",
  "extended"
] as const);

export type KpTutorialMotionBridgeDistancePreset =
  typeof kpTutorialMotionBridgeDistancePresets[number];

export interface KpTutorialSemanticCheckpointEndpoint {
  readonly motionBlockId: string;
  readonly checkpointId: string;
}

export interface KpTutorialOrdinaryBeatAuthoring {
  readonly schemaVersion: "kp.tutorial.ordinary-beat.v1";
  readonly kind: "ordinary-beat";
  readonly id: string;
  readonly passageId: string;
  readonly paragraphIndex: number;
  readonly settleAt: KpTutorialSemanticCheckpointEndpoint;
}

export interface KpTutorialMotionBridgeAuthoring {
  readonly schemaVersion: "kp.tutorial.motion-bridge.v1";
  readonly kind: "motion-bridge";
  readonly id: string;
  readonly beforePassageId: string;
  readonly afterPassageId: string;
  readonly distance: KpTutorialMotionBridgeDistancePreset;
  readonly motionBlockId: string;
  readonly fromCheckpointId: string;
  readonly toCheckpointId: string;
}

export type KpTutorialProseMotionAuthoring =
  | KpTutorialOrdinaryBeatAuthoring
  | KpTutorialMotionBridgeAuthoring;

export function defineKpTutorialOrdinaryBeat(input: {
  readonly id: string;
  readonly passageId: string;
  readonly paragraphIndex?: number | undefined;
  readonly settleAt: KpTutorialSemanticCheckpointEndpoint;
}): KpTutorialOrdinaryBeatAuthoring {
  return Object.freeze({
    schemaVersion: "kp.tutorial.ordinary-beat.v1",
    kind: "ordinary-beat",
    id: slug(input.id, "Ordinary beat id"),
    passageId: slug(input.passageId, "Ordinary beat passage id"),
    paragraphIndex: nonNegativeInteger(
      input.paragraphIndex ?? 0,
      "Ordinary beat paragraph index"
    ),
    settleAt: semanticEndpoint(input.settleAt)
  });
}

export function defineKpTutorialMotionBridge(input: {
  readonly id: string;
  readonly beforePassageId: string;
  readonly afterPassageId: string;
  readonly distance: KpTutorialMotionBridgeDistancePreset;
  readonly motionBlockId: string;
  readonly fromCheckpointId: string;
  readonly toCheckpointId: string;
}): KpTutorialMotionBridgeAuthoring {
  const beforePassageId = slug(
    input.beforePassageId,
    "Motion bridge before passage id"
  );
  const afterPassageId = slug(
    input.afterPassageId,
    "Motion bridge after passage id"
  );
  if (beforePassageId === afterPassageId) {
    throw new Error("Motion bridge before and after passages must differ.");
  }
  if (!kpTutorialMotionBridgeDistancePresets.includes(input.distance)) {
    throw new Error(`Unknown motion bridge distance preset: ${input.distance}`);
  }
  const fromCheckpointId = slug(
    input.fromCheckpointId,
    "Motion bridge start checkpoint id"
  );
  const toCheckpointId = slug(
    input.toCheckpointId,
    "Motion bridge end checkpoint id"
  );
  if (fromCheckpointId === toCheckpointId) {
    throw new Error("Motion bridge semantic endpoints must differ.");
  }
  return Object.freeze({
    schemaVersion: "kp.tutorial.motion-bridge.v1",
    kind: "motion-bridge",
    id: slug(input.id, "Motion bridge id"),
    beforePassageId,
    afterPassageId,
    distance: input.distance,
    motionBlockId: slug(input.motionBlockId, "Motion bridge block id"),
    fromCheckpointId,
    toCheckpointId
  });
}

function semanticEndpoint(
  input: KpTutorialSemanticCheckpointEndpoint
): KpTutorialSemanticCheckpointEndpoint {
  // Semantic ids survive timing edits and direct navigation; raw progress is
  // deliberately absent from the authoring contract.
  return Object.freeze({
    motionBlockId: slug(input.motionBlockId, "Semantic endpoint block id"),
    checkpointId: slug(input.checkpointId, "Semantic endpoint checkpoint id")
  });
}

function slug(value: string, label: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${label} must be a lowercase semantic slug.`);
  }
  return value;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}
