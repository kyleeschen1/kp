import type { KpArticleDirectiveAttribute } from "./kp-article-directives.ts";
import { scanKpArticleMarkdownLinks } from "./kp-article-markdown-links.ts";
import {
  createKpArticleSourceSpan,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";
import {
  validateKpArticleRc1,
  type KpArticleDiagnostic,
  type KpValidatedArticleDirective
} from "./kp-article-validation.ts";

export type KpArticleSemanticReferenceOrigin =
  | "focus-target"
  | "focus-context"
  | "motion-run"
  | "motion-range-from"
  | "motion-range-to"
  | "inline-link";

export interface KpArticleSemanticReference {
  readonly origin: KpArticleSemanticReferenceOrigin;
  readonly ownerId?: string;
  readonly label?: string;
  readonly stageId: string;
  readonly objectPath: string;
  readonly address: string;
  readonly fullId: string;
  readonly staticFragment: string;
  readonly timelineAuthority: "none";
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleStageBinding {
  readonly ownerId: string;
  readonly ownerKind: "focus" | "motion";
  readonly stageId: string;
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleSemanticResolution {
  readonly valid: boolean;
  readonly stageBindings: readonly KpArticleStageBinding[];
  readonly references: readonly KpArticleSemanticReference[];
  readonly diagnostics: readonly KpArticleDiagnostic[];
}

const semanticSegmentPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export function resolveKpArticleSemanticReferences(
  source: KpArticleSource
): KpArticleSemanticResolution {
  const validation = validateKpArticleRc1(source);
  if (!validation.valid || validation.frontmatter === undefined) {
    return result([], [], validation.diagnostics);
  }

  const diagnostics: KpArticleDiagnostic[] = [];
  const references: KpArticleSemanticReference[] = [];
  const stageBindings: KpArticleStageBinding[] = [];
  const identities = new Map(validation.directives.map((directive) => [directive.id, directive]));
  const stages = new Map(validation.directives
    .filter((directive) => directive.kind === "stage")
    .map((directive) => [directive.id, directive]));

  for (const directive of validation.directives) {
    if (directive.kind !== "focus" && directive.kind !== "motion") continue;
    const stageAttribute = property(directive, "stage")!;
    const stage = identities.get(directive.stage);
    if (stage === undefined) {
      diagnostics.push(diagnostic(
        "semantic-stage-unknown",
        `${directive.source.name} references unknown stage ${directive.stage}.`,
        valueSpan(source, stageAttribute)
      ));
      continue;
    }
    if (stage.kind !== "stage") {
      diagnostics.push(diagnostic(
        "semantic-stage-kind",
        `${directive.stage} is a ${stage.kind} identity, not a stage.`,
        valueSpan(source, stageAttribute)
      ));
      continue;
    }
    stageBindings.push(Object.freeze({
      ownerId: directive.id,
      ownerKind: directive.kind,
      stageId: stage.id,
      span: valueSpan(source, stageAttribute)
    }));

    if (directive.kind === "focus") {
      resolveWords(source, validation.frontmatter.id, directive, "target", "focus-target", directive.stage, references, diagnostics);
      resolveWords(source, validation.frontmatter.id, directive, "context", "focus-context", directive.stage, references, diagnostics);
    } else {
      if (directive.run !== undefined) {
        resolveWords(source, validation.frontmatter.id, directive, "run", "motion-run", directive.stage, references, diagnostics);
      }
      if (directive.range !== undefined) {
        const rangeAttribute = property(directive, "range")!;
        const rangeSpan = valueSpan(source, rangeAttribute);
        resolveAddress(
          validation.frontmatter.id,
          directive.range.from,
          createKpArticleSourceSpan(source, rangeSpan.start.offset, rangeSpan.start.offset + directive.range.from.length),
          "motion-range-from",
          directive.id,
          directive.stage,
          references,
          diagnostics
        );
        resolveAddress(
          validation.frontmatter.id,
          directive.range.to,
          createKpArticleSourceSpan(source, rangeSpan.end.offset - directive.range.to.length, rangeSpan.end.offset),
          "motion-range-to",
          directive.id,
          directive.stage,
          references,
          diagnostics
        );
      }
    }
  }

  for (const link of scanKpArticleMarkdownLinks(source)) {
    if (!link.url.startsWith("kp-ref:")) continue;
    const address = link.url.slice("kp-ref:".length);
    const addressSpan = createKpArticleSourceSpan(
      source,
      link.destinationSpan.start.offset + "kp-ref:".length,
      link.destinationSpan.end.offset
    );
    const parsed = parseAddress(address);
    if (parsed === undefined) {
      diagnostics.push(diagnostic(
        "semantic-address-invalid",
        `Invalid semantic object address: ${address}.`,
        addressSpan
      ));
      continue;
    }
    if (!stages.has(parsed.stageId)) {
      diagnostics.push(diagnostic(
        "semantic-stage-unknown",
        `Semantic link references unknown stage ${parsed.stageId}.`,
        addressSpan
      ));
      continue;
    }
    references.push(reference(
      validation.frontmatter.id,
      parsed,
      "inline-link",
      addressSpan,
      undefined,
      link.label
    ));
  }

  return result(stageBindings, references, diagnostics);
}

function resolveWords(
  source: KpArticleSource,
  documentId: string,
  directive: KpValidatedArticleDirective,
  attributeName: string,
  origin: KpArticleSemanticReferenceOrigin,
  expectedStage: string,
  references: KpArticleSemanticReference[],
  diagnostics: KpArticleDiagnostic[]
): void {
  const attribute = property(directive, attributeName);
  if (attribute === undefined) return;
  const attributeSpan = valueSpan(source, attribute);
  let searchFrom = 0;
  for (const address of attribute.value.trim().split(/\s+/u).filter(Boolean)) {
    const relative = attribute.value.indexOf(address, searchFrom);
    searchFrom = relative + address.length;
    resolveAddress(
      documentId,
      address,
      createKpArticleSourceSpan(
        source,
        attributeSpan.start.offset + relative,
        attributeSpan.start.offset + relative + address.length
      ),
      origin,
      directive.id,
      expectedStage,
      references,
      diagnostics
    );
  }
}

function resolveAddress(
  documentId: string,
  address: string,
  span: KpArticleSourceSpan,
  origin: KpArticleSemanticReferenceOrigin,
  ownerId: string,
  expectedStage: string,
  references: KpArticleSemanticReference[],
  diagnostics: KpArticleDiagnostic[]
): void {
  const parsed = parseAddress(address);
  if (parsed === undefined) {
    diagnostics.push(diagnostic(
      "semantic-address-invalid",
      `Invalid semantic object address: ${address}.`,
      span
    ));
    return;
  }
  if (parsed.stageId !== expectedStage) {
    diagnostics.push(diagnostic(
      "semantic-stage-mismatch",
      `${address} belongs to stage ${parsed.stageId}, not ${expectedStage}.`,
      span
    ));
    return;
  }
  references.push(reference(documentId, parsed, origin, span, ownerId));
}

function parseAddress(address: string): Readonly<{ stageId: string; objectPath: string }> | undefined {
  if (address.includes("?") || address.includes("#")) return undefined;
  const [stageId, ...objectSegments] = address.split("/");
  if (
    stageId === undefined
    || !semanticSegmentPattern.test(stageId)
    || objectSegments.length === 0
    || objectSegments.some((segment) => !semanticSegmentPattern.test(segment))
  ) return undefined;
  return Object.freeze({ stageId, objectPath: objectSegments.join("/") });
}

function reference(
  documentId: string,
  parsed: Readonly<{ stageId: string; objectPath: string }>,
  origin: KpArticleSemanticReferenceOrigin,
  span: KpArticleSourceSpan,
  ownerId?: string,
  label?: string
): KpArticleSemanticReference {
  const address = `${parsed.stageId}/${parsed.objectPath}`;
  return Object.freeze({
    origin,
    ...(ownerId === undefined ? {} : { ownerId }),
    ...(label === undefined ? {} : { label }),
    stageId: parsed.stageId,
    objectPath: parsed.objectPath,
    address,
    fullId: `${documentId}#${address}`,
    staticFragment: `kp-ref:${address}`,
    // A semantic link can request attention, but only kp-motion owns timeline state.
    timelineAuthority: "none" as const,
    span
  });
}

function property(
  directive: KpValidatedArticleDirective,
  name: string
): KpArticleDirectiveAttribute | undefined {
  return directive.source.attributes.find((attribute) => (
    attribute.kind === "property" && attribute.name === name
  ));
}

function valueSpan(source: KpArticleSource, attribute: KpArticleDirectiveAttribute): KpArticleSourceSpan {
  const equals = attribute.raw.indexOf("=");
  const quoted = attribute.raw[equals + 1] === '"' || attribute.raw[equals + 1] === "'";
  return createKpArticleSourceSpan(
    source,
    attribute.span.start.offset + equals + 1 + (quoted ? 1 : 0),
    attribute.span.end.offset - (quoted ? 1 : 0)
  );
}

function result(
  stageBindings: readonly KpArticleStageBinding[],
  references: readonly KpArticleSemanticReference[],
  diagnostics: readonly KpArticleDiagnostic[]
): KpArticleSemanticResolution {
  return Object.freeze({
    valid: diagnostics.length === 0,
    stageBindings: Object.freeze([...stageBindings]),
    references: Object.freeze([...references]),
    diagnostics: Object.freeze([...diagnostics])
  });
}

function diagnostic(code: string, message: string, span: KpArticleSourceSpan): KpArticleDiagnostic {
  return Object.freeze({ severity: "error" as const, code, message, span });
}
