# Projection loses a distinction: authoring reuse trial

Approved by “go” after the recommendation to author another algebra/LA
explanation and repair demonstrated authoring friction. Uses the KP delivery
workflow; Theseus owns live package status.

Reader question: how can two different input vectors produce the same output?
Assume coordinate pairs, scalar multiplication and vector addition are familiar;
introduce the column-combination reading explicitly. This is a conceptual
interpretation, not another Gaussian elimination procedure.

Use A = [[1, 0], [0, 0]] and B = [[3, 3], [2, -1]]. Each column of B is one
input. The first coordinate weights A's first column; the second coordinate
weights its zero column. Both inputs therefore produce [3, 0]. The loss is in
the forward mathematical map, not in playback. Reversing the animation knows
the retained source and does not invert the map.

Static baseline: two vector-sum equations and the argument that changing the
weight of a zero vector cannot change the sum. Motion's proposed advantage is
tracking each input weight into its own contribution, then locating the point
where different values stop affecting the result. Scrubbing permits inspection
of that correspondence. The existing per-column selector compares the inputs;
the full argument and transfer question remain readable outside playback.
Transfer: [3, 7] also maps to [3, 0]; [4, 2] maps to [4, 0]. Not all input
differences disappear. No claim about comprehension or arbitrary matrix rank.

Canonical source: `content/authoring/linear-algebra/projection-loss.ts`.
Host: `/experiments/matrix-column-combinations/?input=projection-loss`.
Renderer: the existing local native KaTeX column-combination presentation and
continuity owner, not a claim of universal canonical compositor certification.
Semantic truth: `matrixProduct` and `columnCombinations`, through `M.matrix` and
`M.product`. Preserve immutable entry identity, derived contributions, endpoint
placement, direct seek/reverse, shared config, typography and lifecycle.

Observed friction: numeric sources need no engine edits, but the host owns
generic prose/cues and duplicates the source ID menu. Allow bounded source-owned
plain text keyed to the existing milestones, with a selected-column cue set;
derive source navigation from the same input registry. No author geometry,
timing, HTML, new renderer, clock or mathematical proof system.

Packages:
1. Author the explanation and source; verify exact results, lost versus retained
   distinctions, identity and supported-shape boundaries.
2. Connect the small editorial seam to the existing host; run focused unit/types
   and a Chromium exemplar/preservation check. Capture a working review URL and
   source/API friction ledger. One source or the optional editorial seam is the
   independently reversible rollback unit.
3. Human review of the explanation's usefulness, inference bridges and comparison
   experience before wider reuse. No aesthetic promotion or broad rollout during
   this trial. After acceptance, record the outcome and remaining API limits.

Three-hour ceiling; reserve the final 30 minutes for verification, evidence and
backup. Stop at the exemplar checkpoint, completion, resource ceiling or a genuine
external blocker. No agents, paid services or publication. Keep existing unrelated
work intact. A typed unsupported gap is preferable to an invented presentation.
