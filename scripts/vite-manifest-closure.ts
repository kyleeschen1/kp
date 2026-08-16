import { extname } from "node:path";

import type {
  KpBundleExperienceScenario,
  KpBundleResourceKind
} from "./bundle-experience-scenario.ts";

export interface KpViteManifestChunk {
  readonly file: string;
  readonly name?: string | undefined;
  readonly src?: string | undefined;
  readonly imports?: readonly string[] | undefined;
  readonly dynamicImports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
  readonly assets?: readonly string[] | undefined;
}

export type KpViteManifest = Readonly<Record<string, KpViteManifestChunk>>;

export interface KpViteManifestResource {
  readonly file: string;
  readonly kind: Exclude<KpBundleResourceKind, "total">;
  readonly ownerKeys: readonly string[];
  readonly ownerSources: readonly string[];
}

export interface KpViteManifestClosure {
  readonly rootKeys: readonly string[];
  readonly chunkKeys: readonly string[];
  readonly resources: readonly KpViteManifestResource[];
  readonly discoverableDynamicRoots: readonly string[];
}

export interface KpViteManifestClosureDelta {
  readonly chunkKeys: readonly string[];
  readonly resources: readonly KpViteManifestResource[];
}

export interface KpViteManifestActivationClosure {
  readonly id: string;
  readonly roots: readonly string[];
  readonly activated: KpViteManifestClosure;
  readonly incremental: KpViteManifestClosureDelta;
}

export interface KpViteManifestExperienceClosure {
  readonly scenarioId: KpBundleExperienceScenario["id"];
  readonly entry: KpViteManifestClosure;
  readonly activations: readonly KpViteManifestActivationClosure[];
  readonly experience: KpViteManifestClosure;
}

export function collectKpViteManifestStaticClosure(
  manifest: KpViteManifest,
  rootKeys: readonly string[]
): KpViteManifestClosure {
  if (rootKeys.length === 0) {
    throw new Error("Vite manifest closure requires at least one root.");
  }
  const chunks = new Set<string>();
  const queue = [...rootKeys];
  while (queue.length > 0) {
    const key = queue.pop()!;
    if (chunks.has(key)) continue;
    const chunk = requireChunk(manifest, key);
    chunks.add(key);
    queue.push(...(chunk.imports ?? []));
  }
  return createClosure(manifest, rootKeys, chunks);
}

export function collectKpViteManifestExperienceClosure(
  manifest: KpViteManifest,
  scenario: KpBundleExperienceScenario
): KpViteManifestExperienceClosure {
  const entry = collectKpViteManifestStaticClosure(
    manifest,
    scenario.entryRoots
  );
  let current = entry;
  const activeRoots = [...scenario.entryRoots];
  const activations: KpViteManifestActivationClosure[] = [];

  for (const activation of scenario.activations) {
    const discoverable = new Set(current.discoverableDynamicRoots);
    for (const root of activation.manifestRoots) {
      if (!discoverable.has(root)) {
        throw new Error(
          `Bundle scenario ${scenario.id} activation ${activation.id} ` +
          `cannot reach undeclared dynamic root ${root}.`
        );
      }
    }
    const activated = collectKpViteManifestStaticClosure(
      manifest,
      activation.manifestRoots
    );
    activeRoots.push(...activation.manifestRoots);
    const nextChunkKeys = new Set([
      ...current.chunkKeys,
      ...activated.chunkKeys
    ]);
    const next = createClosure(manifest, activeRoots, nextChunkKeys);
    activations.push(Object.freeze({
      id: activation.id,
      roots: activation.manifestRoots,
      activated,
      incremental: differenceKpViteManifestClosures(next, current)
    }));
    current = next;
  }

  return Object.freeze({
    scenarioId: scenario.id,
    entry,
    activations: Object.freeze(activations),
    experience: current
  });
}

export function differenceKpViteManifestClosures(
  target: KpViteManifestClosure,
  base: KpViteManifestClosure
): KpViteManifestClosureDelta {
  const baseChunks = new Set(base.chunkKeys);
  const baseFiles = new Set(base.resources.map(({ file }) => file));
  return Object.freeze({
    chunkKeys: Object.freeze(target.chunkKeys.filter((key) =>
      !baseChunks.has(key)
    )),
    resources: Object.freeze(target.resources.filter(({ file }) =>
      !baseFiles.has(file)
    ))
  });
}

function createClosure(
  manifest: KpViteManifest,
  rootKeys: readonly string[],
  chunkKeys: ReadonlySet<string>
): KpViteManifestClosure {
  const resourcesByFile = new Map<string, {
    kind: Exclude<KpBundleResourceKind, "total">;
    ownerKeys: Set<string>;
    ownerSources: Set<string>;
  }>();
  const dynamicRoots = new Set<string>();

  for (const key of [...chunkKeys].sort()) {
    const chunk = requireChunk(manifest, key);
    addResource(resourcesByFile, chunk.file, resourceKind(chunk.file), key, chunk);
    for (const css of chunk.css ?? []) {
      addResource(resourcesByFile, css, "style", key, chunk);
    }
    for (const asset of chunk.assets ?? []) {
      addResource(resourcesByFile, asset, resourceKind(asset), key, chunk);
    }
    for (const dynamicRoot of chunk.dynamicImports ?? []) {
      requireChunk(manifest, dynamicRoot);
      if (!chunkKeys.has(dynamicRoot)) dynamicRoots.add(dynamicRoot);
    }
  }

  const resources = [...resourcesByFile.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([file, resource]) => Object.freeze({
      file,
      kind: resource.kind,
      ownerKeys: Object.freeze([...resource.ownerKeys].sort()),
      ownerSources: Object.freeze([...resource.ownerSources].sort())
    }));

  return Object.freeze({
    rootKeys: Object.freeze([...new Set(rootKeys)]),
    chunkKeys: Object.freeze([...chunkKeys].sort()),
    resources: Object.freeze(resources),
    discoverableDynamicRoots: Object.freeze([...dynamicRoots].sort())
  });
}

function addResource(
  resources: Map<string, {
    kind: Exclude<KpBundleResourceKind, "total">;
    ownerKeys: Set<string>;
    ownerSources: Set<string>;
  }>,
  file: string,
  kind: Exclude<KpBundleResourceKind, "total">,
  ownerKey: string,
  owner: KpViteManifestChunk
): void {
  const current = resources.get(file) ?? {
    kind,
    ownerKeys: new Set<string>(),
    ownerSources: new Set<string>()
  };
  if (current.kind !== kind) {
    throw new Error(
      `Vite resource ${file} has conflicting kinds ${current.kind} and ${kind}.`
    );
  }
  current.ownerKeys.add(ownerKey);
  current.ownerSources.add(owner.src ?? owner.name ?? ownerKey);
  resources.set(file, current);
}

function requireChunk(
  manifest: KpViteManifest,
  key: string
): KpViteManifestChunk {
  const chunk = manifest[key];
  if (chunk === undefined) {
    throw new Error(`Vite manifest lacks chunk ${key}.`);
  }
  return chunk;
}

function resourceKind(
  file: string
): Exclude<KpBundleResourceKind, "total"> {
  const extension = extname(file).toLowerCase();
  if (extension === ".js" || extension === ".mjs") return "script";
  if (extension === ".css") return "style";
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(extension)) {
    return "font";
  }
  return "asset";
}
