# Transformation and correspondence enforcement

Two executable regressions failed before repair: generic transformation validation
accepted an identity record with two sources, and composition accepted malformed
relation maps. Selector existence alone was being mistaken for relation validity.

The shared transformation validator now delegates rich-map shape checks to the
existing correspondence owner. Endpoint lists must contain distinct nonempty IDs;
repeating one descendant no longer fabricates fan-out multiplicity. Sequence and
parallel composition validate inputs and results. Unsupported branching or
namespace collisions yield `KpCorrespondenceCompositionRepairGap`, not a made-up
valid relation. Single-map composition also retains the requested result ID.

Broader verification exposed a valid internal lifecycle: a factor introduced and
canceled entirely inside a sequence previously produced an invalid zero-to-zero
boundary record. The shared composition now omits boundaryless material while
retaining both intermediate input traces. That repairs the law at its owner,
rather than deleting the fractional-transfer test or disabling shape validation.

The governed public compiler already consumes animation-asset validation. A new
integration regression confirms duplicated endpoints become an asset diagnostic
and cannot produce verified construction. Raw authoring/compatibility structures
remain constructible; checked pipeline acceptance is the enforcement boundary.
Static relation kinds remain useful, but cardinality/uniqueness of external arrays
is a runtime obligation. No catalogue-wide tuple migration was introduced.

Verification: 63 focused semantic/domain checks, then 37 focused law/interpreter
checks after the internal-lifecycle repair; 254 semantic-convergence checks; seven
governed compiler/repair checks; full types all pass. Cohorts overlap. The first
convergence run was 252/253 before the internal-lifecycle repair; the complete
rerun passed, not a waived or omitted failure.

These guarantees concern reference closure, declared relation shape, composition
boundaries and honest diagnostics. A `strict` law-reference string is still not
proof of arbitrary mathematics; domain evaluators/certificates retain that role.
Valid partial maps and explicit lax/lossy interpreter behavior remain supported
and tested. KP has executable law checks and disciplined composition vocabulary,
not a certified universal category or symbolic theorem prover.
