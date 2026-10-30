import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function git(cwd: string, args: string[], allowMissing = false): string {
  // Auditing must not refresh/write an index or prompt for credentials.
  const result = spawnSync("git", ["--no-optional-locks", ...args], {
    cwd, encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (allowMissing && result.status === 1) return "";
  if (result.error || result.status !== 0) {
    throw new Error(`git ${args[0]} failed: ${result.error?.message ?? result.stderr.trim()}`);
  }
  return result.stdout.trimEnd();
}

function ancestor(cwd: string, from: string, to: string): boolean {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", from, to], { cwd, encoding: "utf8" });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`Cannot verify ancestry: ${result.error?.message ?? result.stderr.trim()}`);
}

function lines(value: string): string[] { return value ? value.split("\n") : []; }

export function auditGit(cwd: string) {
  const root = git(cwd, ["rev-parse", "--show-toplevel"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], true) || null;
  const worktrees = git(root, ["worktree", "list", "--porcelain", "-z"])
    .split("\0\0").filter(Boolean).map(record => {
      const fields = record.split("\0");
      return {
        path: fields.find(field => field.startsWith("worktree "))?.slice(9) ?? "",
        branch: fields.find(field => field.startsWith("branch refs/heads/"))?.slice(18) ?? null,
        locked: fields.some(field => field.startsWith("locked")),
        prunable: fields.some(field => field.startsWith("prunable")),
      };
    });
  const origin = lines(git(root, ["remote"])).includes("origin");
  const pushUrls = origin ? lines(git(root, ["remote", "get-url", "--push", "--all", "origin"])) : [];
  const trustedUrls = new Set([
    "git@github.com:kyleeschen1/kp.git", "ssh://git@github.com/kyleeschen1/kp.git",
    "https://github.com/kyleeschen1/kp.git",
  ]);
  const trustedOrigin = pushUrls.length > 0 && pushUrls.every(url => trustedUrls.has(url));
  // A tracking ref is only local evidence. Re-fetch and verify live remote tips before deletion.
  const backups = trustedOrigin ? lines(git(root, ["for-each-ref", "refs/remotes/origin/",
    "--format=%(refname)%00%(objectname)%00%(symref)"]))
    .map(line => line.split("\0")).filter(([, , symbolic]) => !symbolic) : [];
  const branches = lines(git(root, ["for-each-ref", "refs/heads/",
    "--format=%(refname:short)%00%(objectname)%00%(upstream)"])).map(line => {
    const [name, tip, upstreamRef] = line.split("\0");
    const heldBy = worktrees.filter(tree => tree.branch === name).map(tree => tree.path);
    const contained = ancestor(root, tip, head);
    const backup = backups.find(([, remoteTip]) => ancestor(root, tip, remoteTip))?.[0] ?? null;
    const reasons: string[] = [];
    if (!/^(feature|spike|codex)\//.test(name)) reasons.push("protected or outside disposable branch namespaces");
    if (name === branch) reasons.push("current checkout");
    if (heldBy.length) reasons.push("attached worktree");
    if (!contained) reasons.push("commits outside current HEAD");
    if (!backup) reasons.push("no cached backup on trusted origin");
    const upstreamTip = upstreamRef ? lines(git(root, ["for-each-ref", upstreamRef,
      "--format=%(refname)%00%(objectname)"])).map(value => value.split("\0"))
      .find(([ref]) => ref === upstreamRef)?.[1] ?? "" : "";
    if (upstreamRef && (!upstreamTip || !ancestor(root, tip, upstreamTip))) reasons.push("upstream missing or lacks branch tip");
    const counts = upstreamTip ? git(root, ["rev-list", "--left-right", "--count", `${tip}...${upstreamTip}`]).split(/\s+/).map(Number) : null;
    return { name, tip, upstream: upstreamRef || null, ahead: counts?.[0] ?? null,
      behind: counts?.[1] ?? null, heldBy, contained, backup, candidate: reasons.length === 0, reasons };
  });
  return {
    root, head, branch, trustedOrigin, worktrees, branches,
    dirty: lines(git(root, ["status", "--short", "--untracked-files=normal"])),
    stashCount: lines(git(root, ["stash", "list", "--format=%gd"])).length,
  };
}

export function formatAudit(audit: ReturnType<typeof auditGit>): string {
  const current = audit.branches.find(branch => branch.name === audit.branch);
  return [
    `Checkout: ${audit.branch ?? "DETACHED"} at ${audit.head.slice(0, 12)}`,
    `Upstream: ${current?.upstream ?? "none"}; ahead ${current?.ahead ?? "?"}, behind ${current?.behind ?? "?"}`,
    `Origin push destination: ${audit.trustedOrigin ? "verified KP URL" : "absent or outside standing authorization"}`,
    `Dirty entries: ${audit.dirty.length}; stashes: ${audit.stashCount}`,
    ...audit.dirty.map(line => `  ${line}`),
    "Worktrees (only current checkout's dirt inspected):",
    ...audit.worktrees.map(tree => `  ${tree.path}: ${tree.branch ?? "detached"}${tree.locked ? " [locked]" : ""}${tree.prunable ? " [prunable]" : ""}`),
    "Local branches:",
    ...audit.branches.map(branch => `  ${branch.candidate ? "REVIEW" : "KEEP"} ${branch.name} ${branch.tip.slice(0, 12)} — ${branch.candidate ? `contained in HEAD; cached backup ${branch.backup}` : branch.reasons.join("; ")}`),
    "Read-only, offline snapshot. REVIEW is a candidate, not deletion authorization.",
    "Before cleanup: refresh origin, verify live backup, confirm ownership, recheck worktrees and ancestry.",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== "--json")) throw new Error("Usage: npm run git:hygiene -- [--json]");
    const audit = auditGit(process.cwd());
    console.log(args.includes("--json") ? JSON.stringify(audit, null, 2) : formatAudit(audit));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
