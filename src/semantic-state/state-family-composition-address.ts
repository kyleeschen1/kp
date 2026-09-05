import {
  decodeKpSemanticProgress,
  encodeKpSemanticProgress,
  type KpSemanticProgress,
  type KpSemanticProgressEncoding
} from "./semantic-progress.ts";
import type {
  KpSemanticStateCompositionBoundaryHandle,
  KpSemanticStateCompositionGroupHandle,
  KpSemanticStateCompositionHandleSet,
  KpSemanticStateCompositionMemberHandle
} from "./state-family-composition-handles.ts";

const logicalAddressSchema =
  "kp.semantic-state-composition-logical-address.v1" as const;

declare const kpCompositionLogicalAddressEncoding: unique symbol;

export interface KpSettledSemanticStateCompositionAddress {
  readonly schemaVersion: typeof logicalAddressSchema;
  readonly kind: "settled";
  readonly compositionId:
    KpSemanticStateCompositionHandleSet["composition"]["id"];
  readonly boundary: KpSemanticStateCompositionBoundaryHandle;
}

export type KpSemanticStateCompositionTransitionTargetHandle =
  | KpSemanticStateCompositionMemberHandle
  | KpSemanticStateCompositionGroupHandle<"independent">;

export interface KpInTransitionSemanticStateCompositionAddress {
  readonly schemaVersion: typeof logicalAddressSchema;
  readonly kind: "in-transition";
  readonly compositionId:
    KpSemanticStateCompositionHandleSet["composition"]["id"];
  readonly target: KpSemanticStateCompositionTransitionTargetHandle;
  readonly progress: KpSemanticProgressEncoding;
}

export type KpSemanticStateCompositionLogicalAddress =
  | KpSettledSemanticStateCompositionAddress
  | KpInTransitionSemanticStateCompositionAddress;

export type KpSemanticStateCompositionLogicalAddressEncoding = string & {
  readonly [kpCompositionLogicalAddressEncoding]:
    "semantic-state-composition-logical-address-encoding";
};

export type KpSemanticStateCompositionLogicalAddressErrorCode =
  | "foreign-composition"
  | "invalid-transition-progress"
  | "invalid-transition-target"
  | "malformed-address"
  | "noncanonical-address"
  | "unknown-boundary"
  | "unknown-transition-target";

export class KpSemanticStateCompositionLogicalAddressError extends Error {
  readonly code: KpSemanticStateCompositionLogicalAddressErrorCode;

  constructor(
    code: KpSemanticStateCompositionLogicalAddressErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateCompositionLogicalAddressError";
    this.code = code;
  }
}

export function createKpSettledSemanticStateCompositionAddress(input: {
  readonly handles: KpSemanticStateCompositionHandleSet;
  readonly boundary: KpSemanticStateCompositionBoundaryHandle;
}): KpSettledSemanticStateCompositionAddress {
  const boundary = input.handles.boundaries.find(
    candidate => candidate.id === input.boundary.id
  );
  if (boundary === undefined) {
    fail(
      "unknown-boundary",
      `Boundary ${JSON.stringify(input.boundary.id)} does not belong to composition ${JSON.stringify(input.handles.composition.id)}.`
    );
  }
  return Object.freeze({
    schemaVersion: logicalAddressSchema,
    kind: "settled",
    compositionId: input.handles.composition.id,
    boundary
  });
}

export function createKpInTransitionSemanticStateCompositionAddress(input: {
  readonly handles: KpSemanticStateCompositionHandleSet;
  readonly target: KpSemanticStateCompositionTransitionTargetHandle;
  readonly progress: KpSemanticProgress;
}): KpInTransitionSemanticStateCompositionAddress {
  const target = resolveTransitionTarget(input.handles, input.target);
  let progress: KpSemanticProgressEncoding;
  try {
    progress = encodeKpSemanticProgress(input.progress);
    decodeKpSemanticProgress(progress);
  } catch {
    fail(
      "invalid-transition-progress",
      "A composition transition address requires exact normalized progress between zero and one."
    );
  }
  return Object.freeze({
    schemaVersion: logicalAddressSchema,
    kind: "in-transition",
    compositionId: input.handles.composition.id,
    target,
    progress
  });
}

export function areKpSemanticStateCompositionLogicalAddressesEqual(
  left: KpSemanticStateCompositionLogicalAddress,
  right: KpSemanticStateCompositionLogicalAddress
): boolean {
  if (left.kind !== right.kind || left.compositionId !== right.compositionId) {
    return false;
  }
  if (left.kind === "settled" && right.kind === "settled") {
    return left.boundary.id === right.boundary.id;
  }
  if (left.kind === "in-transition" && right.kind === "in-transition") {
    return left.target.kind === right.target.kind &&
      left.target.id === right.target.id && left.progress === right.progress;
  }
  return false;
}

export function encodeKpSemanticStateCompositionLogicalAddress(
  address: KpSemanticStateCompositionLogicalAddress
): KpSemanticStateCompositionLogicalAddressEncoding {
  const value = address.kind === "settled"
    ? [
      logicalAddressSchema,
      "settled",
      address.compositionId,
      address.boundary.id
    ]
    : [
      logicalAddressSchema,
      "in-transition",
      address.compositionId,
      address.target.kind === "semantic-state-composition-member-handle"
        ? "member"
        : "independent",
      address.target.id,
      address.progress
    ];
  return JSON.stringify(value) as
    KpSemanticStateCompositionLogicalAddressEncoding;
}

export function decodeKpSemanticStateCompositionLogicalAddress(input: {
  readonly handles: KpSemanticStateCompositionHandleSet;
  readonly encoding: string;
}): KpSemanticStateCompositionLogicalAddress {
  let value: unknown;
  try {
    value = JSON.parse(input.encoding);
  } catch {
    fail("malformed-address", "Logical address encoding must be valid JSON.");
  }
  if (!Array.isArray(value) || value[0] !== logicalAddressSchema) {
    fail(
      "malformed-address",
      "Logical address encoding has an unsupported schema or shape."
    );
  }
  if (value[2] !== input.handles.composition.id) {
    fail(
      "foreign-composition",
      `Logical address does not belong to composition ${JSON.stringify(input.handles.composition.id)}.`
    );
  }

  let address: KpSemanticStateCompositionLogicalAddress;
  if (value.length === 4 && value[1] === "settled" &&
    typeof value[3] === "string") {
    const boundary = input.handles.boundaries.find(
      candidate => candidate.id === value[3]
    );
    if (boundary === undefined) {
      fail(
        "unknown-boundary",
        `Logical address references unknown boundary ${JSON.stringify(value[3])}.`
      );
    }
    address = createKpSettledSemanticStateCompositionAddress({
      handles: input.handles,
      boundary
    });
  } else if (value.length === 6 && value[1] === "in-transition" &&
    (value[3] === "member" || value[3] === "independent") &&
    typeof value[4] === "string" && typeof value[5] === "string") {
    const target = value[3] === "member"
      ? input.handles.members.find(candidate => candidate.id === value[4])
      : input.handles.groups.find(candidate =>
        candidate.nodeKind === "independent" && candidate.id === value[4]
      );
    if (target === undefined) {
      fail(
        "unknown-transition-target",
        `Logical address references unknown ${value[3]} transition target ${JSON.stringify(value[4])}.`
      );
    }
    let progress: KpSemanticProgress;
    try {
      progress = decodeKpSemanticProgress(
        value[5] as KpSemanticProgressEncoding
      );
    } catch {
      fail(
        "invalid-transition-progress",
        `Logical address contains invalid transition progress ${JSON.stringify(value[5])}.`
      );
    }
    address = createKpInTransitionSemanticStateCompositionAddress({
      handles: input.handles,
      target: target as KpSemanticStateCompositionTransitionTargetHandle,
      progress
    });
  } else {
    fail(
      "malformed-address",
      "Logical address encoding has fields from another address form."
    );
  }

  if (encodeKpSemanticStateCompositionLogicalAddress(address) !==
    input.encoding) {
    fail(
      "noncanonical-address",
      "Logical address encoding must use its canonical field order and progress spelling."
    );
  }
  return address;
}

function resolveTransitionTarget(
  handles: KpSemanticStateCompositionHandleSet,
  target: KpSemanticStateCompositionTransitionTargetHandle
): KpSemanticStateCompositionTransitionTargetHandle {
  if (target.kind === "semantic-state-composition-member-handle") {
    const member = handles.members.find(candidate => candidate.id === target.id);
    if (member === undefined) {
      fail(
        "unknown-transition-target",
        `Member ${JSON.stringify(target.id)} does not belong to composition ${JSON.stringify(handles.composition.id)}.`
      );
    }
    return member;
  }
  if (target.nodeKind !== "independent") {
    fail(
      "invalid-transition-target",
      `Composition group ${JSON.stringify(target.id)} is not an independent cohort.`
    );
  }
  const cohort = handles.groups.find(candidate =>
    candidate.nodeKind === "independent" && candidate.id === target.id
  );
  if (cohort === undefined) {
    fail(
      "unknown-transition-target",
      `Independent cohort ${JSON.stringify(target.id)} does not belong to composition ${JSON.stringify(handles.composition.id)}.`
    );
  }
  return cohort as KpSemanticStateCompositionGroupHandle<"independent">;
}

function fail(
  code: KpSemanticStateCompositionLogicalAddressErrorCode,
  message: string
): never {
  throw new KpSemanticStateCompositionLogicalAddressError(code, message);
}
