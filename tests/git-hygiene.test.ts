import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { auditGit, parseGitRefRecord } from "../scripts/git-hygiene.ts";

test("ref parsing requires complete fields and a full object id before ancestry checks", () => {
  for (const width of [40, 64]) {
    const tip = "a".repeat(width);
    for (const extra of ["", "refs/remotes/origin/main"])
      assert.deepEqual(parseGitRefRecord(`feature/example\0${tip}\0${extra}`), { name: "feature/example", tip, extra });
  }
  for (const row of ["", "feature/example", "feature/example\0abc\0", `\0${"a".repeat(40)}\0`,
    `feature/example\0${"a".repeat(40)}`, `feature/example\0${"a".repeat(40)}\0\0`,
    `feature/example\0${"z".repeat(40)}\0`])
    assert.throws(() => parseGitRefRecord(row), /Malformed Git ref record/);
});

function fixture(t: test.TestContext) {
  const scratch = resolve("tmp/codex");
  mkdirSync(scratch, { recursive: true });
  const parent = mkdtempSync(join(scratch, "git-hygiene-"));
  const root = join(parent, "repo");
  mkdirSync(root);
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const git = (...args: string[]) => execFileSync("git", [
    "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false",
    "-c", "user.name=Hygiene Test", "-c", "user.email=hygiene@example.invalid", ...args,
  ], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "-b", "main");
  git("commit", "--allow-empty", "-m", "fixture");
  git("remote", "add", "origin", "git@github.com:kyleeschen1/kp.git");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  git("checkout", "-b", "feature/current");
  return { root, parent, git };
}

test("only incorporated, backed-up, unoccupied disposable branches are candidates", t => {
  const { root, parent, git } = fixture(t);
  git("branch", "feature/done");
  git("branch", "dev");
  git("branch", "release/kept");
  git("worktree", "add", "-b", "feature/occupied", join(parent, "work tree"));
  git("checkout", "-b", "feature/unique");
  git("commit", "--allow-empty", "-m", "unique");
  git("checkout", "feature/current");
  const audit = auditGit(root);
  assert.deepEqual(audit.branches.filter(b => b.candidate).map(b => b.name), ["feature/done"]);
  assert.equal(audit.worktrees.find(w => w.branch === "feature/occupied")?.path, join(parent, "work tree"));
  assert.ok(audit.branches.find(b => b.name === "feature/unique")?.reasons.includes("commits outside current HEAD"));
});

test("unbacked commits and non-KP push URLs prevent candidate classification", t => {
  const { root, git } = fixture(t);
  git("commit", "--allow-empty", "-m", "unbacked");
  git("branch", "feature/unbacked");
  assert.equal(auditGit(root).branches.find(b => b.name === "feature/unbacked")?.candidate, false);
  git("update-ref", "refs/remotes/origin/current", "HEAD");
  assert.equal(auditGit(root).branches.find(b => b.name === "feature/unbacked")?.candidate, true);
  git("remote", "set-url", "--push", "origin", "https://example.invalid/kp.git");
  assert.equal(auditGit(root).branches.some(b => b.candidate), false);
});

test("a branch's own upstream must exist and contain its tip", t => {
  const { root, git } = fixture(t);
  git("commit", "--allow-empty", "-m", "next");
  git("branch", "feature/done");
  git("branch", "--set-upstream-to=origin/main", "feature/done");
  git("update-ref", "refs/remotes/origin/current", "HEAD");
  assert.equal(auditGit(root).branches.find(b => b.name === "feature/done")?.candidate, false);
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  assert.equal(auditGit(root).branches.find(b => b.name === "feature/done")?.candidate, true);
  git("update-ref", "-d", "refs/remotes/origin/main");
  assert.equal(auditGit(root).branches.find(b => b.name === "feature/done")?.candidate, false);
});

test("reports dirt, stashes and ahead/behind without changing files, refs or index", t => {
  const { root, git } = fixture(t);
  git("branch", "--set-upstream-to=origin/main");
  writeFileSync(join(root, "saved.txt"), "stash this");
  git("add", "saved.txt");
  git("stash", "push", "-m", "fixture stash");
  git("commit", "--allow-empty", "-m", "ahead");
  writeFileSync(join(root, "untracked.txt"), "keep this");
  const refs = git("show-ref");
  const status = git("status", "--porcelain");
  const tree = git("write-tree");
  const audit = auditGit(root);
  assert.equal(audit.stashCount, 1);
  assert.equal(audit.dirty.length, 1);
  assert.equal(audit.branches.find(b => b.name === audit.branch)?.ahead, 1);
  assert.equal(audit.branches.find(b => b.name === audit.branch)?.behind, 0);
  assert.equal(git("show-ref"), refs);
  assert.equal(git("status", "--porcelain"), status);
  assert.equal(git("write-tree"), tree);
});

test("detached HEAD and a missing origin remain explicit", t => {
  const { root, git } = fixture(t);
  git("checkout", "--detach");
  git("remote", "remove", "origin");
  const audit = auditGit(root);
  assert.equal(audit.branch, null);
  assert.equal(audit.trustedOrigin, false);
  assert.equal(audit.branches.some(b => b.candidate), false);
});
