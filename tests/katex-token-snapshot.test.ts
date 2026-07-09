import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLocalTokenRect,
  normalizeKatexTokenText,
  normalizeKatexTokenSignature,
  assignKatexTokenRows,
  snapshotKatexTokens
} from "../src/rendering/katex-token-snapshot.ts";
import {
  fractionTransformFixtures,
  largeOperatorTransformFixtures,
  matrixTransformFixtures,
  radicalTransformFixtures,
  summarizeKatexTransformFixtureDiagnostics,
  scriptTransformFixtures,
  wrapperTransformFixtures
} from "../src/rendering/katex-transform-fixtures.ts";
import {
  katexVisualArtifactLifecycleRecords,
  summarizeVisualArtifactLifecycleRecord
} from "../src/rendering/visual-artifact-lifecycle.ts";
import type {
  KatexMotionToken,
  KatexTokenRect
} from "../src/rendering/katex-transition-types.ts";

test("normalizeKatexTokenText collapses whitespace and ignores empty content", () => {
  assert.equal(normalizeKatexTokenText("  x  "), "x");
  assert.equal(normalizeKatexTokenText("\n + \t"), "+");
  assert.equal(normalizeKatexTokenText("   "), "");
});

test("normalizeKatexTokenSignature keeps stable KaTeX class names", () => {
  assert.equal(
    normalizeKatexTokenSignature("mord mathnormal sizing reset-size6 size3"),
    "mathnormal mord size3"
  );
  assert.equal(normalizeKatexTokenSignature("mbin mspace"), "mbin mspace");
});

test("normalizeKatexTokenSignature ignores reset-size variants", () => {
  assert.equal(
    normalizeKatexTokenSignature("mord mathnormal reset-size12 sizing"),
    "mathnormal mord"
  );
});

test("createLocalTokenRect maps viewport rects into overlay-local coordinates", () => {
  assert.deepEqual(
    createLocalTokenRect(
      { left: 120, top: 80, width: 30, height: 14 },
      { left: 100, top: 50, width: 200, height: 120 }
    ),
    { left: 20, top: 30, width: 30, height: 14 }
  );
});

test("assignKatexTokenRows groups nearby token tops into row buckets", () => {
  const tokens: KatexMotionToken[] = [
    token("a", 10),
    token("b", 12),
    token("c", 38),
    token("d", 41)
  ];

  assert.deepEqual(
    assignKatexTokenRows(tokens, 6).map((entry) => [entry.id, entry.row]),
    [
      ["a", 0],
      ["b", 0],
      ["c", 1],
      ["d", 1]
    ]
  );
});

test("assignKatexTokenRows assigns row ids in visual top order", () => {
  const tokens: KatexMotionToken[] = [
    token("high-a", 40),
    token("low-a", 10),
    token("low-b", 12),
    token("high-b", 41)
  ];

  assert.deepEqual(
    assignKatexTokenRows(tokens, 6).map((entry) => [entry.id, entry.row]),
    [
      ["high-a", 1],
      ["low-a", 0],
      ["low-b", 0],
      ["high-b", 1]
    ]
  );
});

test("snapshotKatexTokens emits normalized motion leaf tokens", () => {
  const emitted = fakeElement("mord mathnormal reset-size12 sizing", "  x  ", {
    left: 130,
    top: 90,
    width: 12,
    height: 14
  });
  const candidates = [
    fakeElement("mord", "parent", rect(120, 80, 20, 14), [
      fakeElement("mord", "child", rect(121, 81, 5, 5))
    ]),
    fakeElement("not-motion", "z", rect(140, 90, 10, 10)),
    fakeElement("mord", "   ", rect(150, 90, 10, 10)),
    fakeElement("mord", "y", rect(160, 90, 0, 10)),
    emitted
  ];
  const queriedSelectors: string[] = [];
  const root = {
    getBoundingClientRect: () => rect(100, 50, 200, 120),
    querySelectorAll: (selector: string) => {
      queriedSelectors.push(selector);
      return candidates;
    }
  } as unknown as Element;

  const snapshot = snapshotKatexTokens(root);

  assert.deepEqual(queriedSelectors, [".katex-html span"]);
  assert.deepEqual(snapshot.bounds, rect(100, 50, 200, 120));
  assert.equal(snapshot.tokens.length, 1);
  assert.equal(snapshot.tokens[0]?.element, emitted);
  assert.deepEqual(snapshot.tokens[0], {
    id: "katex-token-2",
    text: "x",
    signature: "mathnormal mord",
    rect: rect(130, 90, 12, 14),
    localRect: rect(30, 40, 12, 14),
    row: 0,
    element: emitted
  });
});

test("snapshotKatexTokens emits structural KaTeX tokens", () => {
  const structuralElements = [
    fakeElement("frac-line", "", rect(130, 92, 38, 2)),
    fakeElement("hline", "", rect(130, 102, 38, 2)),
    fakeElement("hdashline", "", rect(130, 112, 38, 2)),
    fakeElement("mord rule", "", rect(130, 122, 20, 6)),
    fakeElement("hide-tail", "", rect(130, 132, 18, 20))
  ];
  const root = {
    getBoundingClientRect: () => rect(100, 50, 200, 120),
    querySelectorAll: () => structuralElements
  } as unknown as Element;

  const snapshot = snapshotKatexTokens(root);

  assert.deepEqual(
    snapshot.tokens.map((entry) => [entry.text, entry.signature]),
    [
      ["structural:frac-line", "frac-line"],
      ["structural:hline", "hline"],
      ["structural:hdashline", "hdashline"],
      ["structural:rule", "mord rule"],
      ["structural:hide-tail", "hide-tail"]
    ]
  );
});

test("fraction transform fixtures declare expected structural tokens", () => {
  assert.deepEqual(
    fractionTransformFixtures.map((fixture) => [
      fixture.id,
      fixture.intent,
      fixture.expectedStructuralTokens.source,
      fixture.expectedStructuralTokens.target
    ]),
    [
      [
        "fraction.make.inline-to-stacked",
        "makeFraction",
        [],
        ["structural:frac-line"]
      ],
      [
        "fraction.split.stacked-to-inline",
        "splitFraction",
        ["structural:frac-line"],
        []
      ],
      [
        "fraction.combine.common-denominator",
        "combineFractions",
        ["structural:frac-line", "structural:frac-line"],
        ["structural:frac-line"]
      ]
    ]
  );
});

test("script transform fixtures declare role-change geometry expectations", () => {
  assert.deepEqual(
    scriptTransformFixtures.map((fixture) => [
      fixture.id,
      fixture.intent,
      fixture.expectedStructuralTokens.source,
      fixture.expectedStructuralTokens.target,
      fixture.expectedRoleChanges.map((roleChange) => [
        roleChange.sourceRole,
        roleChange.targetRole
      ])
    ]),
    [
      [
        "script.combine-factor-as-power",
        "combineRepeatedFactorAsPower",
        [],
        [],
        [["factor", "superscript"]]
      ],
      [
        "script.expand-power-to-factor",
        "expandPower",
        [],
        [],
        [["superscript", "factor"]]
      ],
      [
        "script.change-subscript-index",
        "changeIndex",
        [],
        [],
        [["subscript", "subscript"]]
      ]
    ]
  );
});

test("radical transform fixtures declare SVG and rule artifact expectations", () => {
  assert.deepEqual(
    radicalTransformFixtures.map((fixture) => [
      fixture.id,
      fixture.intent,
      fixture.expectedStructuralTokens.source,
      fixture.expectedStructuralTokens.target
    ]),
    [
      [
        "radical.rewrite-power-as-root",
        "rewritePowerAsRoot",
        [],
        ["structural:hide-tail", "structural:sqrt-line"]
      ],
      [
        "radical.rewrite-root-as-power",
        "rewriteRootAsPower",
        ["structural:hide-tail", "structural:sqrt-line"],
        []
      ],
      [
        "radical.unwrap-indexed-root",
        "unwrapIndexedRoot",
        ["structural:hide-tail", "structural:sqrt-line"],
        []
      ]
    ]
  );
});

test("radical fixture diagnostics count structural artifact expectations", () => {
  assert.deepEqual(
    radicalTransformFixtures.map(summarizeKatexTransformFixtureDiagnostics),
    [
      {
        id: "radical.rewrite-power-as-root",
        family: "radical",
        sourceTokenCount: 3,
        targetTokenCount: 4,
        sourceStructuralTokenCount: 0,
        targetStructuralTokenCount: 2,
        roleChangeCount: 1
      },
      {
        id: "radical.rewrite-root-as-power",
        family: "radical",
        sourceTokenCount: 4,
        targetTokenCount: 3,
        sourceStructuralTokenCount: 2,
        targetStructuralTokenCount: 0,
        roleChangeCount: 1
      },
      {
        id: "radical.unwrap-indexed-root",
        family: "radical",
        sourceTokenCount: 6,
        targetTokenCount: 1,
        sourceStructuralTokenCount: 2,
        targetStructuralTokenCount: 0,
        roleChangeCount: 1
      }
    ]
  );
});

test("wrapper transform fixtures declare delimiter and function artifacts", () => {
  assert.deepEqual(
    wrapperTransformFixtures.map((fixture) => [
      fixture.id,
      fixture.intent,
      fixture.source.tokens
        .filter((token) => token.role === "artifact")
        .map((token) => token.text),
      fixture.target.tokens
        .filter((token) => token.role === "artifact")
        .map((token) => token.text)
    ]),
    [
      ["wrapper.parentheses.wrap", "wrapWithDelimiter", [], ["(", ")"]],
      ["wrapper.absolute-value.unwrap", "unwrapDelimiter", ["|", "|"], []],
      ["wrapper.norm.wrap", "wrapWithDelimiter", [], ["\\lVert", "\\rVert"]],
      ["wrapper.function.wrap", "wrapWithFunction", [], ["f", "(", ")"]]
    ]
  );
});

test("large-operator transform fixtures declare operators and limit geometry", () => {
  assert.deepEqual(
    largeOperatorTransformFixtures.map((fixture) => [
      fixture.id,
      fixture.intent,
      fixture.source.tokens
        .filter((token) => token.role === "large-operator")
        .map((token) => token.text),
      fixture.target.tokens
        .filter((token) => token.layoutRole === "upper-limit")
        .map((token) => token.text),
      fixture.target.tokens
        .filter((token) => token.layoutRole === "lower-limit")
        .map((token) => token.text),
      fixture.expectedRoleChanges.map((roleChange) => [
        roleChange.sourceRole,
        roleChange.targetRole,
        roleChange.sourceText,
        roleChange.targetText
      ])
    ]),
    [
      [
        "large-operator.sum.add-bounds",
        "addSummationBounds",
        ["\\sum"],
        ["n"],
        ["i=1"],
        []
      ],
      [
        "large-operator.product.change-bounds",
        "changeProductBounds",
        ["\\prod"],
        ["n-1"],
        ["i=0"],
        [
          ["upper-limit", "upper-limit", "n", "n-1"],
          ["lower-limit", "lower-limit", "i=1", "i=0"]
        ]
      ],
      [
        "large-operator.integral.add-bounds",
        "addIntegralBounds",
        ["\\int"],
        ["b"],
        ["a"],
        []
      ],
      [
        "large-operator.limit.change-approach",
        "changeLimitApproach",
        ["\\lim"],
        [],
        ["h \\to 0"],
        [["limit-approach", "limit-approach", "x \\to 0", "h \\to 0"]]
      ]
    ]
  );
});

test("matrix/vector transform fixtures declare bracket artifacts and entry selectors", () => {
  assert.deepEqual(
    matrixTransformFixtures.map((fixture) => [
      fixture.id,
      fixture.intent,
      fixture.source.tokens
        .filter(
          (token) =>
            token.layoutRole === "matrix-left-bracket" ||
            token.layoutRole === "matrix-right-bracket"
        )
        .map((token) => [token.text, token.layoutRole]),
      fixture.target.tokens
        .filter(
          (token) =>
            token.layoutRole === "matrix-left-bracket" ||
            token.layoutRole === "matrix-right-bracket"
        )
        .map((token) => [token.text, token.layoutRole]),
      fixture.target.tokens
        .filter(
          (token) =>
            token.role === "matrix-entry" || token.role === "vector-entry"
        )
        .map((token) => [
          token.text,
          token.selectorId,
          token.matrixPosition
        ]),
      fixture.expectedRoleChanges.map((roleChange) => [
        roleChange.sourceRole,
        roleChange.targetRole,
        roleChange.sourceText,
        roleChange.targetText
      ])
    ]),
    [
      [
        "matrix.bracket.change-delimiter",
        "changeMatrixDelimiter",
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["(", "matrix-left-bracket"],
          [")", "matrix-right-bracket"]
        ],
        [
          ["1", "entry.r0.c0", { row: 0, column: 0 }],
          ["0", "entry.r0.c1", { row: 0, column: 1 }],
          ["0", "entry.r1.c0", { row: 1, column: 0 }],
          ["1", "entry.r1.c1", { row: 1, column: 1 }]
        ],
        []
      ],
      [
        "matrix.entry.update",
        "updateMatrixEntry",
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["1", "entry.r0.c0", { row: 0, column: 0 }],
          ["2", "entry.r0.c1", { row: 0, column: 1 }],
          ["6", "entry.r1.c0", { row: 1, column: 0 }],
          ["4", "entry.r1.c1", { row: 1, column: 1 }]
        ],
        [["matrix-entry", "matrix-entry", "3", "6"]]
      ],
      [
        "matrix.row.swap",
        "swapMatrixRows",
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["c", "entry.c", { row: 0, column: 0 }],
          ["d", "entry.d", { row: 0, column: 1 }],
          ["a", "entry.a", { row: 1, column: 0 }],
          ["b", "entry.b", { row: 1, column: 1 }]
        ],
        [
          ["matrix-row", "matrix-row", "row-0", "row-1"],
          ["matrix-row", "matrix-row", "row-1", "row-0"]
        ]
      ],
      [
        "vector.transpose.column-to-row",
        "transposeVector",
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["[", "matrix-left-bracket"],
          ["]", "matrix-right-bracket"]
        ],
        [
          ["x", "vector.x", { row: 0, column: 0 }],
          ["y", "vector.y", { row: 0, column: 1 }]
        ],
        [
          ["vector-entry", "vector-entry", "x", "x"],
          ["vector-entry", "vector-entry", "y", "y"]
        ]
      ]
    ]
  );
});

test("KaTeX visual artifact lifecycle records cover stable artifact categories", () => {
  assert.deepEqual(
    katexVisualArtifactLifecycleRecords.map(
      summarizeVisualArtifactLifecycleRecord
    ),
    [
      {
        id: "artifact.fraction-bar.enter",
        kind: "fraction-bar",
        phase: "enter",
        sourceArtifactIds: [],
        targetArtifactIds: [
          "fraction.make.inline-to-stacked.target.frac-line"
        ],
        sourceVisualLifecycle: undefined,
        targetVisualLifecycle: "enter"
      },
      {
        id: "artifact.matrix-bracket.replace-delimiter",
        kind: "matrix-bracket",
        phase: "replace",
        sourceArtifactIds: [
          "matrix.bracket.change-delimiter.source.left-bracket",
          "matrix.bracket.change-delimiter.source.right-bracket"
        ],
        targetArtifactIds: [
          "matrix.bracket.change-delimiter.target.left-bracket",
          "matrix.bracket.change-delimiter.target.right-bracket"
        ],
        sourceVisualLifecycle: "exit",
        targetVisualLifecycle: "enter"
      },
      {
        id: "artifact.radical-glyph.enter",
        kind: "radical-glyph",
        phase: "enter",
        sourceArtifactIds: [],
        targetArtifactIds: [
          "radical.rewrite-power-as-root.target.hide-tail",
          "radical.rewrite-power-as-root.target.sqrt-line",
          "radical.rewrite-power-as-root.target.sqrt-glyph"
        ],
        sourceVisualLifecycle: undefined,
        targetVisualLifecycle: "enter"
      },
      {
        id: "artifact.accent.exit-overline",
        kind: "accent",
        phase: "exit",
        sourceArtifactIds: ["accent.strip-overline.source.overline"],
        targetArtifactIds: [],
        sourceVisualLifecycle: "exit",
        targetVisualLifecycle: undefined
      }
    ]
  );
});

function token(id: string, top: number): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top, width: 10, height: 12 },
    localRect: { left: 0, top, width: 10, height: 12 },
    row: 0
  };
}

function fakeElement(
  className: string,
  textContent: string,
  elementRect: KatexTokenRect,
  children: HTMLElement[] = []
): HTMLElement {
  return {
    className,
    textContent,
    children,
    getBoundingClientRect: () => elementRect
  } as unknown as HTMLElement;
}

function rect(
  left: number,
  top: number,
  width: number,
  height: number
): KatexTokenRect {
  return { left, top, width, height };
}
