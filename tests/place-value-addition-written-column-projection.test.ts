import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpPlaceValueSemanticFoundation
} from "../src/architecture/place-value-addition-semantic-foundation.ts";
import {
  compileKpPlaceValueWrittenColumnProjection,
  isKpPlaceValueWrittenColumnProjection,
  type KpPlaceValueWrittenColumnProjection
} from "../src/reader/compiler/place-value-addition-written-column-projection.ts";

test("written projection fixes the conventional row and column topology", () => {
  const projection = compileKpPlaceValueWrittenColumnProjection();

  assert.deepEqual(projection.rows, [
    "carry",
    "first-addend",
    "second-addend",
    "underline",
    "result"
  ]);
  assert.deepEqual(projection.columns, [
    "operator",
    "hundreds",
    "tens",
    "ones"
  ]);
  assert.deepEqual(
    projection.cells.map(({ semanticEntityId, row, column, latex }) => ({
      semanticEntityId,
      row,
      column,
      latex
    })),
    [
      {
        semanticEntityId: "digit.first.hundreds",
        row: "first-addend",
        column: "hundreds",
        latex: "2"
      },
      {
        semanticEntityId: "digit.first.tens",
        row: "first-addend",
        column: "tens",
        latex: "7"
      },
      {
        semanticEntityId: "digit.first.ones",
        row: "first-addend",
        column: "ones",
        latex: "8"
      },
      {
        semanticEntityId: "operator.add",
        row: "second-addend",
        column: "operator",
        latex: "+"
      },
      {
        semanticEntityId: "digit.second.hundreds",
        row: "second-addend",
        column: "hundreds",
        latex: "1"
      },
      {
        semanticEntityId: "digit.second.tens",
        row: "second-addend",
        column: "tens",
        latex: "5"
      },
      {
        semanticEntityId: "digit.second.ones",
        row: "second-addend",
        column: "ones",
        latex: "6"
      },
      {
        semanticEntityId: "carry.tens",
        row: "carry",
        column: "tens",
        latex: "1"
      },
      {
        semanticEntityId: "carry.hundreds",
        row: "carry",
        column: "hundreds",
        latex: "1"
      },
      {
        semanticEntityId: "result.hundreds",
        row: "result",
        column: "hundreds",
        latex: "4"
      },
      {
        semanticEntityId: "result.tens",
        row: "result",
        column: "tens",
        latex: "3"
      },
      {
        semanticEntityId: "result.ones",
        row: "result",
        column: "ones",
        latex: "4"
      }
    ]
  );
});

test("each glyph is an unspaced native KaTeX root with stable ownership", () => {
  const projection = compileKpPlaceValueWrittenColumnProjection();

  assert.equal(new Set(projection.cells.map(({ id }) => id)).size, 12);
  for (const cell of projection.cells) {
    assert.equal(cell.latex, cell.latex.trim());
    assert.equal(cell.latex.length, 1);
    assert.equal(cell.nativeOwner, "native-katex");
    assert.equal(cell.endpointOwnership, "same-root-native-dom");
    assert.match(cell.nativeHtmlAndMathml, /class="katex"/);
    assert.match(cell.nativeHtmlAndMathml, /class="katex-mathml"/);
    assert.match(cell.nativeHtmlAndMathml, /class="katex-html"/);
  }
  assert.ok(
    projection.cells
      .filter(({ role }) => role === "carry-digit")
      .every(({ mathStyle, renderedLatex }) =>
        mathStyle === "script" && renderedLatex.startsWith("\\scriptstyle")
      )
  );
});

test("plus, underline, carry, and result occupy their fixed semantic slots", () => {
  const projection = compileKpPlaceValueWrittenColumnProjection();
  const plus = projection.cells.find(
    ({ semanticEntityId }) => semanticEntityId === "operator.add"
  );

  assert.deepEqual(
    plus === undefined
      ? undefined
      : { row: plus.row, column: plus.column, role: plus.role },
    {
      row: "second-addend",
      column: "operator",
      role: "operator"
    }
  );
  assert.deepEqual(projection.underline, {
    id: "rule.addition.underline",
    semanticEntityId: "rule.addition.underline",
    row: "underline",
    fromColumn: "operator",
    throughColumn: "ones",
    nativeOwner: "semantic-grid-dom",
    measurementAuthority: "native-painted-dom"
  });
  assert.equal(
    projection.cells
      .filter(({ role }) => role === "result-digit")
      .map(({ latex }) => latex)
      .join(""),
    "434"
  );
});

test("projection contains policy, not example-specific geometry", () => {
  const projection = compileKpPlaceValueWrittenColumnProjection();

  assert.deepEqual(projection.layoutContract, {
    topologyOwner: "semantic-grid",
    columnSizing: "native-max-content",
    horizontalAlignment: "right-aligned-place-columns",
    rowBaselinePolicy: "native-row-baseline",
    measurementAuthority: "native-painted-dom",
    endpointTransformPolicy: "none",
    authoredCoordinates: false,
    perDigitOffsets: false,
    globalScaleFallback: false
  });
  const forbiddenGeometryKeys = new Set([
    "x",
    "y",
    "left",
    "top",
    "width",
    "height",
    "transform",
    "scale",
    "offset"
  ]);
  const visit = (value: unknown): void => {
    if (typeof value !== "object" || value === null) return;
    for (const [key, nested] of Object.entries(value)) {
      assert.equal(
        forbiddenGeometryKeys.has(key),
        false,
        `projection authored forbidden geometry key ${key}`
      );
      visit(nested);
    }
  };
  visit(projection);
});

test("only a sealed semantic foundation can mint the written projection", () => {
  const projection = compileKpPlaceValueWrittenColumnProjection(
    certifyKpPlaceValueSemanticFoundation()
  );
  assert.equal(isKpPlaceValueWrittenColumnProjection(projection), true);
  assert.equal(projection.promotionStatus, "not-promoted");

  assert.throws(
    () => compileKpPlaceValueWrittenColumnProjection({
      ...certifyKpPlaceValueSemanticFoundation()
    } as KpVerifiedFoundationCopy),
    /sealed place-value semantic foundation/
  );
});

test("static types reject raw projection authority", () => {
  if (false as boolean) {
    // @ts-expect-error Only the compiler can mint the projection brand.
    const copied: KpPlaceValueWrittenColumnProjection = {
      schemaVersion:
        "kp.place-value-addition-written-column-projection.v1"
    };
    assert.ok(copied);
  }
  assert.equal(
    compileKpPlaceValueWrittenColumnProjection().status,
    "ready-for-runtime-binding"
  );
});

type KpVerifiedFoundationCopy = Parameters<
  typeof compileKpPlaceValueWrittenColumnProjection
>[0];
