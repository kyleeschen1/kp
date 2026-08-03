import type {
  KpTutorialTocDestination,
  KpTutorialTocDestinationKind
} from "./kp-tutorial-toc.ts";

const destinationKinds: readonly KpTutorialTocDestinationKind[] = [
  "section",
  "block",
  "checkpoint"
];
const semanticIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function serializeKpTutorialDestinationHash(
  destination: KpTutorialTocDestination
): string {
  assertDestination(destination);
  return `#kp-${destination.kind}-${destination.id}`;
}

export function serializeKpTutorialDestinationHref(
  baseHref: string,
  destination: KpTutorialTocDestination
): string {
  const hashIndex = baseHref.indexOf("#");
  const base = hashIndex < 0 ? baseHref : baseHref.slice(0, hashIndex);
  return `${base}${serializeKpTutorialDestinationHash(destination)}`;
}

export function parseKpTutorialDestinationHash(
  hash: string
): KpTutorialTocDestination | undefined {
  for (const kind of destinationKinds) {
    const prefix = `#kp-${kind}-`;
    if (!hash.startsWith(prefix)) continue;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(prefix.length));
    } catch {
      return undefined;
    }
    if (!semanticIdPattern.test(id)) return undefined;
    return Object.freeze({ kind, id });
  }
  return undefined;
}

function assertDestination(destination: KpTutorialTocDestination): void {
  if (
    !destinationKinds.includes(destination.kind) ||
    !semanticIdPattern.test(destination.id)
  ) {
    throw new Error(
      "Tutorial URL destinations require a section, block, or checkpoint slug."
    );
  }
}
