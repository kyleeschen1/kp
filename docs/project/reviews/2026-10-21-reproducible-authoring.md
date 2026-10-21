# Reproducible authoring: evidence and limits

The approved proposal owns scope; `run-contract.kp.reproducible-authoring-v1`
owns execution. The source-only calculus transfer remains mathematical evidence,
not acceptance of its presentation or a learning-effectiveness claim.

Baseline at `3f9116b34`: calculus supports checking and explicit preview, with
source-pinned locations requiring manual source reapplication after reload. There
is no edition command. Composed algebra already has immutable static editions,
exact-source reproduction and altered-byte rejection. Shared boundaries are
the compiled publication envelope, immutable edition writer and stylesheet
closure collector. Their existence does not establish complete output-directory
integrity or concurrent-write behavior; those are investigated in this run.

Baseline command `node --disable-warning=ExperimentalWarning --test
tests/calculus-authoring-transfer.test.ts tests/composed-algebra-publication.test.ts
tests/composed-algebra-publication-v2.test.ts` passes all nine tests.
`npm run measure:change-propagation` measures the existing production output:
76,642 declared initial JS bytes / 25,222 gzip; CSS 40,345 / 10,893 gzip;
HTML 58,781 / 6,004 gzip. This excludes fonts, dynamic editing imports and network
overhead. It is an asset-size baseline, not a timing measurement.

Identity contract: reuse the existing artifact `source.sha256` for exact selected
UTF-8 bytes, calculus `model.revision` for normalized source (including prose and
initial controls), and the writer-issued `byteEditionId` for the complete output
manifest. Whitespace may change source bytes without changing explanation identity;
styles/reader bytes may change the edition without changing the explanation.
Neither a valid envelope nor a digest proves mathematical truth: the domain
compiler must reproduce the publication from the selected source. No universal
identity migration or new identity type is required.
