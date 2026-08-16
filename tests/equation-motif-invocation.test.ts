import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  compileKpMotifInvocation,
  createKpMotifEntityBinding,
  createKpMotifInvocation,
  defineKpMotifSchema,
  isKpCompiledMotifPlan,
  type KpMotifInvocation
} from "../src/domain-ir/equation-motif-invocation.ts";
import {
  createKpOperationKind,
  kpCanonicalEquationMotionVocabulary
} from "../src/domain-ir/equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;
const functionWrapSchema = defineKpMotifSchema({
  id: vocabulary.motifs.functionWrapV1,
  familyId: vocabulary.families.structuralWrapV1,
  operationKinds: [vocabulary.operations.wrapFunctionV1],
  roles: [
    { id: "continuant", cardinality: "one-or-more", materialKind: "continuant" },
    { id: "syntax", cardinality: "one-or-more", materialKind: "syntax" },
    { id: "leading-enclosure", cardinality: "exactly-one", materialKind: "enclosure" },
    { id: "trailing-enclosure", cardinality: "exactly-one", materialKind: "enclosure" }
  ],
  requiredRendererCapabilityIds: [
    vocabulary.rendererCapabilities.nativeKatexV1
  ]
});

const invocation = createKpMotifInvocation(functionWrapSchema, {
  id: "invocation.function-wrap.test",
  motifId: vocabulary.motifs.functionWrapV1,
  operationKind: vocabulary.operations.wrapFunctionV1,
  roleBindings: {
    continuant: [entity("factor.x")],
    syntax: [entity("function.ln")],
    "leading-enclosure": [entity("paren.leading")],
    "trailing-enclosure": [entity("paren.trailing")]
  }
});

test("role-complete invocation compiles to a minted renderer-neutral plan", () => {
  const result = compileKpMotifInvocation({
    schema: functionWrapSchema,
    invocation,
    rendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(isKpCompiledMotifPlan(result.plan), true);
  assert.equal(result.plan.rendererNeutral, true);
  assert.deepEqual(
    result.plan.roleBindings.map(({ roleId }) => roleId),
    functionWrapSchema.roles.map(({ id }) => id)
  );
  assert.equal(Object.isFrozen(result.plan.roleBindings), true);
});

test("invocations fail closed on missing and unknown roles", () => {
  const malformed = {
    ...invocation,
    roleBindings: {
      continuant: [entity("factor.x")],
      syntax: [entity("function.ln")],
      "leading-enclosure": [entity("paren.leading")],
      projectRole: [entity("project.local")]
    }
  } as unknown as KpMotifInvocation;
  const result = compileKpMotifInvocation({
    schema: functionWrapSchema,
    invocation: malformed,
    rendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
  });
  assert.equal(result.status, "invalid");
  assert.deepEqual(
    result.diagnostics.map(({ code }) => code),
    ["motif.invocation.missing-role", "motif.invocation.unknown-role"]
  );
});

test("duplicate semantic owners and unsupported capabilities are explicit diagnostics", () => {
  const duplicate = {
    ...invocation,
    roleBindings: {
      ...invocation.roleBindings,
      syntax: [entity("factor.x")]
    }
  } as KpMotifInvocation;
  const result = compileKpMotifInvocation({
    schema: functionWrapSchema,
    invocation: duplicate,
    rendererCapabilityIds: []
  });
  assert.equal(result.status, "invalid");
  assert.deepEqual(
    result.diagnostics.map(({ code }) => code),
    [
      "motif.invocation.duplicate-owner",
      "motif.invocation.unsupported-capability"
    ]
  );
});

test("motif and operation mismatches cannot fall back to a visual guess", () => {
  const wrongOperation = {
    ...invocation,
    operationKind: createKpOperationKind("operation.project-local.v1")
  } as KpMotifInvocation;
  const result = compileKpMotifInvocation({
    schema: functionWrapSchema,
    invocation: wrongOperation,
    rendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
  });
  assert.equal(result.status, "invalid");
  assert.deepEqual(
    result.diagnostics.map(({ code }) => code),
    ["motif.invocation.unsupported-operation"]
  );
});

test("motif protocol owns no timing, geometry, DOM, or renderer resources", () => {
  const source = readFileSync(fileURLToPath(new URL(
    "../src/domain-ir/equation-motif-invocation.ts",
    import.meta.url
  )), "utf8");
  assert.doesNotMatch(
    source,
    /\b(?:HTMLElement|DOMRect|requestAnimationFrame|durationMs|translateX|KaTeX|SVGElement|WebGL)\b/
  );
});

function entity(entityId: string) {
  return createKpMotifEntityBinding({
    entityId,
    semanticObjectId: `semantic.${entityId}`
  });
}

createKpMotifInvocation(functionWrapSchema, {
  id: "invocation.incomplete",
  motifId: vocabulary.motifs.functionWrapV1,
  operationKind: vocabulary.operations.wrapFunctionV1,
  // @ts-expect-error The typed constructor requires every declared role.
  roleBindings: {
    continuant: [entity("factor.x")],
    syntax: [entity("function.ln")],
    "leading-enclosure": [entity("paren.leading")]
  }
});
