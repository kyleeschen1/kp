import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  defineKpExpressionNodeProtocol,
  defineKpExpressionProjection,
  listKpExpressionNodes,
  projectKpExpressionTree
} from "../src/semantic/expression-node-protocol.ts";
import {
  kpLogExponentExpressionProtocol,
  renderKpLogExponentExpressionNodeLatex
} from "../src/semantic/log-exponent-expression-protocol.ts";
import {
  kpCanonicalLogExponentSolveStates
} from "../src/semantic/log-exponent-solve-states.ts";
import {
  kpLogProductExpressionProtocol
} from "../src/semantic/log-product-expression-protocol.ts";
import {
  kpCanonicalLogProductStates
} from "../src/semantic/log-product-states.ts";
import {
  kpLogQuotientExpressionProtocol,
  labelKpLogQuotientExpressionNode,
  renderKpLogQuotientExpressionNodeLatex
} from "../src/semantic/log-quotient-expression-protocol.ts";
import {
  kpCanonicalLogQuotientStates
} from "../src/semantic/log-quotient-states.ts";

type TinyNode =
  | { readonly id: string; readonly kind: "leaf"; readonly value: string }
  | { readonly id: string; readonly kind: "pair"; readonly children: readonly TinyNode[] };

type SyntheticNode =
  | { readonly id: string; readonly kind: "atom" }
  | { readonly id: string; readonly kind: "application"; readonly callee: SyntheticNode; readonly arguments: readonly SyntheticNode[] };

test("typed expression protocols own structure independently from projections", () => {
  const protocol = defineKpExpressionNodeProtocol<TinyNode>({
    id: "test.tiny.structure.v1",
    kinds: ["leaf", "pair"],
    handlers: {
      leaf: { children: () => [] },
      pair: { children: (node) => node.children }
    }
  });
  const text = defineKpExpressionProjection<TinyNode, string>({
    id: "test.tiny.text.v1",
    protocol,
    handlers: {
      leaf: { project: (node) => node.value },
      pair: { project: (_node, children) => `(${children.join(",")})` }
    }
  });
  const root: TinyNode = {
    id: "root",
    kind: "pair",
    children: [{ id: "a", kind: "leaf", value: "a" }]
  };

  assert.equal(projectKpExpressionTree(root, protocol, text), "(a)");
  assert.deepEqual(listKpExpressionNodes(root, protocol).map(({ id }) => id), [
    "root",
    "a"
  ]);
  assert.equal(Object.isFrozen(protocol), true);
  assert.equal(Object.isFrozen(protocol.children(root)), true);
});

test("protocol definitions reject runtime handler drift", () => {
  assert.throws(
    () => defineKpExpressionNodeProtocol<TinyNode>({
      id: "test.invalid.structure.v1",
      kinds: ["leaf", "pair"],
      handlers: {
        leaf: { children: () => [] },
        pair: {
          children: (
            node: Extract<TinyNode, { readonly kind: "pair" }>
          ) => node.children
        },
        unexpected: { children: () => [] }
      } as never
    }),
    /must handle every declared node kind exactly once/u
  );
});

test("a synthetic node kind extends traversal without changing walker core", () => {
  const protocol = defineKpExpressionNodeProtocol<SyntheticNode>({
    id: "test.synthetic-application.structure.v1",
    kinds: ["atom", "application"],
    handlers: {
      atom: { children: () => [] },
      application: {
        children: (node) => [node.callee, ...node.arguments]
      }
    }
  });
  const root: SyntheticNode = {
    id: "call",
    kind: "application",
    callee: { id: "fn", kind: "atom" },
    arguments: [
      { id: "x", kind: "atom" },
      { id: "y", kind: "atom" }
    ]
  };

  assert.deepEqual(
    listKpExpressionNodes(root, protocol).map(({ id }) => id),
    ["call", "fn", "x", "y"]
  );
});

test("each log family composes an isolated structural capability pack", () => {
  const exponent = kpCanonicalLogExponentSolveStates[3]!;
  const product = kpCanonicalLogProductStates[0]!;
  const quotient = kpCanonicalLogQuotientStates[1]!;

  assert.equal(
    renderKpLogExponentExpressionNodeLatex(exponent.equation),
    exponent.latex
  );
  assert.equal(
    renderKpLogQuotientExpressionNodeLatex(quotient.root),
    quotient.latex
  );
  assert.equal(
    listKpExpressionNodes(product.root, kpLogProductExpressionProtocol).length,
    7
  );
  assert.equal(
    kpLogExponentExpressionProtocol.children(exponent.equation).length,
    2
  );
  assert.equal(
    kpLogQuotientExpressionProtocol.children(quotient.root).length,
    4
  );
  assert.equal(labelKpLogQuotientExpressionNode(quotient.root), "natural-log-wrapper");
});

test("the protocol kernel and family packs preserve an explicit import boundary", () => {
  const kernel = source("src/semantic/expression-node-protocol.ts");
  assert.doesNotMatch(kernel, /log-(?:product|quotient|exponent)/u);

  const families = ["log-product", "log-quotient", "log-exponent"] as const;
  for (const family of families) {
    const pack = source(`src/semantic/${family}-expression-protocol.ts`);
    for (const sibling of families.filter((candidate) => candidate !== family)) {
      assert.doesNotMatch(
        pack,
        new RegExp(`from ["'][^"']*${sibling}`, "u"),
        `${family} protocol imports sibling family ${sibling}`
      );
    }
  }
});

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
