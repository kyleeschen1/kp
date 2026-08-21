import {
  kpPythonFreeShippingRefactorContract,
  type KpPythonRefactorEntityContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";
import {
  defineKpPythonRefactorSemanticArtifact,
  type KpPythonRefactorSemanticArtifactV1,
  type KpPythonSemanticEntity
} from "../src/semantic/python-refactor-semantic-model.ts";
import { createKpPythonSourceTokens } from
  "../src/semantic/python-source-tokens.ts";
import {
  compileKpPythonFrontend,
  type KpPythonFrontendResult
} from "./python-refactor-frontend.ts";
import {
  proveKpPythonExtractHelperLegality
} from "./python-extract-helper-legality.ts";
import {
  recognizeKpPythonExtractHelperRoles
} from "./python-extract-helper-role-recognizer.ts";
import {
  bindKpPythonExtractHelperSemantics,
  type KpPythonSemanticSyntaxBinding
} from "./python-extract-helper-semantic-binder.ts";

export function compileKpPythonRefactorSemantics():
  KpPythonRefactorSemanticArtifactV1 {
  const contract = kpPythonFreeShippingRefactorContract;
  const before = compileKpPythonFrontend({
    path: contract.before.path,
    revisionId: contract.before.revisionId,
    sourceText: contract.before.source
  });
  const after = compileKpPythonFrontend({
    path: contract.after.path,
    revisionId: contract.after.revisionId,
    sourceText: contract.after.source
  });
  const roles = recognizeKpPythonExtractHelperRoles(before, after);
  const legality = proveKpPythonExtractHelperLegality(before, after, roles);
  if (legality.status !== "accepted") {
    throw new Error(`Canonical Python refactor is not legal: ${JSON.stringify(legality.diagnostics)}`);
  }
  const binding = bindKpPythonExtractHelperSemantics({
    entities: contract.entities,
    source: before,
    target: after,
    roles,
    legality
  });
  if (binding.status !== "accepted") {
    throw new Error(`Canonical Python refactor does not bind: ${JSON.stringify(binding.diagnostics)}`);
  }

  return defineKpPythonRefactorSemanticArtifact({
    schemaVersion: "kp.python-refactor-semantics.v1",
    contractId: contract.id,
    revisions: [
      compileRevision("before", before, binding.bindings),
      compileRevision("after", after, binding.bindings)
    ]
  });
}

function compileRevision(
  revision: "before" | "after",
  frontend: KpPythonFrontendResult,
  bindings: readonly KpPythonSemanticSyntaxBinding[]
): KpPythonRefactorSemanticArtifactV1["revisions"][number] {
  if (frontend.status !== "accepted") {
    throw new Error(
      `Cannot compile ${revision} Python semantics: ${frontend.diagnostics.map(({ message }) => message).join("; ")}`
    );
  }
  const specifications = kpPythonFreeShippingRefactorContract.entities
    .filter((entity) => entity.revision === revision);

  return {
    revision,
    path: frontend.path,
    revisionId: frontend.revisionId,
    sourceText: frontend.sourceText,
    tokens: createKpPythonSourceTokens(frontend.tokens),
    entities: specifications.map((specification) =>
      compileEntity(frontend, specification, bindings)
    )
  };
}

function compileEntity(
  frontend: KpPythonFrontendResult,
  specification: KpPythonRefactorEntityContract,
  bindings: readonly KpPythonSemanticSyntaxBinding[]
): KpPythonSemanticEntity {
  const binding = one(bindings.filter(({ semanticEntityId, revision }) =>
    semanticEntityId === specification.id && revision === specification.revision
  ), specification.id);
  const record = one(frontend.syntax.filter(({ id }) =>
    id === binding.syntaxRecordId
  ), specification.id);
  const owner = specification.ownerEntityId === undefined
    ? undefined
    : kpPythonFreeShippingRefactorContract.entities.find(({ id }) =>
      id === specification.ownerEntityId
    );
  const scopeId = owner === undefined
    ? `scope.${specification.revision}.module`
    : `scope.${specification.revision}.${owner.label}`;

  return {
    id: specification.id,
    revision: specification.revision,
    kind: specification.kind,
    label: specification.label,
    syntaxRecordId: record.id,
    scopeId,
    ...(binding.declarationEntityId === undefined
      ? {}
      : { declarationId: binding.declarationEntityId }),
    sourceRange: {
      path: frontend.path,
      revisionId: frontend.revisionId,
      startOffset: record.startOffset,
      endOffset: record.endOffset,
      start: { ...record.start },
      end: { ...record.end }
    }
  };
}

function one<T>(
  records: readonly T[],
  semanticId: string
): T {
  if (records.length !== 1) {
    throw new Error(
      `Python semantic entity ${semanticId} requires exactly one syntax record; received ${records.length}.`
    );
  }
  return records[0]!;
}
