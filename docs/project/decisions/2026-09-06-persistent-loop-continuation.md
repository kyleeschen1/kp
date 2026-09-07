# Persistent loop continuation through nonvisual gates

Status: accepted
Date: 2026-09-06

The user directed: “Resume loop. Continue looping until visual approval is
needed (let's make that a persisent rule across sesssions).”

This extends `2026-09-06-nonvisual-preapproval-and-structural-repair.md` into an
explicit cross-session execution rule for approved KP loops. Continue routine
technical decisions, verification, diagnosis, bounded repairs and their commits
without returning to the user for nonvisual approval. A repairable failing gate
blocks promotion, not the work needed to repair it. Record failures honestly,
fix them within the approved direction, and rerun the relevant checks.

Existing contract references to failed or missing release evidence mean do not
advance past that gate with missing proof; they are not an instruction to end
the session while safe, in-scope repairs remain. For the current structural run,
resume s18 payload attribution/reduction and release verification, then stop at
G2 with working Focus Card URLs and concrete review questions. G2 and G3 remain
human visual gates; no supply-tax migration before G2 approval.

Do not raise budgets, weaken assertions, hide dependencies, change reviewed
visuals, broaden into unrelated work, merge, deploy, or change tool permissions.
Completion/exhausted approved scope, user pause, and genuine unresolved safety,
authority, scope or external blockers remain valid stops. Technical difficulty
or a newly discovered repairable failure is not itself such a blocker.

The root AGENTS.md makes this rule discoverable in future sessions. Theseus
retains ordered slices, live status and verification; this decision changes
continuation policy, not the approved 28-slice table or architecture.
