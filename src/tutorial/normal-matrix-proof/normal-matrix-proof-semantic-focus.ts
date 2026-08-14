import {
  kpNormalMatrixProofSemanticRegistry,
  type KpNormalMatrixProofSemanticEntity
} from "../../semantic/normal-matrix-proof-semantics.ts";

export type KpNormalMatrixProofSemanticAddress =
  KpNormalMatrixProofSemanticEntity["address"];

const entitiesByAddress: ReadonlyMap<string, KpNormalMatrixProofSemanticEntity> = new Map(
  kpNormalMatrixProofSemanticRegistry.map((entity) => [entity.address, entity])
);

export function decodeKpNormalMatrixProofSemanticLocation(
  hash: string
): KpNormalMatrixProofSemanticAddress | undefined {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment.startsWith("kp-ref:normal-proof/")) return undefined;
  let address: string;
  try {
    address = decodeURIComponent(fragment.slice("kp-ref:".length));
  } catch {
    return undefined;
  }
  return entitiesByAddress.has(address)
    ? address as KpNormalMatrixProofSemanticAddress
    : undefined;
}

export function encodeKpNormalMatrixProofSemanticLocation(
  baseUrl: string | URL,
  address?: KpNormalMatrixProofSemanticAddress
): string {
  if (address !== undefined && !entitiesByAddress.has(address)) {
    throw new Error(`Unknown normal-proof semantic address ${address}.`);
  }
  const url = new URL(String(baseUrl));
  url.hash = address === undefined ? "" : `kp-ref:${address}`;
  return url.toString();
}

export function paintKpNormalMatrixProofSemanticFocus(
  stage: HTMLElement,
  address?: KpNormalMatrixProofSemanticAddress
): number {
  stage.querySelectorAll<HTMLElement>("[data-kp-normal-proof-reentry]")
    .forEach((node) => delete node.dataset["kpNormalProofReentry"]);
  if (address === undefined) {
    delete stage.dataset["kpNormalProofFocusAddress"];
    stage.removeAttribute("aria-description");
    return 0;
  }
  const entity = entitiesByAddress.get(address);
  if (entity === undefined) {
    throw new Error(`Unknown normal-proof semantic address ${address}.`);
  }
  const targets = [...stage.querySelectorAll<HTMLElement>(
    "[data-kp-normal-proof-path]"
  )].filter((node) =>
    (node.dataset["kpNormalProofPath"] ?? "").split(/\s+/u).includes(address)
  );
  targets.forEach((node) => {
    node.dataset["kpNormalProofReentry"] = "target";
  });
  stage.dataset["kpNormalProofFocusAddress"] = address;
  stage.setAttribute("aria-description", `${entity.label}: ${entity.meaning}`);
  return targets.length;
}
