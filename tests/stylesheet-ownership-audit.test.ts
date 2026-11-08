import assert from "node:assert/strict";
import test from "node:test";
import { stylesheetDeclarationGroups, stylesheetReferences } from "../scripts/audit-stylesheet-ownership.ts";

test("inventory recognizes entry imports and literal build/HTML consumers", () => {
  const refs = stylesheetReferences('import "./entry.css";\nconst css = ["experiments/family/style.css"];\nconst html = `<link href="/src/shared.css">`;');
  assert.deepEqual(refs, [
    { literal: "./entry.css", line: 1 },
    { literal: "experiments/family/style.css", line: 2 },
    { literal: "/src/shared.css", line: 3 }
  ]);
});

test("duplicate candidates preserve declaration order, importance and conditional context", () => {
  const groups = stylesheetDeclarationGroups(`
    .one { color: red; display: block; }
    .two { display: block; color: red; }
    @media (prefers-contrast: more) { .three { color: red; display: block; } }
    .four { color: red !important; display: block; }
    .weak { display: block; }
  `, "fixture.css");
  assert.equal(groups.length, 4);
  assert.notDeepEqual(groups[0]!.declarations, groups[1]!.declarations);
  assert.notDeepEqual(groups[0]!.context, groups[2]!.context);
  assert.notDeepEqual(groups[0]!.declarations, groups[3]!.declarations);
});
