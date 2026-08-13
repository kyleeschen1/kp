import {
  kpPythonFreeShippingRefactorContract,
  type KpPythonRefactorEntityContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";
import {
  defineKpPythonRefactorSemanticArtifact,
  type KpPythonRefactorSemanticArtifactV1,
  type KpPythonSemanticEntity
} from "../src/semantic/python-refactor-semantic-model.ts";
import {
  compileKpPythonFrontend,
  type KpPythonFrontendResult,
  type KpPythonSyntaxRecord
} from "./python-refactor-frontend.ts";

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

  return defineKpPythonRefactorSemanticArtifact({
    schemaVersion: "kp.python-refactor-semantics.v1",
    contractId: contract.id,
    revisions: [
      compileRevision("before", before),
      compileRevision("after", after)
    ]
  });
}

function compileRevision(
  revision: "before" | "after",
  frontend: KpPythonFrontendResult
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
    entities: specifications.map((specification) =>
      compileEntity(frontend, specification)
    )
  };
}

function compileEntity(
  frontend: KpPythonFrontendResult,
  specification: KpPythonRefactorEntityContract
): KpPythonSemanticEntity {
  const record = resolveRecord(frontend, specification);
  const enclosingFunction = specification.kind === "source-file"
    ? undefined
    : findAncestor(frontend, record, "FunctionDef");
  const scopeId = enclosingFunction === undefined
    ? `scope.${specification.revision}.module`
    : `scope.${specification.revision}.${functionName(enclosingFunction)}`;
  const declarationId = specification.kind === "call-site"
    ? "function.qualifies.after"
    : specification.kind === "expression" && enclosingFunction !== undefined
      ? functionEntityId(specification.revision, functionName(enclosingFunction))
      : undefined;

  return {
    id: specification.id,
    revision: specification.revision,
    kind: specification.kind,
    label: specification.label,
    syntaxRecordId: record.id,
    scopeId,
    ...(declarationId === undefined ? {} : { declarationId }),
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

function resolveRecord(
  frontend: KpPythonFrontendResult,
  specification: KpPythonRefactorEntityContract
): KpPythonSyntaxRecord {
  if (specification.kind === "source-file") {
    return one(frontend.syntax.filter(({ kindName }) => kindName === "Module"), specification.id);
  }
  if (specification.kind === "function") {
    return one(frontend.syntax.filter(({ kindName, text }) =>
      kindName === "FunctionDef" && functionNameFromText(text) === specification.label
    ), specification.id);
  }
  const owner = ownerFunctionName(specification.id);
  const kindName = specification.kind === "expression" ? "Compare" : "Call";
  return one(frontend.syntax.filter(({ kindName: candidateKind, text }) =>
    candidateKind === kindName && text === specification.label
  ).filter((record) => {
    const ancestor = findAncestor(frontend, record, "FunctionDef");
    return ancestor !== undefined && functionName(ancestor) === owner;
  }), specification.id);
}

function findAncestor(
  frontend: KpPythonFrontendResult,
  record: KpPythonSyntaxRecord,
  kindName: string
): KpPythonSyntaxRecord | undefined {
  const byId = new Map(frontend.syntax.map((candidate) => [candidate.id, candidate]));
  let current = record.parentId === undefined ? undefined : byId.get(record.parentId);
  while (current !== undefined) {
    if (current.kindName === kindName) return current;
    current = current.parentId === undefined ? undefined : byId.get(current.parentId);
  }
  return undefined;
}

function functionName(record: KpPythonSyntaxRecord): string {
  const name = functionNameFromText(record.text);
  if (name === undefined) throw new Error(`Function syntax ${record.id} has no name.`);
  return name;
}

function functionNameFromText(text: string): string | undefined {
  return /^def\s+([A-Za-z_]\w*)\s*\(/.exec(text)?.[1];
}

function ownerFunctionName(entityId: string): string {
  if (entityId.includes("shipping-cost")) return "shipping_cost";
  if (entityId.includes("shipping-message")) return "shipping_message";
  if (entityId.includes("qualifies")) return "qualifies_for_free_shipping";
  throw new Error(`No declared Python owner function for ${entityId}.`);
}

function functionEntityId(revision: "before" | "after", name: string): string {
  if (name === "shipping_cost") return `function.shipping-cost.${revision}`;
  if (name === "shipping_message") return `function.shipping-message.${revision}`;
  if (name === "qualifies_for_free_shipping") return "function.qualifies.after";
  throw new Error(`No Python semantic function id for ${name}.`);
}

function one(
  records: readonly KpPythonSyntaxRecord[],
  semanticId: string
): KpPythonSyntaxRecord {
  if (records.length !== 1) {
    throw new Error(
      `Python semantic entity ${semanticId} requires exactly one syntax record; received ${records.length}.`
    );
  }
  return records[0]!;
}
