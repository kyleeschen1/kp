import {
  composeKpReaderUrlStateCodecs,
  defineKpReaderUrlStateCodec
} from "./url-state-codec.ts";
import type { KpReaderRuntimeRouteDescriptor } from "./reader-route-descriptor.ts";

export type KpDistributionAreaDirection = "forward" | "inverse";
export type KpDistributionAreaCheckpoint = "factored" | "distributed" | "expanded";

export interface KpDistributionAreaUrlState {
  readonly checkpoint: KpDistributionAreaCheckpoint;
  readonly progressPermille?: number | undefined;
  readonly direction: KpDistributionAreaDirection;
}

const moment = defineKpReaderUrlStateCodec({
  parameters: ["kpLesson", "kpVersion", "kpCheckpoint", "kpProgress"] as const,
  read(parameters: URLSearchParams) {
    const progressValue = parameters.get("kpProgress");
    const progressPermille = progressValue === null ? undefined : Number(progressValue);
    if (progressPermille !== undefined && (!Number.isInteger(progressPermille)
      || progressPermille < 0 || progressPermille > 1_000)) {
      throw new Error("distribution reader progress must be an integer from 0 to 1000");
    }
    const checkpointValue = parameters.get("kpCheckpoint");
    const checkpoint = checkpointValue === "expanded" || checkpointValue === "distributed"
      ? checkpointValue
      : "factored";
    return {
      documentId: parameters.get("kpLesson") ?? "",
      documentVersion: parameters.get("kpVersion") ?? "",
      checkpoint,
      progressPermille
    } as const;
  },
  write(parameters: URLSearchParams, state: {
    readonly documentId: string;
    readonly documentVersion: string;
    readonly checkpoint: KpDistributionAreaCheckpoint;
    readonly progressPermille?: number | undefined;
  }) {
    parameters.set("kpLesson", state.documentId);
    parameters.set("kpVersion", state.documentVersion);
    parameters.set("kpCheckpoint", state.checkpoint);
    if (state.progressPermille !== undefined) {
      parameters.set("kpProgress", String(state.progressPermille));
    }
  }
});

const direction = defineKpReaderUrlStateCodec({
  parameters: ["kpDirection"] as const,
  read: (parameters: URLSearchParams): KpDistributionAreaDirection =>
    parameters.get("kpDirection") === "inverse" ? "inverse" : "forward",
  write(parameters: URLSearchParams, state: KpDistributionAreaDirection) {
    parameters.set("kpDirection", state);
  }
});

const codec = composeKpReaderUrlStateCodecs({ moment, direction });

export function decodeKpDistributionAreaUrl(
  input: string | URL,
  expected?: KpReaderRuntimeRouteDescriptor
): KpDistributionAreaUrlState {
  const state = codec.read(input);
  if (expected !== undefined && state.moment.documentId !== ""
    && (state.moment.documentId !== expected.documentId
      || state.moment.documentVersion !== expected.documentVersion)) {
    throw new Error(
      `distribution URL targets ${state.moment.documentId}@${state.moment.documentVersion}, expected ${expected.documentId}@${expected.documentVersion}`
    );
  }
  return {
    checkpoint: state.moment.checkpoint,
    progressPermille: state.moment.progressPermille,
    direction: state.direction
  };
}

export function encodeKpDistributionAreaUrl(
  baseUrl: string | URL,
  route: KpReaderRuntimeRouteDescriptor,
  state: KpDistributionAreaUrlState
): string {
  return codec.write(baseUrl, {
    moment: {
      documentId: route.documentId,
      documentVersion: route.documentVersion,
      checkpoint: state.checkpoint,
      progressPermille: state.progressPermille
    },
    direction: state.direction
  });
}
