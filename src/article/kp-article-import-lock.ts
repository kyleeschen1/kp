import type { KpArticleFrontmatter } from "./kp-article-frontmatter.ts";
import type { KpArticleSource } from "./kp-article-source.ts";
import { validateKpArticleRc1 } from "./kp-article-validation.ts";
import { resolveKpArticleSemanticReferences } from "./kp-article-semantic-references.ts";

export const kpArticleImportLockSchema = "kp.article-import-lock.v1" as const;

export interface KpVignetteReleasePayload {
  readonly schemaVersion: "kp.vignette-release.v1";
  readonly id: string;
  readonly version: string;
  readonly moduleSpecifier: string;
  readonly animationId: string;
  readonly objectPaths: readonly string[];
  readonly transitionPaths: readonly string[];
  readonly checkpointPaths: readonly string[];
  readonly staticProjection?: KpVignetteStaticProjection;
}

export interface KpVignetteStaticProjection {
  readonly checkpoints: readonly KpVignetteStaticCheckpoint[];
  readonly transitions: readonly KpVignetteStaticTransition[];
}

export interface KpVignetteStaticCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly alt: string;
  readonly caption: string;
  readonly assetPath: string;
}

export interface KpVignetteStaticTransition {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

export interface KpVignetteRelease extends KpVignetteReleasePayload {
  readonly integrity: `sha256:${string}`;
}

export interface KpArticleImportLockEntry {
  readonly alias: string;
  readonly request: string;
  readonly vignetteId: string;
  readonly requestedMajor: number;
  readonly version: string;
  readonly integrity: `sha256:${string}`;
  readonly moduleSpecifier: string;
}

export interface KpArticleImportLock {
  readonly schemaVersion: typeof kpArticleImportLockSchema;
  readonly documentId: string;
  readonly entries: readonly KpArticleImportLockEntry[];
}

export interface KpArticleResolvedStageImport {
  readonly stageId: string;
  readonly alias: string;
  readonly release: KpVignetteRelease;
}

export interface KpArticleResolvedImports {
  readonly lock: KpArticleImportLock;
  readonly releases: readonly KpVignetteRelease[];
  readonly stages: readonly KpArticleResolvedStageImport[];
}

export class KpArticleImportLockError extends Error {
  readonly code:
    | "import-source-invalid"
    | "import-release-invalid"
    | "import-release-duplicate"
    | "import-release-unavailable"
    | "import-stage-alias-unknown"
    | "import-semantic-path-unknown"
    | "import-lock-schema"
    | "import-lock-document"
    | "import-lock-aliases"
    | "import-lock-request"
    | "import-lock-release-missing"
    | "import-lock-integrity-drift";

  constructor(code: KpArticleImportLockError["code"], message: string) {
    super(message);
    this.name = "KpArticleImportLockError";
    this.code = code;
  }
}

const vignetteIdPattern = /^vignette\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/u;
const exactVersionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const integrityPattern = /^sha256:[a-f0-9]{64}$/u;
const semanticPathPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*)*$/u;

export function createKpVignetteRelease(
  input: KpVignetteRelease
): KpVignetteRelease {
  if (
    input.schemaVersion !== "kp.vignette-release.v1"
    || !vignetteIdPattern.test(input.id)
    || !exactVersionPattern.test(input.version)
    || !integrityPattern.test(input.integrity)
    || input.moduleSpecifier.length === 0
    || input.animationId.length === 0
  ) {
    throw new KpArticleImportLockError("import-release-invalid", `Invalid vignette release ${input.id}@${input.version}.`);
  }
  const objectPaths = normalizedPaths(input.objectPaths);
  const transitionPaths = normalizedPaths(input.transitionPaths);
  const checkpointPaths = normalizedPaths(input.checkpointPaths);
  const staticProjection = input.staticProjection === undefined
    ? undefined
    : normalizeStaticProjection(input.staticProjection, checkpointPaths, transitionPaths);
  return Object.freeze({
    schemaVersion: input.schemaVersion,
    id: input.id,
    version: input.version,
    integrity: input.integrity,
    moduleSpecifier: input.moduleSpecifier,
    animationId: input.animationId,
    objectPaths,
    transitionPaths,
    checkpointPaths,
    ...(staticProjection === undefined ? {} : { staticProjection })
  });
}

export function serializeKpVignetteReleasePayload(
  release: KpVignetteRelease
): string {
  const payload: KpVignetteReleasePayload = {
    schemaVersion: release.schemaVersion,
    id: release.id,
    version: release.version,
    moduleSpecifier: release.moduleSpecifier,
    animationId: release.animationId,
    objectPaths: release.objectPaths,
    transitionPaths: release.transitionPaths,
    checkpointPaths: release.checkpointPaths,
    ...(release.staticProjection === undefined ? {} : { staticProjection: release.staticProjection })
  };
  return JSON.stringify(payload);
}

export function resolveKpArticleImports(
  source: KpArticleSource,
  registry: readonly KpVignetteRelease[],
  existingLock?: KpArticleImportLock
): KpArticleResolvedImports {
  const validation = validateKpArticleRc1(source);
  if (!validation.valid || validation.frontmatter === undefined) {
    throw new KpArticleImportLockError(
      "import-source-invalid",
      "Vignette imports require a valid kp.article.v1-rc1 source."
    );
  }
  const releases = validateRegistry(registry);
  const semantics = resolveKpArticleSemanticReferences(source);
  if (!semantics.valid) {
    throw new KpArticleImportLockError(
      "import-source-invalid",
      "Vignette imports require valid semantic stage and object references."
    );
  }
  const resolved = existingLock === undefined
    ? resolveLatest(validation.frontmatter, releases)
    : resolveLocked(validation.frontmatter, releases, existingLock);
  const byAlias = new Map(resolved.lock.entries.map((entry, index) => [
    entry.alias,
    resolved.releases[index]!
  ]));
  const stages = validation.directives
    .filter((directive) => directive.kind === "stage")
    .map((stage) => {
      const release = byAlias.get(stage.use);
      if (release === undefined) {
        throw new KpArticleImportLockError(
          "import-stage-alias-unknown",
          `Stage ${stage.id} uses unknown vignette import alias ${stage.use}.`
        );
      }
      return Object.freeze({ stageId: stage.id, alias: stage.use, release });
    });
  const releaseByStage = new Map(stages.map(({ stageId, release }) => [stageId, release]));
  for (const reference of semantics.references) {
    const release = releaseByStage.get(reference.stageId)!;
    const available = reference.origin === "motion-run"
      ? release.transitionPaths
      : reference.origin === "motion-range-from" || reference.origin === "motion-range-to"
        ? release.checkpointPaths
        : release.objectPaths;
    if (!available.includes(reference.objectPath)) {
      throw new KpArticleImportLockError(
        "import-semantic-path-unknown",
        `${release.id}@${release.version} does not export ${reference.origin} path ${reference.objectPath}.`
      );
    }
  }
  return Object.freeze({
    lock: resolved.lock,
    releases: resolved.releases,
    stages: Object.freeze(stages)
  });
}

function resolveLatest(
  frontmatter: KpArticleFrontmatter,
  registry: readonly KpVignetteRelease[]
): Pick<KpArticleResolvedImports, "lock" | "releases"> {
  const selected = sortedImports(frontmatter).map(([alias, request]) => {
    const parsed = parseRequest(request);
    const compatible = registry
      .filter((release) => release.id === parsed.id && versionParts(release.version)[0] === parsed.major)
      .sort((left, right) => compareVersions(right.version, left.version));
    const release = compatible[0];
    if (release === undefined) {
      throw new KpArticleImportLockError(
        "import-release-unavailable",
        `No exact release satisfies ${request} for import ${alias}.`
      );
    }
    return { alias, request, parsed, release };
  });
  return Object.freeze({
    lock: freezeLock(frontmatter.id, selected.map(({ alias, request, parsed, release }) => ({
      alias,
      request,
      vignetteId: parsed.id,
      requestedMajor: parsed.major,
      version: release.version,
      integrity: release.integrity,
      moduleSpecifier: release.moduleSpecifier
    }))),
    releases: Object.freeze(selected.map(({ release }) => release))
  });
}

function resolveLocked(
  frontmatter: KpArticleFrontmatter,
  registry: readonly KpVignetteRelease[],
  lock: KpArticleImportLock
): Pick<KpArticleResolvedImports, "lock" | "releases"> {
  if (lock.schemaVersion !== kpArticleImportLockSchema) {
    throw new KpArticleImportLockError("import-lock-schema", "Unsupported KP article import lock schema.");
  }
  if (lock.documentId !== frontmatter.id) {
    throw new KpArticleImportLockError(
      "import-lock-document",
      `Import lock belongs to ${lock.documentId}, not ${frontmatter.id}.`
    );
  }
  const imports = sortedImports(frontmatter);
  const entries = [...lock.entries].sort((left, right) => left.alias.localeCompare(right.alias));
  if (
    entries.length !== imports.length
    || entries.some((entry, index) => entry.alias !== imports[index]?.[0])
  ) {
    throw new KpArticleImportLockError("import-lock-aliases", "Import lock aliases do not match article imports.");
  }

  const releases = entries.map((entry, index) => {
    const request = imports[index]![1];
    const parsed = parseRequest(request);
    if (
      entry.request !== request
      || entry.vignetteId !== parsed.id
      || entry.requestedMajor !== parsed.major
      || versionParts(entry.version)[0] !== parsed.major
    ) {
      throw new KpArticleImportLockError(
        "import-lock-request",
        `Locked import ${entry.alias} no longer matches request ${request}.`
      );
    }
    const release = registry.find((candidate) => (
      candidate.id === entry.vignetteId && candidate.version === entry.version
    ));
    if (release === undefined) {
      throw new KpArticleImportLockError(
        "import-lock-release-missing",
        `Locked release ${entry.vignetteId}@${entry.version} is unavailable.`
      );
    }
    if (release.integrity !== entry.integrity || release.moduleSpecifier !== entry.moduleSpecifier) {
      throw new KpArticleImportLockError(
        "import-lock-integrity-drift",
        `Locked release ${entry.vignetteId}@${entry.version} changed integrity or entry module.`
      );
    }
    return release;
  });
  return Object.freeze({
    lock: freezeLock(frontmatter.id, entries),
    releases: Object.freeze(releases)
  });
}

function validateRegistry(registry: readonly KpVignetteRelease[]): readonly KpVignetteRelease[] {
  const releases = registry.map(createKpVignetteRelease);
  const identities = new Set<string>();
  for (const release of releases) {
    const identity = `${release.id}@${release.version}`;
    if (identities.has(identity)) {
      throw new KpArticleImportLockError("import-release-duplicate", `Duplicate vignette release ${identity}.`);
    }
    identities.add(identity);
  }
  return Object.freeze(releases);
}

function normalizedPaths(paths: readonly string[]): readonly string[] {
  if (paths.some((path) => !semanticPathPattern.test(path))) {
    throw new KpArticleImportLockError("import-release-invalid", "Vignette semantic paths must use lowercase slash-separated slugs.");
  }
  return Object.freeze([...new Set(paths)].sort());
}

function normalizeStaticProjection(
  projection: KpVignetteStaticProjection,
  checkpointPaths: readonly string[],
  transitionPaths: readonly string[]
): KpVignetteStaticProjection {
  const checkpoints = [...projection.checkpoints]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((checkpoint) => {
      if (
        !checkpointPaths.includes(checkpoint.id)
        || checkpoint.label.trim().length === 0
        || checkpoint.alt.trim().length === 0
        || checkpoint.caption.trim().length === 0
        || !/^\.\/[a-zA-Z0-9./_-]+\.svg$/u.test(checkpoint.assetPath)
      ) {
        throw new KpArticleImportLockError("import-release-invalid", `Invalid static checkpoint ${checkpoint.id}.`);
      }
      return Object.freeze({ ...checkpoint });
    });
  if (new Set(checkpoints.map(({ id }) => id)).size !== checkpoints.length) {
    throw new KpArticleImportLockError("import-release-invalid", "Static checkpoint IDs must be unique.");
  }
  const transitions = [...projection.transitions]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((transition) => {
      if (
        !transitionPaths.includes(transition.id)
        || !checkpointPaths.includes(transition.from)
        || !checkpointPaths.includes(transition.to)
      ) {
        throw new KpArticleImportLockError("import-release-invalid", `Invalid static transition ${transition.id}.`);
      }
      return Object.freeze({ ...transition });
    });
  if (new Set(transitions.map(({ id }) => id)).size !== transitions.length) {
    throw new KpArticleImportLockError("import-release-invalid", "Static transition IDs must be unique.");
  }
  return Object.freeze({
    checkpoints: Object.freeze(checkpoints),
    transitions: Object.freeze(transitions)
  });
}

function parseRequest(request: string): Readonly<{ id: string; major: number }> {
  const match = request.match(/^(vignette\.[a-z0-9]+(?:[.-][a-z0-9]+)*)@([1-9][0-9]*)$/u);
  if (match === null) {
    throw new KpArticleImportLockError("import-release-invalid", `Invalid vignette import request ${request}.`);
  }
  return Object.freeze({ id: match[1]!, major: Number(match[2]!) });
}

function sortedImports(frontmatter: KpArticleFrontmatter): readonly (readonly [string, string])[] {
  return Object.freeze(Object.entries(frontmatter.imports).sort(([left], [right]) => left.localeCompare(right)));
}

function versionParts(version: string): readonly [number, number, number] {
  const match = version.match(exactVersionPattern)!;
  return [Number(match[1]!), Number(match[2]!), Number(match[3]!)];
}

function compareVersions(left: string, right: string): number {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

function freezeLock(
  documentId: string,
  entries: readonly KpArticleImportLockEntry[]
): KpArticleImportLock {
  return Object.freeze({
    schemaVersion: kpArticleImportLockSchema,
    documentId,
    entries: Object.freeze(entries.map((entry) => Object.freeze({ ...entry })))
  });
}
