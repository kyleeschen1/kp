import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import type { SupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

const examples: readonly { task: SupportedAuthorTask; maximumFiles: number }[] = [
  { task: "calculus.change-propagation", maximumFiles: 7 },
  { task: "equation.algebra-intuition", maximumFiles: 12 },
  { task: "equation.composed-algebra", maximumFiles: 10 },
  { task: "equation.common-factor", maximumFiles: 10 },
  { task: "equation.fraction-chain", maximumFiles: 9 },
  { task: "bayes.binary", maximumFiles: 12 },
  { task: "mechanics.momentum-energy", maximumFiles: 14 },
  { task: "equation.logarithm-base", maximumFiles: 9 },
  { task: "reasoning.code", maximumFiles: 9 },
  { task: "graph3d.saddle", maximumFiles: 9 },
  { task: "reasoning.equation", maximumFiles: 8 },
  { task: "graph2d.supply-tax", maximumFiles: 7 }
];

test("every discoverable example participates in the loading gate", () => {
  assert.deepEqual(examples.map(({ task }) => task).sort(), Object.keys(supportedAuthorTasks).sort());
});

for (const { task, maximumFiles } of examples) {
  test(`${task}: starter source loads independently of compilation and still checks`, async () => {
    const child = spawnSync(process.execPath,
      ["--disable-warning=ExperimentalWarning", "tests/fixtures/author-example-load.ts", task],
      { encoding: "utf8", timeout: 30_000 });
    assert.equal(child.status, 0, child.stderr);
    const { example, files }: { example: unknown; files: string[] } = JSON.parse(child.stdout);
    assert.ok(files.length <= maximumFiles, `${files.length} files exceeds ${maximumFiles}: ${files.join("\n")}`);
    assert.equal(files.some(path => /\/animation\/|\/reader\/|\/editor\/|\/algebra\/compile\.ts/.test(path)), false,
      "An example must not acquire animation, renderer or compiler capabilities.");
    assert.equal((await checkAuthorTask(task, JSON.stringify(example))).status, "checked");
  });
}
