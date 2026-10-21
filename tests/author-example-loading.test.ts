import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import type { SupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";

const examples: readonly { task: SupportedAuthorTask; maximumFiles: number }[] = [
  { task: "equation.algebra-intuition", maximumFiles: 12 },
  { task: "equation.composed-algebra", maximumFiles: 10 },
  { task: "equation.common-factor", maximumFiles: 10 },
  { task: "equation.fraction-chain", maximumFiles: 9 },
  { task: "bayes.binary", maximumFiles: 12 },
  { task: "mechanics.momentum-energy", maximumFiles: 14 }
];

for (const { task, maximumFiles } of examples) {
  test(`${task}: starter source loads independently of compilation and still checks`, async () => {
    const child = spawnSync(process.execPath,
      ["--disable-warning=ExperimentalWarning", "tests/fixtures/author-example-load.ts", task],
      { encoding: "utf8", timeout: 30_000 });
    assert.equal(child.status, 0, child.stderr);
    const { example, files }: { example: unknown; files: string[] } = JSON.parse(child.stdout);
    assert.ok(files.length <= maximumFiles, `${files.length} files exceeds ${maximumFiles}: ${files.join("\n")}`);
    assert.equal(files.some(path => /\/animation\/|\/reader\/|\/algebra\/compile\.ts|\/domain-ir\//.test(path)), false,
      "An example must not acquire animation, renderer or compiler capabilities.");
    assert.equal((await checkAuthorTask(task, JSON.stringify(example))).status, "checked");
  });
}
