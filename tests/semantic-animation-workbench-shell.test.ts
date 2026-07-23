import assert from "node:assert/strict";
import test from "node:test";

import {
  renderKpSemanticAnimationWorkbenchShell
} from "../src/editor/semantic-animation-workbench-shell.ts";

test("Workbench shell renders a labeled search and two-pane control surface", () => {
  const html = renderKpSemanticAnimationWorkbenchShell({
    query: `radical "rewrite"`
  });

  assert.match(html, /data-kp-animation-workbench/);
  assert.match(html, /data-kp-animation-workbench-query/);
  assert.match(html, /data-kp-animation-workbench-results/);
  assert.match(html, /data-kp-animation-workbench-detail/);
  assert.match(html, /value="radical &quot;rewrite&quot;"/);
  assert.match(html, /data-action="show-editor"/);
});
