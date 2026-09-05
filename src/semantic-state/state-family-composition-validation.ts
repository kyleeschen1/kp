import { encodeKpSemanticStatePathSegment } from
  "./authoring-schema-compiler.ts";
import type {
  KpSemanticCompositionId,
  KpSemanticStateIdentityScope
} from "./identity.ts";
import type {
  KpSemanticStateFamilyDefinitionDeclaration
} from "./state-family-definition.ts";
import {
  areKpSemanticStateTransitionPlansEqual
} from "./state-family-transition.ts";
import type {
  KpSemanticStateCompositionDeclaration,
  KpSemanticStateCompositionMemberDeclaration,
  KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";

export type KpSemanticStateCompositionDiagnosticCode =
  | "composition-namespace-mismatch"
  | "duplicate-application-identity"
  | "duplicate-family-definition"
  | "duplicate-scoped-name"
  | "family-definition-mismatch"
  | "foreign-family-schema"
  | "invalid-composition-node"
  | "missing-source-metadata"
  | "recursive-composition"
  | "unknown-family-definition";

export interface KpSemanticStateCompositionDiagnostic {
  readonly schemaVersion: "kp.semantic-state-composition-diagnostic.v1";
  readonly kind: "semantic-state-composition-diagnostic";
  readonly code: KpSemanticStateCompositionDiagnosticCode;
  readonly path: readonly string[];
  readonly message: string;
}

export class KpSemanticStateCompositionValidationError extends Error {
  readonly diagnostics: readonly KpSemanticStateCompositionDiagnostic[];

  constructor(diagnostics: readonly KpSemanticStateCompositionDiagnostic[]) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.name = "KpSemanticStateCompositionValidationError";
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

export interface KpValidatedSemanticStateComposition<
  Declaration extends KpSemanticStateCompositionDeclaration =
    KpSemanticStateCompositionDeclaration
> {
  readonly schemaVersion: "kp.validated-semantic-state-composition.v1";
  readonly kind: "validated-semantic-state-composition";
  readonly id: KpSemanticCompositionId;
  readonly namespace: string;
  readonly declaration: Declaration;
  readonly scopePaths: readonly string[];
  readonly memberCount: number;
}

export function validateKpSemanticStateComposition<
  const Declaration extends KpSemanticStateCompositionDeclaration
>(input: {
  readonly identities: KpSemanticStateIdentityScope;
  readonly declaration: Declaration;
  readonly definitions:
    readonly KpSemanticStateFamilyDefinitionDeclaration[];
}): KpValidatedSemanticStateComposition<Declaration> {
  const diagnostics: KpSemanticStateCompositionDiagnostic[] = [];
  const report = (
    code: KpSemanticStateCompositionDiagnosticCode,
    path: readonly string[],
    message: string
  ) => diagnostics.push(Object.freeze({
    schemaVersion: "kp.semantic-state-composition-diagnostic.v1" as const,
    kind: "semantic-state-composition-diagnostic" as const,
    code,
    path: Object.freeze([...path]),
    message
  }));

  if (input.declaration.namespace !== input.identities.namespace) {
    report(
      "composition-namespace-mismatch",
      [],
      `Composition namespace ${JSON.stringify(input.declaration.namespace)} does not match identity scope ${JSON.stringify(input.identities.namespace)}.`
    );
  }
  requireSource(input.declaration.sourceId, [], report);

  const definitions = new Map<string, KpSemanticStateFamilyDefinitionDeclaration>();
  for (const definition of input.definitions) {
    if (definitions.has(definition.id)) {
      report(
        "duplicate-family-definition",
        [],
        `Family definition ${JSON.stringify(definition.id)} is supplied more than once.`
      );
    } else {
      definitions.set(definition.id, definition);
    }
  }

  const scopePaths: string[] = [];
  const scopedNames = new Set<string>();
  const applicationIdentities = new Set<string>();
  const ancestors = new Set<object>();
  let memberCount = 0;

  const visit = (
    node: KpSemanticStateCompositionNodeDeclaration,
    parentPath: readonly string[],
    parentEncodedPath: readonly string[]
  ): void => {
    if (typeof node !== "object" || node === null) {
      report("invalid-composition-node", parentPath, "Composition node is not an object.");
      return;
    }
    const candidateName = typeof node.name === "string" ? node.name : "?";
    const path = [...parentPath, candidateName];
    if (ancestors.has(node)) {
      report("recursive-composition", path, "Composition nesting contains a cycle.");
      return;
    }
    ancestors.add(node);

    let encodedName: string | undefined;
    try {
      encodedName = encodeKpSemanticStatePathSegment(candidateName);
    } catch {
      report("invalid-composition-node", path, `Composition node name ${JSON.stringify(candidateName)} is invalid.`);
    }
    if (encodedName !== undefined) {
      const encodedPath = [...parentEncodedPath, encodedName].join(".");
      if (scopedNames.has(encodedPath)) {
        report("duplicate-scoped-name", path, `Composition scope ${JSON.stringify(path)} is declared more than once.`);
      } else {
        scopedNames.add(encodedPath);
        scopePaths.push(encodedPath);
      }
    }
    requireSource(node.sourceId, path, report);

    if (node.kind === "member") {
      memberCount += 1;
      validateMember({
        member: node,
        path,
        namespace: input.declaration.namespace,
        definitions,
        applicationIdentities,
        report
      });
    } else if (node.kind === "sequence") {
      if (!Array.isArray(node.members) || node.members.length === 0) {
        report("invalid-composition-node", path, "A sequence requires members.");
      } else {
        node.members.forEach((member) => visit(
          member,
          path,
          encodedName === undefined
            ? parentEncodedPath
            : [...parentEncodedPath, encodedName]
        ));
      }
    } else if (node.kind === "group") {
      visit(
        node.body,
        path,
        encodedName === undefined
          ? parentEncodedPath
          : [...parentEncodedPath, encodedName]
      );
    } else if (node.kind === "independent") {
      requireSource(node.evidence?.sourceId, path, report);
      if (!Array.isArray(node.members) || node.members.length === 0) {
        report("invalid-composition-node", path, "An independent cohort requires members.");
      } else {
        node.members.forEach((member) => visit(
          member,
          path,
          encodedName === undefined
            ? parentEncodedPath
            : [...parentEncodedPath, encodedName]
        ));
      }
    } else {
      report("invalid-composition-node", path, `Unknown composition node kind ${JSON.stringify((node as { kind?: unknown }).kind)}.`);
    }
    ancestors.delete(node);
  };

  visit(input.declaration.root, [], []);
  if (diagnostics.length > 0) {
    throw new KpSemanticStateCompositionValidationError(diagnostics);
  }

  return Object.freeze({
    schemaVersion: "kp.validated-semantic-state-composition.v1",
    kind: "validated-semantic-state-composition",
    id: input.identities.composition(input.declaration.localId),
    namespace: input.declaration.namespace,
    declaration: input.declaration,
    scopePaths: Object.freeze(scopePaths),
    memberCount
  });
}

function validateMember(input: {
  readonly member: KpSemanticStateCompositionMemberDeclaration;
  readonly path: readonly string[];
  readonly namespace: string;
  readonly definitions: ReadonlyMap<
    string,
    KpSemanticStateFamilyDefinitionDeclaration
  >;
  readonly applicationIdentities: Set<string>;
  readonly report: DiagnosticReporter;
}): void {
  const application = input.member.application;
  if (typeof application !== "object" || application === null) {
    input.report("invalid-composition-node", input.path, "Composition member has no prepared family application record.");
    return;
  }
  requireSource(application.source?.sourceId, input.path, input.report);
  if (input.applicationIdentities.has(application.transformationId)) {
    input.report(
      "duplicate-application-identity",
      input.path,
      `Prepared application ${JSON.stringify(application.transformationId)} is reused in the composition.`
    );
  }
  input.applicationIdentities.add(application.transformationId);

  if (application.transitionPlan?.namespace !== input.namespace) {
    input.report(
      "foreign-family-schema",
      input.path,
      `Application ${JSON.stringify(application.applicationId)} belongs to schema ${JSON.stringify(application.transitionPlan?.namespace)}, not ${JSON.stringify(input.namespace)}.`
    );
  }
  const definition = input.definitions.get(application.definitionId);
  if (definition === undefined) {
    input.report(
      "unknown-family-definition",
      input.path,
      `Application ${JSON.stringify(application.applicationId)} references unknown family definition ${JSON.stringify(application.definitionId)}.`
    );
    return;
  }
  requireSource(definition.sourceId, input.path, input.report);
  if (definition.namespace !== input.namespace) {
    input.report(
      "foreign-family-schema",
      input.path,
      `Family definition ${JSON.stringify(definition.id)} belongs to schema ${JSON.stringify(definition.namespace)}, not ${JSON.stringify(input.namespace)}.`
    );
  }
  if (!areKpSemanticStateTransitionPlansEqual(
    definition.transitionPlan,
    application.transitionPlan
  )) {
    input.report(
      "family-definition-mismatch",
      input.path,
      `Application ${JSON.stringify(application.applicationId)} does not retain the supplied family definition transition plan.`
    );
  }
}

type DiagnosticReporter = (
  code: KpSemanticStateCompositionDiagnosticCode,
  path: readonly string[],
  message: string
) => void;

function requireSource(
  value: unknown,
  path: readonly string[],
  report: DiagnosticReporter
): void {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    report(
      "missing-source-metadata",
      path,
      `Composition path ${JSON.stringify(path)} requires non-empty trimmed source metadata.`
    );
  }
}
