import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFunctionWrapInvocationGroup,
  createKpFunctionWrapInvocationGroupReception,
  isKpCompiledFunctionWrapInvocationGroup
} from "../src/animation/function-wrap-invocation.ts";

const group = compileKpFunctionWrapInvocationGroup({
  id: "transformation.test.apply-function-both-sides",
  branches: [
    {
      id: "left",
      semanticObjectId: "state.target",
      sourceArgumentEntityIds: ["source.left"],
      targetArgumentEntityIds: ["target.left.argument"],
      functionEntityIds: ["target.left.function"],
      enclosureEntityRoles: [
        { entityId: "target.left.open", side: "leading" },
        { entityId: "target.left.close", side: "trailing" }
      ]
    },
    {
      id: "right",
      semanticObjectId: "state.target",
      sourceArgumentEntityIds: ["source.right"],
      targetArgumentEntityIds: ["target.right.argument"],
      functionEntityIds: ["target.right.function"],
      enclosureEntityRoles: []
    }
  ]
});

test("one invocation group compiles synchronized wrapped and bare applications", () => {
  assert.equal(isKpCompiledFunctionWrapInvocationGroup(group), true);
  assert.equal(group.motifId, "motif.function-wrap.v1");
  assert.equal(group.operationKind, "operation.wrap-function.v1");
  assert.equal(group.recipeId, "recipe.equation.function-application.v1");
  assert.equal(
    group.branches[0]?.compiledInvocation.registryAuthority,
    group.branches[1]?.compiledInvocation.registryAuthority
  );
  assert.deepEqual(
    group.branches.map(({ compiledInvocation }) =>
      compiledInvocation.compiledMotifPlan.roleBindings.map(
        ({ roleId, entities }) => [roleId, entities.map(({ entityId }) => entityId)]
      )
    ),
    [
      [
        ["argument", ["target.left.argument"]],
        ["function", ["target.left.function"]],
        ["leading-enclosure", ["target.left.open"]],
        ["trailing-enclosure", ["target.left.close"]]
      ],
      [
        ["argument", ["target.right.argument"]],
        ["function", ["target.right.function"]],
        ["leading-enclosure", []],
        ["trailing-enclosure", []]
      ]
    ]
  );
  assert.deepEqual(
    createKpFunctionWrapInvocationGroupReception({
      group,
      direction: "forward"
    }).branches.map(({ id, enclosureEntityRoles }) => [
      id,
      enclosureEntityRoles
    ]),
    [
      [
        "left",
        [
          { entityId: "target.left.open", side: "leading" },
          { entityId: "target.left.close", side: "trailing" }
        ]
      ],
      ["right", []]
    ]
  );
});

test("copied groups cannot claim compiler authority", () => {
  assert.equal(isKpCompiledFunctionWrapInvocationGroup({ ...group }), false);
  assert.throws(
    () => createKpFunctionWrapInvocationGroupReception({
      group: { ...group },
      direction: "forward"
    }),
    /compiler-minted invocation group/
  );
});

test("groups fail closed on unpaired arguments and duplicate ownership", () => {
  assert.throws(
    () => compileKpFunctionWrapInvocationGroup({
      id: "invalid.unpaired",
      branches: [{
        id: "left",
        semanticObjectId: "state.target",
        sourceArgumentEntityIds: ["source.a", "source.b"],
        targetArgumentEntityIds: ["target.a"],
        functionEntityIds: ["target.function"],
        enclosureEntityRoles: []
      }]
    }),
    /paired source and target arguments/
  );
  assert.throws(
    () => compileKpFunctionWrapInvocationGroup({
      id: "invalid.duplicate",
      branches: [{
        id: "left",
        semanticObjectId: "state.target",
        sourceArgumentEntityIds: ["source.a"],
        targetArgumentEntityIds: ["target.a"],
        functionEntityIds: ["target.a"],
        enclosureEntityRoles: []
      }]
    }),
    /already owned/
  );
  assert.throws(
    () => compileKpFunctionWrapInvocationGroup({
      id: "invalid.unpaired-enclosure",
      branches: [{
        id: "left",
        semanticObjectId: "state.target",
        sourceArgumentEntityIds: ["source.a"],
        targetArgumentEntityIds: ["target.a"],
        functionEntityIds: ["target.function"],
        enclosureEntityRoles: [
          { entityId: "target.open", side: "leading" },
          { entityId: "target.open", side: "trailing" }
        ]
      }]
    }),
    /distinct leading then trailing enclosure entities/
  );
});
