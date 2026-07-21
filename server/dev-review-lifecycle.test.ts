import assert from "node:assert/strict";
import test from "node:test";

import {
  listKpDevReviewLifecycleTargets,
  validateKpDevReviewLifecycleTransition
} from "./dev-review-lifecycle.ts";

test("review lifecycle follows explicit triage, work, and verification stages", () => {
  assert.deepEqual(listKpDevReviewLifecycleTargets("new"), [
    "discussed",
    "grouped",
    "accepted",
    "dismissed"
  ]);
  assert.deepEqual(validateKpDevReviewLifecycleTransition("new", "accepted"), {
    from: "new",
    to: "accepted"
  });
  assert.deepEqual(validateKpDevReviewLifecycleTransition("accepted", "fixed"), {
    from: "accepted",
    to: "fixed"
  });
  assert.deepEqual(validateKpDevReviewLifecycleTransition("fixed", "verified"), {
    from: "fixed",
    to: "verified"
  });
});

test("lifecycle rejects skips, no-ops, and unexplained terminal decisions", () => {
  assert.throws(
    () => validateKpDevReviewLifecycleTransition("new", "verified"),
    /cannot transition/
  );
  assert.throws(
    () => validateKpDevReviewLifecycleTransition("accepted", "accepted"),
    /already accepted/
  );
  assert.throws(
    () => validateKpDevReviewLifecycleTransition("new", "dismissed"),
    /requires a reason/
  );
  assert.deepEqual(
    validateKpDevReviewLifecycleTransition("new", "dismissed", "  Not reproducible  "),
    { from: "new", to: "dismissed", reason: "Not reproducible" }
  );
  assert.throws(
    () => validateKpDevReviewLifecycleTransition("verified", "accepted"),
    /requires a reason/
  );
  assert.deepEqual(
    validateKpDevReviewLifecycleTransition("dismissed", "discussed", "New evidence"),
    { from: "dismissed", to: "discussed", reason: "New evidence" }
  );
});
