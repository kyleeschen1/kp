import {
  createKpReaderSessionSnapshot,
  type KpReaderSessionSnapshot
} from "./session.ts";
import { parseKpReaderMotionPreference } from "./motion-policy.ts";

const params = {
  lesson: "kpLesson",
  version: "kpVersion",
  checkpoint: "kpCheckpoint",
  progress: "kpProgress",
  projection: "kpProjection",
  focus: "kpFocus",
  motion: "kpMotion"
} as const;

export function encodeKpReaderSessionUrl(
  baseUrl: string | URL,
  session: KpReaderSessionSnapshot
): string {
  const url = new URL(baseUrl);
  for (const parameter of Object.values(params)) url.searchParams.delete(parameter);
  url.searchParams.set(params.lesson, session.document.id);
  url.searchParams.set(params.version, session.document.version);
  if (session.location.checkpointId !== undefined) {
    url.searchParams.set(params.checkpoint, session.location.checkpointId);
  }
  if (session.location.progressPermille !== undefined) {
    url.searchParams.set(params.progress, String(session.location.progressPermille));
  }
  if (session.location.projectionId !== undefined) {
    url.searchParams.set(params.projection, session.location.projectionId);
  }
  url.searchParams.set(params.motion, session.motionPreference);
  [...session.location.focusRefs].sort().forEach((focusRef) =>
    url.searchParams.append(params.focus, focusRef)
  );
  url.searchParams.sort();
  return url.toString();
}

export function decodeKpReaderSessionUrl(
  input: string | URL,
  expected?: {
    readonly documentId: string;
    readonly documentVersion: string;
  }
): KpReaderSessionSnapshot | undefined {
  const url = new URL(input);
  const documentId = url.searchParams.get(params.lesson);
  if (documentId === null) return undefined;
  const documentVersion = requiredParam(url, params.version);
  if (expected !== undefined
    && (documentId !== expected.documentId || documentVersion !== expected.documentVersion)) {
    throw new Error(
      `reader URL targets ${documentId}@${documentVersion}, expected ${expected.documentId}@${expected.documentVersion}`
    );
  }
  const progressValue = url.searchParams.get(params.progress);
  const progressPermille = progressValue === null ? undefined : Number(progressValue);
  return createKpReaderSessionSnapshot({
    documentId,
    documentVersion,
    ...(url.searchParams.get(params.checkpoint) === null
      ? {}
      : { checkpointId: requiredParam(url, params.checkpoint) }),
    ...(progressPermille === undefined ? {} : { progressPermille }),
    ...(url.searchParams.get(params.projection) === null
      ? {}
      : { projectionId: requiredParam(url, params.projection) }),
    focusRefs: url.searchParams.getAll(params.focus),
    motionPreference: parseKpReaderMotionPreference(
      url.searchParams.get(params.motion)
    ) ?? "system"
  });
}

function requiredParam(url: URL, name: string): string {
  const value = url.searchParams.get(name)?.trim();
  if (value === undefined || value === "") throw new Error(`reader URL parameter ${name} is required`);
  return value;
}
