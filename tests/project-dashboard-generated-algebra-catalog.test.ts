import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGeneratedAlgebraFixtureAgendaRows,
  createGeneratedAlgebraMaturityAgendaRows
} from "../src/project-dashboard/generated-algebra-catalog.ts";
import { projectDashboardData } from "../src/project-dashboard/data.ts";
import { renderProjectDashboard } from "../src/project-dashboard/render.ts";

test("generated algebra dashboard catalog exposes fixture agenda rows", () => {
  const rows = createGeneratedAlgebraFixtureAgendaRows("");

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-x-plus-3",
    "generated-linear-solve-y-plus-5",
    "generated-linear-solve-z-minus-4",
    "generated-linear-solve-three-x",
    "generated-linear-solve-two-x-plus-3",
    "generated-linear-solve-x-plus-one-half"
  ]);
  assert.deepEqual(rows[1]?.previewFields?.slice(0, 4), [
    { label: "Generated fixture", value: "generated.linear-solve.y-plus-5" },
    { label: "Initial LaTeX", value: "y + 5 = 12" },
    { label: "Solved LaTeX", value: "y = 7" },
    { label: "Trace steps", value: "4" }
  ]);
});

test("generated algebra dashboard catalog exposes family maturity rows", () => {
  const rows = createGeneratedAlgebraMaturityAgendaRows("");

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-family-maturity",
    "generated-fraction-expression-family-maturity",
    "generated-exponent-family-maturity",
    "generated-radical-family-maturity",
    "generated-function-wrap-family-maturity",
    "generated-distribution-family-maturity"
  ]);
  assert.deepEqual(rows[0]?.previewFields.slice(0, 7), [
    { label: "Fixture family", value: "generated.linear-solve" },
    { label: "Fixtures", value: "6" },
    { label: "Semantic objects", value: "27" },
    { label: "Transformations", value: "21" },
    { label: "Drill-down hooks", value: "7" },
    { label: "Flashcards", value: "25" },
    { label: "Dependency manifests", value: "iframe, static-step" }
  ]);
  assert.deepEqual(rows[3]?.previewFields.slice(0, 7), [
    { label: "Fixture family", value: "generated.radical" },
    { label: "Fixtures", value: "1" },
    { label: "Semantic objects", value: "2" },
    { label: "Transformations", value: "1" },
    { label: "Drill-down hooks", value: "0" },
    { label: "Flashcards", value: "1" },
    { label: "Dependency manifests", value: "iframe, static-step" }
  ]);
  assert.deepEqual(rows[5]?.previewFields.slice(0, 7), [
    { label: "Fixture family", value: "generated.distribution" },
    { label: "Fixtures", value: "2" },
    { label: "Semantic objects", value: "4" },
    { label: "Transformations", value: "2" },
    { label: "Drill-down hooks", value: "0" },
    { label: "Flashcards", value: "0" },
    { label: "Dependency manifests", value: "iframe, static-step" }
  ]);
});

test("generated algebra maturity rows are searchable by protocol coverage", () => {
  assert.deepEqual(
    createGeneratedAlgebraMaturityAgendaRows(
      "renderer-frame semantic-preservation dependency manifests"
    ).map((row) => row.id),
    [
      "generated-linear-solve-family-maturity",
      "generated-fraction-expression-family-maturity",
      "generated-exponent-family-maturity",
      "generated-radical-family-maturity",
      "generated-function-wrap-family-maturity",
      "generated-distribution-family-maturity"
    ]
  );
});

test("generated algebra maturity rows expose tutorial-card sample actions", () => {
  const row = createGeneratedAlgebraMaturityAgendaRows("generated.radical")[0];

  assert.equal(row?.id, "generated-radical-family-maturity");
  assert.ok(
    row.previewFields.some(
      (field) =>
        field.label === "Sample targets" &&
        field.value.includes(
          "Open generated rewrite square root as power tutorial card"
        )
    )
  );
  assert.deepEqual(row.previewLinks[0], {
    label: "Open generated rewrite square root as power tutorial card",
    href: "#project-dashboard-animation-layout-title",
    dataAttributes: [
      ["data-kp-preview-link", "tutorial-card"],
      [
        "data-kp-preview-tutorial-card",
        "tutorial.generated.radical.square-root-as-power.card.live-sample"
      ],
      ["data-kp-preview-manifest-id", "tutorial.linear-solve.card"],
      [
        "data-kp-preview-layout-id",
        "layout.sample.linear-solve-synchronized-panel"
      ],
      ["data-kp-preview-shared-clock-id", "solve-x-shared-clock"],
      [
        "data-kp-preview-katex-transform-fixture",
        "generated.radical.square-root-as-power"
      ]
    ]
  });
});

test("generated algebra dashboard catalog filters rows by search text", () => {
  const rows = createGeneratedAlgebraFixtureAgendaRows("x + 3 = 7");

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-x-plus-3",
    "generated-linear-solve-two-x-plus-3"
  ]);
});

test("generated algebra dashboard catalog searches transformation metadata", () => {
  const rows = createGeneratedAlgebraFixtureAgendaRows(
    "transform.generated.linear-solve.y-plus-5.cancel-additive-inverse"
  );

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-y-plus-5"
  ]);
});

test("generated algebra dashboard catalog exposes tutorial-card sample targets", () => {
  const [row] = createGeneratedAlgebraFixtureAgendaRows(
    "tutorial card generated.linear-solve.x-plus-3"
  );

  assert.equal(row?.id, "generated-linear-solve-x-plus-3");
  assert.ok(
    row.previewFields.some(
      (field) =>
        field.label === "Sample targets" &&
        field.value.includes("Open generated solve x plus 3 tutorial card")
    )
  );
  assert.deepEqual(row.previewLinks?.[0], {
    label: "Open generated solve x plus 3 tutorial card",
    href: "#project-dashboard-animation-layout-title",
    dataAttributes: [
      ["data-kp-preview-link", "tutorial-card"],
      [
        "data-kp-preview-tutorial-card",
        "tutorial.generated.linear-solve.x-plus-3.card.live-sample"
      ],
      ["data-kp-preview-manifest-id", "tutorial.linear-solve.card"],
      [
        "data-kp-preview-layout-id",
        "layout.sample.linear-solve-synchronized-panel"
      ],
      ["data-kp-preview-shared-clock-id", "solve-x-shared-clock"],
      [
        "data-kp-preview-katex-transform-fixture",
        "generated.linear-solve.x-plus-3"
      ]
    ]
  });
});

test("renderProjectDashboard links generated fixture rows to tutorial-card previews", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "generated-linear-solve-y-plus-5"
  });

  assert.match(html, /data-kp-preview-link="tutorial-card"/);
  assert.match(
    html,
    /data-kp-preview-tutorial-card="tutorial\.generated\.linear-solve\.y-plus-5\.card\.live-sample"/
  );
  assert.match(
    html,
    /data-kp-preview-katex-transform-fixture="generated\.linear-solve\.y-plus-5"/
  );
});
