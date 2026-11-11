# First empirical pass: preserving flow during agent-assisted development

Status: investigation and proposed experiments, not a KP product pivot or a
change to model settings, approval policy, verification gates or run contracts.
The user asks to optimize valuable integrated progress per available cognitive
effort, including engagement and re-entry cost. ADHD and the reported cognitive
profile supply hypotheses; this investigation makes no clinical causal claim.

## Observed baseline

Read-only sources: local Codex `state_5.sqlite`, `thread_history_1.sqlite`, the
current conversation's rollout metadata, allowlisted settings in `config.toml`,
model catalogue metadata, Stop hooks, and the actual KP delivery instructions.
No credentials, raw conversations or reasoning content are retained here.

The useful first cohort is **28 completed turns in this product conversation,
November 8–9, 2026 UTC**. Classifications below were manually reviewed from the
requests and their surrounding context. They describe task mix, not randomized
comparisons of models, prompt quality or task specificity.

| Request class | n | Median | p90 | p95 |
| --- | ---: | ---: | ---: | ---: |
| All completed turns | 28 | 6.22 min | 37.08 min | 51.48 min |
| Discussion/planning | 14 | 1.92 min | 5.57 min | 9.05 min |
| Diagnosis/environment | 4 | 7.56 min | 17.28 min | 17.28 min |
| Implementation/approved continuation | 10 | 23.60 min | 51.48 min | 58.82 min |

Use `(completed_at - started_at)`, not the ambiguously named `duration_ms` field.
One recent completed turn spans 58.82 minutes but stores 56.42 minutes. An older
turn spans 197.83 minutes but stores 14.17 minutes. Pauses/resumption may explain
some differences, but their meaning is not established. Elapsed time is not
pure compute time. Rounded second timestamps add at most approximately a second
of boundary uncertainty. Percentiles use nearest rank; medians average the two
central observations. Small-sample tail estimates are descriptive only.

Four interrupted turns in the recent cohort are reported separately: elapsed
start-to-interruption spans of about 109.42, 0.03, 14.27 and 37.43 minutes. The
current investigation is in progress and excluded. Excluding interrupted work
can make completed-turn statistics look better; it does not erase its cost.
This cohort is predominantly one conversation, not a representative sample of
every Codex project, task or day.

Reproduce the overall timing table using the read-only local database:

```sql
WITH ranked AS (
  SELECT (completed_at-started_at)/60.0 AS minutes,
    row_number() OVER(ORDER BY completed_at-started_at) AS rn,
    count(*) OVER() AS n
  FROM thread_turns
  WHERE thread_id='01a193ad-f2a5-7c00-9917-3c0c522f300d'
    AND started_at>=1794096000
    AND started_at<1794268800
    AND status='completed'
)
SELECT count(*) AS n,
  avg(CASE WHEN rn IN ((n+1)/2,(n+2)/2) THEN minutes END) AS median,
  max(CASE WHEN rn=(9*n+9)/10 THEN minutes END) AS p90,
  max(CASE WHEN rn=(19*n+19)/20 THEN minutes END) AS p95
FROM ranked;
```

The upper bound freezes the cohort rather than silently including future work.
Python aggregation and an independent SQLite window query agreed on 28, 6.22,
37.08 and 51.48. The one-off analysis and private excerpts were discarded.

## Where time went in two concrete turns

**Typography request, November 8:** 7 min 26 s elapsed, first recorded file change
at 2 min 57 s, first preview-link message near 7 min 22 s. There were 60 shell
invocations. Browser commands reported 217 seconds in total. The union of
recorded tool lifecycle intervals was 241 seconds. A first file change is not
proof that a usable preview was already available.

**“Much better! resume,” November 9:** 37 min 5 s elapsed. The actual early
editorial-review link was sent at 23 min 59.8 s, final response near minute 37.
Early review therefore already overlapped about 13 minutes of closeout, but its
24-minute initial delay still could not support rapid exploration.

| Recorded command category in that turn | Summed reported process duration |
| --- | ---: |
| Browser checks | 479 s |
| Type checks | 210 s |
| Other checks | 54 s |
| Coordination/status/evidence commands | 43 s |
| Builds | 16 s |
| Checkpoint/backup commands | 9 s |

217 shell invocations included 118 classified inspections and 40 coordination
commands. Three full typechecks and two builds were actually run. Some repetition
followed real repairs, so removing all repeated verification would be unjustified.
Counts are shell invocations, **not model round trips**. Classification uses
command patterns with coordination matched first, so a verification record
mentioning a test does not count as executing that test.

Command durations overlap and must not be added as an elapsed-time partition.
The union of recorded tool lifecycle intervals covers 663 seconds (11.05 min)
of the 37.08-minute turn. The remaining approximately 26.03 minutes are
**unallocated**: they cannot be labeled inference, reasoning or queueing time.
Complete request/provider/approval timing was not established from the inspected
telemetry. Tool spans also do not establish how long the human was blocked.

A dependent content sequence on November 9—discuss exemplar, revise opening,
then resume the fractional explanation—spanned 67 min 36 s, containing 57 min
28 s of completed-turn elapsed time. The remaining intervals cannot be assigned
to active review, preparation, re-entry or unrelated activity from these logs.

## Configuration and workflow findings

- Current user configuration: `gpt-6-astra`, `xhigh` reasoning, workspace-write,
  on-request approvals. Recent recorded thread settings include default service
  tier and xhigh/medium effort. Most context records are xhigh; two medium
  contexts belong to discussion. This is insufficient for a speed/quality A/B.
- The local catalogue lists GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Sol, GPT-6 Luna and
  GPT-6 Astra with several effort options. Catalogue presence does not measure
  this user's performance or guarantee that a setting applies identically on
  every client. CLI reports 0.166.0; inspected thread metadata includes 0.167.0.
- The global Stop hook sends a desktop completion notification (5-second timeout).
  The KP Stop hook queries Theseus and reminds the agent to continue unfinished
  approved work; its query has an 8-second timeout and fails open. Actual hook
  overhead was not isolated. This is no evidence of a minutes-long hook delay.
- Repeated “go as long as possible” instructions, persistent-loop continuation,
  broad integration checks and durable evidence favor substantial autonomous
  completion. That mode is valuable when it is off the human's critical path.
- Existing visual-discovery instructions already allow one reversible exemplar
  with small smoke/preservation checks before broader promotion. An interactive
  path can respect that distinction; it need not waive correctness or release gates.

Official OpenAI documentation supports deliberately comparing reasoning effort
against quality and latency, rather than applying xhigh universally:
[reasoning effort](https://developers.openai.com/api/docs/guides/deployment-checklist#set-up-reasoningeffort).
The [command reference](https://learn.chatgpt.com/docs/developer-commands)
documents `/model`, `/status` and catalogue-dependent `/fast`. A Fast tier may
increase usage; it was neither enabled nor benchmarked here.

## Competing explanations and small experiments

1. **Delayed meaningful feedback / interrupted generativity.** Prediction: a usable
   small result preserves engagement better than frequent status messages at a
   similar eventual completion time. Pilot four real, bounded local edits with
   one visible change and early provisional preview. Record time to preview and
   verified completion separately; do not deliberately add delays for a control.
   Historical comparison is directional, not a causal effect estimate.
2. **Agent effort or orchestration dominates the fast path.** Within that same
   narrow workflow, compare four matched real edits at Astra xhigh versus medium,
   in alternating/counterbalanced order, with equivalent correctness checks.
   Track usable preview, accepted result and subsequent repair. Only then consider
   a different model such as the catalogue's Sol option. Avoid changing model,
   effort, scope and checks simultaneously and attributing the difference to one.
3. **Task-state reconstruction or review burden dominates even after speed improves.**
   At unavoidable pauses, compare an ordinary technical recap with an agent-written
   return cue: the current hypothesis, why it matters, and one concrete next action
   at the exact artifact. Keep the visible review to one change and one judgment.
   If the next action is clear but re-engagement stays difficult, factual recall
   alone is an inadequate explanation; motivation, agency and competing attention
   remain live hypotheses. Separate cue versus review-format changes in subsequent
   observations if the pilot warrants more testing.

Use an optional single response at at most three checkpoints per session:
“still engaged / easy return / lost momentum.” If momentum was lost, a rough
re-entry band can be supplied voluntarily: under 1 min, 1–5 min, over 5 min, or
did not return. The agent owns timestamps and bookkeeping. Silence is missing
data, not proof of disengagement. Next-message delay is only a proxy for return.
Collect naturally occurring delays into coarse bins before trying to estimate
a threshold; do not fit a precise psychological curve from a handful of cases.

The experiments do not establish learning, clinical mechanisms, or a universal
latency threshold. In a controlled study, interrupted participants sometimes
completed work faster while reporting greater stress/effort, supporting separate
measurement of output and subjective cost: [Mark et al., 2008](https://www.ics.uci.edu/~gmark/chi08-mark.pdf).
Ready-to-resume research supports testing transition cues, but measured attention
on interrupting tasks, not this user's return to creative programming:
[Leroy and Glomb, 2018](https://pubsonline.informs.org/doi/10.1287/orsc.2017.1184).

## Immediate recommendation

Start with **one local experiment per interactive request**, plus an automatically
written **return cue**. For known local changes, aim for useful feedback inside
60 seconds as a test target, not a promised capability. If the edit exposes a
larger blocker, report that boundary promptly rather than silently expanding it
into an engineering campaign. Keep required checks before declaring completion;
defer broad integration to its proper boundary. Avoid CPU-heavy background
checks while the human is judging motion.

Infer this mode from an exploratory request rather than requiring a new ritual.
Long autonomous work remains appropriate for explicitly independent work. Keep
the source snapshot stable during a human preview; a checking worker must not
silently mutate the surface being judged. Parallelism has no demonstrated human
benefit yet and should be evaluated by review/re-entry burden as well as time.

Existing browser tools can support direct, reversible CSS experiments for layout
or typography. A general animation playground, Spindle integration, dashboard,
notification system or new task manager is not justified by this first pass.
No current evidence makes prompt shortening or faster builds the first priority.
