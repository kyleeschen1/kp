import {
  createKpFractionCompositionArticleRuntimeCheckpoints
} from "./fraction-composition-runtime-ranges.ts";
import {
  resolveKpFractionCompositionArticleSemanticReference
} from "./fraction-composition-semantic-navigation.ts";

export type KpFractionCompositionArticleLocation =
  | Readonly<{ kind: "checkpoint"; path: string }>
  | Readonly<{ kind: "semantic-reference"; address: string }>;

const checkpointPaths = new Set(
  createKpFractionCompositionArticleRuntimeCheckpoints().map(({ path }) => path)
);

export function decodeKpFractionCompositionArticleLocation(
  hash: string
): KpFractionCompositionArticleLocation | undefined {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment.startsWith("kp-ref:solve/")) return undefined;
  let address: string;
  try {
    address = decodeURIComponent(fragment.slice("kp-ref:".length));
  } catch {
    return undefined;
  }
  const path = address.slice("solve/".length);
  if (checkpointPaths.has(path)) {
    return Object.freeze({ kind: "checkpoint" as const, path });
  }
  return resolveKpFractionCompositionArticleSemanticReference(address) === undefined
    ? undefined
    : Object.freeze({ kind: "semantic-reference" as const, address });
}

export function encodeKpFractionCompositionArticleCheckpointLocation(
  baseUrl: string | URL,
  path: string
): string {
  if (!checkpointPaths.has(path)) {
    throw new Error(`Unknown algebra article checkpoint ${path}.`);
  }
  const url = new URL(String(baseUrl));
  url.hash = `kp-ref:solve/${path}`;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function encodeKpFractionCompositionArticleSemanticLocation(
  baseUrl: string | URL,
  address?: string
): string {
  if (
    address !== undefined &&
    resolveKpFractionCompositionArticleSemanticReference(address) === undefined
  ) {
    throw new Error(`Unknown algebra article semantic address ${address}.`);
  }
  const url = new URL(String(baseUrl));
  url.hash = address === undefined ? "" : `kp-ref:${address}`;
  return `${url.pathname}${url.search}${url.hash}`;
}
