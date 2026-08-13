import {
  kpTypeScriptFreeShippingRefactorContract,
  type KpTypeScriptRefactorEntityContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import {
  defineKpTypeScriptRefactorSemanticArtifact,
  type KpTypeScriptRefactorSemanticArtifactV1,
  type KpTypeScriptSemanticEntity
} from "../src/semantic/typescript-refactor-semantic-model.ts";
import {
  compileKpTypeScriptFrontend,
  type KpTypeScriptFrontendResult,
  type KpTypeScriptSyntaxRecord
} from "./typescript-refactor-frontend.ts";

export function compileKpTypeScriptRefactorSemantics():
  KpTypeScriptRefactorSemanticArtifactV1 {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const before = compileKpTypeScriptFrontend({
    path: contract.before.path,
    revisionId: contract.before.revisionId,
    sourceText: contract.before.source
  });
  const after = compileKpTypeScriptFrontend({
    path: contract.after.path,
    revisionId: contract.after.revisionId,
    sourceText: contract.after.source
  });

  return defineKpTypeScriptRefactorSemanticArtifact({
    schemaVersion: "kp.typescript-refactor-semantics.v1",
    contractId: contract.id,
    revisions: [
      compileRevision("before", before),
      compileRevision("after", after)
    ]
  });
}

function compileRevision(
  revision: "before" | "after",
  frontend: KpTypeScriptFrontendResult
): KpTypeScriptRefactorSemanticArtifactV1["revisions"][number] {
  if (frontend.status !== "accepted") {
    throw new Error(
      `Cannot compile ${revision} TypeScript semantics: ${frontend.diagnostics.map(({ message }) => message).join("; ")}`
    );
  }
  const specifications = kpTypeScriptFreeShippingRefactorContract.entities
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
  frontend: KpTypeScriptFrontendResult,
  specification: KpTypeScriptRefactorEntityContract
): KpTypeScriptSemanticEntity {
  const record = resolveRecord(frontend, specification);
  const enclosingFunction = specification.kind === "source-file"
    ? undefined
    : findAncestor(frontend, record, "FunctionDeclaration");
  const scopeId = enclosingFunction === undefined
    ? `scope.${specification.revision}.module`
    : `scope.${specification.revision}.${functionName(enclosingFunction)}`;
  const declarationId = specification.kind === "call-site"
    ? "function.qualifies.after"
    : specification.kind === "expression"
      ? enclosingFunction === undefined
        ? undefined
        : functionEntityId(specification.revision, functionName(enclosingFunction))
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
  frontend: KpTypeScriptFrontendResult,
  specification: KpTypeScriptRefactorEntityContract
): KpTypeScriptSyntaxRecord {
  if (specification.kind === "source-file") {
    return one(frontend.syntax.filter(({ kindName }) => kindName === "SourceFile"), specification.id);
  }
  if (specification.kind === "function") {
    return one(frontend.syntax.filter(({ kindName, text }) =>
      kindName === "FunctionDeclaration" &&
      functionNameFromText(text) === specification.label
    ), specification.id);
  }
  const owner = ownerFunctionName(specification.id);
  const candidates = frontend.syntax.filter(({ kindName, text }) =>
    kindName === (specification.kind === "expression"
      ? "BinaryExpression"
      : "CallExpression") &&
    text === specification.label
  ).filter((record) => {
    const ancestor = findAncestor(frontend, record, "FunctionDeclaration");
    return ancestor !== undefined && functionName(ancestor) === owner;
  });
  return one(candidates, specification.id);
}

function findAncestor(
  frontend: KpTypeScriptFrontendResult,
  record: KpTypeScriptSyntaxRecord,
  kindName: string
): KpTypeScriptSyntaxRecord | undefined {
  const byId = new Map(frontend.syntax.map((candidate) => [candidate.id, candidate]));
  let current = record.parentId === undefined ? undefined : byId.get(record.parentId);
  while (current !== undefined) {
    if (current.kindName === kindName) return current;
    current = current.parentId === undefined ? undefined : byId.get(current.parentId);
  }
  return undefined;
}

function functionName(record: KpTypeScriptSyntaxRecord): string {
  const name = functionNameFromText(record.text);
  if (name === undefined) {
    throw new Error(`Function syntax ${record.id} has no named declaration.`);
  }
  return name;
}

function functionNameFromText(text: string): string | undefined {
  return /(?:export\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(text)?.[1];
}

function ownerFunctionName(entityId: string): string {
  if (entityId.includes("shipping-cost")) return "shippingCost";
  if (entityId.includes("shipping-message")) return "shippingMessage";
  if (entityId.includes("qualifies")) return "qualifiesForFreeShipping";
  throw new Error(`No declared owner function for ${entityId}.`);
}

function functionEntityId(revision: "before" | "after", name: string): string {
  if (name === "shippingCost") return `function.shipping-cost.${revision}`;
  if (name === "shippingMessage") return `function.shipping-message.${revision}`;
  if (name === "qualifiesForFreeShipping") return "function.qualifies.after";
  throw new Error(`No semantic function id for ${name}.`);
}

function one(
  records: readonly KpTypeScriptSyntaxRecord[],
  semanticId: string
): KpTypeScriptSyntaxRecord {
  if (records.length !== 1) {
    throw new Error(
      `Semantic entity ${semanticId} requires exactly one syntax record; received ${records.length}.`
    );
  }
  return records[0]!;
}
