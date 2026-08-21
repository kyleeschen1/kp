import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpRootRewriteNativeEndpoint,
  kpRootRewriteEndpointNodeProtocol,
  type KpRootRewriteEndpointExpressionNode
} from "../src/rendering/root-rewrite-native-endpoint.ts";
import type { KpRootRewriteOccurrence } from
  "../src/semantic/root-rewrite-plan.ts";

test("compound radical source preserves every recursive semantic occurrence", () => {
  const endpoint = createKpRootRewriteNativeEndpoint({
    endpoint: "source",
    stateId: "state.root.compound.source",
    accessibleText: "the square root of the square of x plus one",
    root: sourceTree()
  });
  assert.equal(endpoint.annotated.rawLatex, "\\sqrt{(x+1)^{2}}");
  assert.equal(endpoint.nodes.length, 9);
  assert.equal(endpoint.annotated.annotations.length, endpoint.nodes.length);
  assert.match(endpoint.nativeHtmlAndMathml, /data-kp-motion-id/u);
  const byId = new Map(endpoint.nodes.map((node) =>
    [node.occurrence.entityId, node]
  ));
  assert.equal(byId.get("source.carrier")?.parentEntityId, "source.group");
  assert.equal(byId.get("source.x")?.parentEntityId, "source.carrier");
  assert.equal(byId.get("source.exponent")?.parentEntityId, "source.power");
  assert.equal(byId.get("source.radicand")?.parentEntityId, "source.radical");
});

test("target absolute value retains the compound carrier and child identities", () => {
  const source = createKpRootRewriteNativeEndpoint({
    endpoint: "source",
    stateId: "state.root.compound.source",
    accessibleText: "source",
    root: sourceTree()
  });
  const target = createKpRootRewriteNativeEndpoint({
    endpoint: "target",
    stateId: "state.root.compound.target",
    accessibleText: "the absolute value of x plus one",
    root: targetTree()
  });
  assert.equal(target.annotated.rawLatex,
    "\\left\\lvert x+1\\right\\rvert");
  const semanticIds = (endpoint: typeof source) => new Map(
    endpoint.nodes.map(({ occurrence }) =>
      [occurrence.entityId, occurrence.semanticId])
  );
  const sourceIds = semanticIds(source);
  const targetIds = semanticIds(target);
  assert.equal(sourceIds.get("source.carrier"),
    targetIds.get("target.carrier"));
  assert.equal(sourceIds.get("source.x"), targetIds.get("target.x"));
  assert.equal(sourceIds.get("source.plus"), targetIds.get("target.plus"));
  assert.equal(sourceIds.get("source.one"), targetIds.get("target.one"));
});

test("endpoint protocol is exhaustive and registry driven", () => {
  assert.deepEqual(Object.keys(kpRootRewriteEndpointNodeProtocol), [
    "token",
    "sequence",
    "parenthesized",
    "power",
    "radical",
    "absolute-value"
  ]);
});

test("recursive endpoint rejects repeated ownership and privileged latex", () => {
  const repeated = token("repeated", "semantic.repeated", "x", "carrier");
  assert.throws(() => createKpRootRewriteNativeEndpoint({
    endpoint: "source",
    stateId: "state.root.repeated",
    accessibleText: "repeated",
    root: sequence("root", "semantic.root", [repeated, repeated], "expression")
  }), /repeat or cycle/u);
  assert.throws(() => createKpRootRewriteNativeEndpoint({
    endpoint: "source",
    stateId: "state.root.unsafe",
    accessibleText: "unsafe",
    root: token("unsafe", "semantic.unsafe",
      "\\htmlData{bad=yes}{x}", "carrier")
  }), /privileged authored LaTeX/u);
});

function sourceTree(): KpRootRewriteEndpointExpressionNode {
  const carrier = carrierTree("source");
  const group: KpRootRewriteEndpointExpressionNode = {
    kind: "parenthesized",
    occurrence: occurrence("source.group", "semantic.source-group",
      "subtree.source-group", "enclosure"),
    role: "enclosure",
    body: carrier
  };
  const exponent = token("source.exponent", "semantic.exponent.two", "2",
    "exponent");
  const power: KpRootRewriteEndpointExpressionNode = {
    kind: "power",
    occurrence: occurrence("source.power", "semantic.perfect-square",
      "subtree.source-power", "compound"),
    role: "radicand",
    base: group,
    exponent
  };
  const radicand: KpRootRewriteEndpointExpressionNode = {
    kind: "sequence",
    occurrence: occurrence("source.radicand", "semantic.perfect-square",
      "subtree.source-radicand", "compound"),
    role: "radicand",
    children: [power]
  };
  return {
    kind: "radical",
    occurrence: occurrence("source.radical", "semantic.operator.square-root",
      "subtree.source-radical", "operator"),
    role: "radical",
    radicand
  };
}

function targetTree(): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "absolute-value",
    occurrence: occurrence("target.absolute-value",
      "semantic.operator.absolute-value", "subtree.target-absolute-value",
      "enclosure"),
    role: "enclosure",
    body: carrierTree("target")
  };
}

function carrierTree(prefix: "source" | "target"):
  KpRootRewriteEndpointExpressionNode {
  return sequence(`${prefix}.carrier`, "semantic.x-plus-one", [
    token(`${prefix}.x`, "semantic.variable.x", "x", "carrier"),
    token(`${prefix}.plus`, "semantic.operator.plus", "+", "operator"),
    token(`${prefix}.one`, "semantic.value.one", "1", "value")
  ], "carrier", "subtree.x-plus-one");
}

function sequence(
  entityId: string,
  semanticId: string,
  children: readonly KpRootRewriteEndpointExpressionNode[],
  role: "expression" | "carrier",
  subtreeId = `subtree.${entityId}`
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "sequence",
    occurrence: occurrence(entityId, semanticId, subtreeId, "compound"),
    role,
    children
  };
}

function token(
  entityId: string,
  semanticId: string,
  latex: string,
  role: "carrier" | "operator" | "value" | "exponent"
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "token",
    occurrence: occurrence(entityId, semanticId, `subtree.${semanticId}`,
      role === "operator" ? "operator" : "atomic"),
    role,
    latex
  };
}

function occurrence(
  entityId: string,
  semanticId: string,
  subtreeId: string,
  subtreeKind: KpRootRewriteOccurrence["subtreeKind"]
): KpRootRewriteOccurrence {
  return { entityId, semanticId, subtreeId, subtreeKind };
}

